import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ChallanService } from '../services/challanService';

export const createChallanSchema = z.object({
  customer_id: z.string().uuid('Valid customer ID required'),
  items: z.array(
    z.object({
      product_id: z.string().uuid('Valid product ID required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'At least one product item is required'),
});

export const getChallans = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = (req.query.search as string || '').trim();
    const status = req.query.status as string;
    const customer_id = req.query.customer_id as string;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereConditions.push(`(sc.challan_number ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx} OR c.business_name ILIKE $${paramIdx})`);
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    if (status) {
      whereConditions.push(`sc.status = $${paramIdx}`);
      queryParams.push(status);
      paramIdx++;
    }

    if (customer_id) {
      whereConditions.push(`sc.customer_id = $${paramIdx}`);
      queryParams.push(customer_id);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) 
      FROM sales_challans sc 
      LEFT JOIN customers c ON sc.customer_id = c.id 
      ${whereClause}
    `;
    const countRes = await query(countSql, queryParams);
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT 
        sc.*,
        c.name AS customer_name,
        c.business_name AS customer_business_name,
        u.name AS created_by_name
      FROM sales_challans sc
      LEFT JOIN customers c ON sc.customer_id = c.id
      LEFT JOIN users u ON sc.created_by = u.id
      ${whereClause}
      ORDER BY sc.created_at DESC
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

export const getChallanById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const challanRes = await query(
      `SELECT 
        sc.*,
        c.name AS customer_name,
        c.business_name AS customer_business_name,
        c.mobile AS customer_mobile,
        c.email AS customer_email,
        c.address AS customer_address,
        c.gst_number AS customer_gst,
        u.name AS created_by_name
      FROM sales_challans sc
      LEFT JOIN customers c ON sc.customer_id = c.id
      LEFT JOIN users u ON sc.created_by = u.id
      WHERE sc.id = $1`,
      [id]
    );

    if (challanRes.rows.length === 0) {
      throw new AppError('Sales Challan not found', 404, 'NOT_FOUND');
    }

    const itemsRes = await query('SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id ASC', [id]);

    res.json({
      success: true,
      data: {
        ...challanRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const result = await ChallanService.createDraftChallan({
      customer_id: req.body.customer_id,
      items: req.body.items,
      created_by: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Sales Challan draft created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const updatedChallan = await ChallanService.confirmChallan(id, userId);

    res.json({
      success: true,
      message: 'Sales Challan confirmed successfully and stock deducted',
      data: updatedChallan,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelChallan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const cancelledChallan = await ChallanService.cancelChallan(id, userId);

    res.json({
      success: true,
      message: 'Sales Challan cancelled successfully',
      data: cancelledChallan,
    });
  } catch (error) {
    next(error);
  }
};
