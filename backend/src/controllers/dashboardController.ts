import { Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export const getDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Total Customers
    const custRes = await query(`
      SELECT 
        COUNT(*) AS total_customers,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_customers,
        COUNT(CASE WHEN status = 'Lead' THEN 1 END) AS lead_customers
      FROM customers
    `);

    // 2. Product & Inventory Stats
    const prodRes = await query(`
      SELECT 
        COUNT(*) AS total_products,
        COUNT(CASE WHEN current_stock <= min_stock_alert THEN 1 END) AS low_stock_count,
        COALESCE(SUM(current_stock), 0) AS total_stock_quantity,
        COALESCE(SUM(current_stock * unit_price), 0) AS total_stock_value
      FROM products
    `);

    // 3. Sales Challans Stats
    const challanRes = await query(`
      SELECT 
        COUNT(*) AS total_challans,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) AS draft_challans,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) AS confirmed_challans,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_challans,
        COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END), 0) AS total_confirmed_revenue
      FROM sales_challans
    `);

    // 4. Low-Stock Products List (Top 5)
    const lowStockItems = await query(`
      SELECT id, name, sku, category, current_stock, min_stock_alert, location
      FROM products
      WHERE current_stock <= min_stock_alert
      ORDER BY current_stock ASC
      LIMIT 5
    `);

    // 5. Recent Stock Movements (Top 5)
    const recentMovements = await query(`
      SELECT sm.*, p.name AS product_name, p.sku, u.name AS created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      ORDER BY sm.created_at DESC
      LIMIT 5
    `);

    // 6. Recent Challans (Top 5)
    const recentChallans = await query(`
      SELECT sc.*, c.name AS customer_name, c.business_name AS customer_business_name
      FROM sales_challans sc
      LEFT JOIN customers c ON sc.customer_id = c.id
      ORDER BY sc.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        customers: custRes.rows[0],
        inventory: prodRes.rows[0],
        challans: challanRes.rows[0],
        low_stock_products: lowStockItems.rows,
        recent_movements: recentMovements.rows,
        recent_challans: recentChallans.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};
