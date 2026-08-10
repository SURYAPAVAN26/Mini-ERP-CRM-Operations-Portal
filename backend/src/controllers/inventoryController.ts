import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool, query } from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid('Valid product ID required'),
  quantity: z.number().int().min(1, 'Quantity must be greater than 0'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().min(1, 'Reason for movement is required'),
});

export const getInventorySummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productsRes = await query(`
      SELECT 
        p.*,
        (p.current_stock <= p.min_stock_alert) AS is_low_stock
      FROM products p
      ORDER BY p.name ASC
    `);

    const statsRes = await query(`
      SELECT 
        COUNT(*) AS total_items,
        SUM(current_stock) AS total_stock_count,
        SUM(current_stock * unit_price) AS total_stock_value,
        COUNT(CASE WHEN current_stock <= min_stock_alert THEN 1 END) AS low_stock_count
      FROM products
    `);

    res.json({
      success: true,
      data: {
        stats: statsRes.rows[0],
        products: productsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovements = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const product_id = req.query.product_id as string;
    const movement_type = req.query.movement_type as string;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (product_id) {
      whereConditions.push(`sm.product_id = $${paramIdx}`);
      queryParams.push(product_id);
      paramIdx++;
    }

    if (movement_type) {
      whereConditions.push(`sm.movement_type = $${paramIdx}`);
      queryParams.push(movement_type);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM stock_movements sm ${whereClause}`, queryParams);
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT 
        sm.*,
        p.name AS product_name,
        p.sku,
        u.name AS created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const dataRes = await query(dataSql, [...queryParams, limit, offset]);

    res.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const { product_id, quantity, movement_type, reason } = req.body;
    const userId = req.user?.userId;

    await client.query('BEGIN');

    // Lock product row
    const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [product_id]);
    if (prodRes.rows.length === 0) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const product = prodRes.rows[0];
    let newStock = product.current_stock;

    if (movement_type === 'IN') {
      newStock += quantity;
    } else {
      if (product.current_stock < quantity) {
        throw new AppError(
          `Insufficient stock for product: ${product.name}. Current: ${product.current_stock}, Requested: ${quantity}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      newStock -= quantity;
    }

    // Update stock
    await client.query(
      'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, product_id]
    );

    // Insert stock movement record
    const movementRes = await client.query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_id, quantity, movement_type, reason, userId || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Stock updated successfully (${movement_type} ${quantity})`,
      data: {
        movement: movementRes.rows[0],
        new_stock: newStock,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
