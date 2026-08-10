import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface CreateChallanInput {
  customer_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  created_by: string;
}

export class ChallanService {
  /**
   * Helper to generate auto-incremented challan number CH-YYYY-XXXX
   */
  private static async generateChallanNumber(client: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CH-${year}-`;
    const res = await client.query(
      `SELECT challan_number FROM sales_challans WHERE challan_number LIKE $1 ORDER BY created_at DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextNum = 1;
    if (res.rows.length > 0) {
      const lastNumStr = res.rows[0].challan_number.replace(prefix, '');
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }

  /**
   * Create Sales Challan as DRAFT (Does NOT touch stock)
   */
  static async createDraftChallan(input: CreateChallanInput) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify Customer
      const custRes = await client.query('SELECT id, name FROM customers WHERE id = $1', [input.customer_id]);
      if (custRes.rows.length === 0) {
        throw new AppError('Selected customer does not exist', 404, 'CUSTOMER_NOT_FOUND');
      }

      if (!input.items || input.items.length === 0) {
        throw new AppError('At least one product item is required', 400, 'EMPTY_ITEMS');
      }

      const challanNumber = await this.generateChallanNumber(client);

      let totalQty = 0;
      let totalAmount = 0;
      const snapshotItems: any[] = [];

      // Fetch snapshot data for each product
      for (const item of input.items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new AppError('Product quantity must be greater than 0', 400, 'INVALID_QUANTITY');
        }

        const prodRes = await client.query('SELECT id, name, sku, unit_price FROM products WHERE id = $1', [item.product_id]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product with ID ${item.product_id} not found`, 404, 'PRODUCT_NOT_FOUND');
        }

        const prod = prodRes.rows[0];
        const unitPrice = parseFloat(prod.unit_price);
        const subtotal = unitPrice * item.quantity;

        totalQty += item.quantity;
        totalAmount += subtotal;

        snapshotItems.push({
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          unit_price: unitPrice,
          quantity: item.quantity,
          subtotal,
        });
      }

      // Insert Sales Challan Header
      const challanRes = await client.query(
        `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
         VALUES ($1, $2, $3, $4, 'DRAFT', $5)
         RETURNING *`,
        [challanNumber, input.customer_id, totalQty, totalAmount, input.created_by]
      );
      const challan = challanRes.rows[0];

      // Insert Challan Items with Snapshots
      for (const sItem of snapshotItems) {
        await client.query(
          `INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [challan.id, sItem.product_id, sItem.product_name, sItem.sku, sItem.unit_price, sItem.quantity, sItem.subtotal]
        );
      }

      await client.query('COMMIT');
      return { challan, items: snapshotItems };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm Sales Challan inside an atomic PostgreSQL Transaction
   */
  static async confirmChallan(challanId: string, userId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch & Lock Challan Record
      const challanRes = await client.query('SELECT * FROM sales_challans WHERE id = $1 FOR UPDATE', [challanId]);
      if (challanRes.rows.length === 0) {
        throw new AppError('Sales Challan not found', 404, 'NOT_FOUND');
      }

      const challan = challanRes.rows[0];
      if (challan.status === 'CONFIRMED') {
        throw new AppError('Challan is already confirmed', 400, 'ALREADY_CONFIRMED');
      }
      if (challan.status === 'CANCELLED') {
        throw new AppError('Cannot confirm a cancelled challan', 400, 'CHALLAN_CANCELLED');
      }

      // Fetch Items
      const itemsRes = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [challanId]);
      const items = itemsRes.rows;

      if (items.length === 0) {
        throw new AppError('Challan has no items to process', 400, 'NO_ITEMS');
      }

      // Step 1: Lock & Verify Stock for ALL products
      for (const item of items) {
        if (!item.product_id) continue;

        const prodRes = await client.query('SELECT id, name, current_stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product '${item.product_name}' no longer exists in system`, 404, 'PRODUCT_NOT_FOUND');
        }

        const currentStock = parseInt(prodRes.rows[0].current_stock, 10);
        if (currentStock < item.quantity) {
          // REJECT CONFIRMATION - ROLLBACK TRANSACTION
          throw new AppError(
            `Insufficient stock for product: ${item.product_name}. Available: ${currentStock}, Required: ${item.quantity}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // Step 2: All products have sufficient stock -> Reduce Stock & Log Movements
      for (const item of items) {
        if (!item.product_id) continue;

        // Reduce product stock
        await client.query(
          'UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Record OUT stock movement log
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Sales Challan ${challan.challan_number} Confirmed`, userId]
        );
      }

      // Step 3: Update Challan status to CONFIRMED
      const updateRes = await client.query(
        `UPDATE sales_challans SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [challanId]
      );

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel Sales Challan
   */
  static async cancelChallan(challanId: string, userId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const challanRes = await client.query('SELECT * FROM sales_challans WHERE id = $1 FOR UPDATE', [challanId]);
      if (challanRes.rows.length === 0) {
        throw new AppError('Sales Challan not found', 404, 'NOT_FOUND');
      }

      const challan = challanRes.rows[0];
      if (challan.status === 'CANCELLED') {
        throw new AppError('Challan is already cancelled', 400, 'ALREADY_CANCELLED');
      }

      // If it was CONFIRMED, restore stock!
      if (challan.status === 'CONFIRMED') {
        const itemsRes = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [challanId]);
        for (const item of itemsRes.rows) {
          if (!item.product_id) continue;

          await client.query(
            'UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2',
            [item.quantity, item.product_id]
          );

          await client.query(
            `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
             VALUES ($1, $2, 'IN', $3, $4)`,
            [item.product_id, item.quantity, `Sales Challan ${challan.challan_number} Cancelled Restock`, userId]
          );
        }
      }

      const updateRes = await client.query(
        `UPDATE sales_challans SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [challanId]
      );

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
