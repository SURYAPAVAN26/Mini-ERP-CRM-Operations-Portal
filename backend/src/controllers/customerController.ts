import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(5, 'Valid mobile number required'),
  email: z.string().email('Invalid email address'),
  business_name: z.string().min(1, 'Business name is required'),
  gst_number: z.string().optional().nullable(),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['Lead', 'Active', 'Inactive']).optional().default('Lead'),
  follow_up_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const followUpSchema = z.object({
  notes: z.string().min(1, 'Note content is required'),
  follow_up_date: z.string().optional().nullable(),
  status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
});

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = (req.query.search as string || '').trim();
    const status = req.query.status as string;
    const customer_type = req.query.customer_type as string;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIdx} OR business_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR mobile ILIKE $${paramIdx})`);
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIdx}`);
      queryParams.push(status);
      paramIdx++;
    }

    if (customer_type) {
      whereConditions.push(`customer_type = $${paramIdx}`);
      queryParams.push(customer_type);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countSql = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const countRes = await query(countSql, queryParams);
    const totalItems = parseInt(countRes.rows[0].count, 10);

    // Data query
    const dataSql = `
      SELECT * FROM customers 
      ${whereClause} 
      ORDER BY created_at DESC 
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

export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    // Also fetch historical challans for this customer
    const challansRes = await query(
      'SELECT id, challan_number, total_quantity, total_amount, status, created_at FROM sales_challans WHERE customer_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        recent_challans: challansRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes } = req.body;

    const result = await query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, mobile, email, business_name, gst_number || null, customer_type, address, status || 'Lead', follow_up_date || null, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    const current = existing.rows[0];
    const {
      name = current.name,
      mobile = current.mobile,
      email = current.email,
      business_name = current.business_name,
      gst_number = current.gst_number,
      customer_type = current.customer_type,
      address = current.address,
      status = current.status,
      follow_up_date = current.follow_up_date,
      notes = current.notes,
    } = req.body;

    const result = await query(
      `UPDATE customers 
       SET name = $1, mobile = $2, email = $3, business_name = $4, gst_number = $5, customer_type = $6, address = $7, status = $8, follow_up_date = $9, notes = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes, id]
    );

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const addFollowUpNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes, follow_up_date, status } = req.body;

    const existing = await query('SELECT notes, status FROM customers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    const datePrefix = new Date().toISOString().split('T')[0];
    const updatedNotes = existing.rows[0].notes
      ? `${existing.rows[0].notes}\n[${datePrefix}] ${notes}`
      : `[${datePrefix}] ${notes}`;

    const newStatus = status || existing.rows[0].status;

    const result = await query(
      `UPDATE customers
       SET notes = $1, follow_up_date = COALESCE($2, follow_up_date), status = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [updatedNotes, follow_up_date || null, newStatus, id]
    );

    res.json({
      success: true,
      message: 'Follow-up note added successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
