import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required').transform((val) => val.toUpperCase().trim()),
  category: z.string().min(1, 'Category is required'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  current_stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  min_stock_alert: z.number().int().min(0, 'Minimum stock alert quantity must be non-negative').default(5),
  location: z.string().min(1, 'Warehouse location is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = (req.query.search as string || '').trim();
    const category = req.query.category as string;
    const low_stock = req.query.low_stock === 'true';
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIdx} OR sku ILIKE $${paramIdx} OR location ILIKE $${paramIdx})`);
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    if (category) {
      whereConditions.push(`category = $${paramIdx}`);
      queryParams.push(category);
      paramIdx++;
    }

    if (low_stock) {
      whereConditions.push(`current_stock <= min_stock_alert`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM products ${whereClause}`, queryParams);
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT *, (current_stock <= min_stock_alert) AS is_low_stock 
      FROM products 
      ${whereClause} 
      ORDER BY name ASC 
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

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('SELECT *, (current_stock <= min_stock_alert) AS is_low_stock FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Also get stock movements for this product
    const movementsRes = await query(
      `SELECT sm.*, u.name as created_by_name 
       FROM stock_movements sm 
       LEFT JOIN users u ON sm.created_by = u.id 
       WHERE sm.product_id = $1 
       ORDER BY sm.created_at DESC 
       LIMIT 20`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        recent_movements: movementsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, sku, category, unit_price, current_stock, min_stock_alert, location } = req.body;

    // Check SKU uniqueness explicitly
    const existingSku = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (existingSku.rows.length > 0) {
      throw new AppError(`SKU '${sku}' already exists. SKU must be unique.`, 400, 'DUPLICATE_SKU');
    }

    const result = await query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, sku, category, unit_price, current_stock || 0, min_stock_alert || 5, location]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const current = existing.rows[0];
    const {
      name = current.name,
      sku = current.sku,
      category = current.category,
      unit_price = current.unit_price,
      current_stock = current.current_stock,
      min_stock_alert = current.min_stock_alert,
      location = current.location,
    } = req.body;

    if (sku !== current.sku) {
      const skuCheck = await query('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku, id]);
      if (skuCheck.rows.length > 0) {
        throw new AppError(`SKU '${sku}' is already in use by another product.`, 400, 'DUPLICATE_SKU');
      }
    }

    const result = await query(
      `UPDATE products
       SET name = $1, sku = $2, category = $3, unit_price = $4, current_stock = $5, min_stock_alert = $6, location = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, sku, category, unit_price, current_stock, min_stock_alert, location, id]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
