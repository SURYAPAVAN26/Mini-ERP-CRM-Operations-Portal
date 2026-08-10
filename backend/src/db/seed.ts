import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { initDb } from './initDb';

export async function seedDb() {
  await initDb();
  console.log('Seeding initial database data...');

  try {
    // 1. Create Professional Test Users
    const passwordHashAdmin = await bcrypt.hash('nexusAdmin123!', 10);
    const passwordHashSales = await bcrypt.hash('nexusSales123!', 10);
    const passwordHashWarehouse = await bcrypt.hash('nexusWarehouse123!', 10);
    const passwordHashAccounts = await bcrypt.hash('nexusAccounts123!', 10);

    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES
      ($1, $2, $3, $4),
      ($5, $6, $7, $8),
      ($9, $10, $11, $12),
      ($13, $14, $15, $16)
      RETURNING id, name, role;`,
      [
        'System Admin', 'admin@nexusopera.com', passwordHashAdmin, 'ADMIN',
        'Sarah Sales', 'sales@nexusopera.com', passwordHashSales, 'SALES',
        'Wally Warehouse', 'warehouse@nexusopera.com', passwordHashWarehouse, 'WAREHOUSE',
        'Alice Accounts', 'accounts@nexusopera.com', passwordHashAccounts, 'ACCOUNTS',
      ]
    );

    const adminId = userRes.rows.find((u) => u.role === 'ADMIN')?.id;
    const salesId = userRes.rows.find((u) => u.role === 'SALES')?.id;
    const warehouseId = userRes.rows.find((u) => u.role === 'WAREHOUSE')?.id;

    console.log('Professional test users created.');

    // 2. Create Sample Customers
    const customerRes = await pool.query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
      ('Rahul Sharma', '+91 98765 43210', 'rahul@apexdistributors.com', 'Apex Distributors Pvt Ltd', '27AAACA12341Z5', 'Distributor', 'Plot 42, MIDC Industrial Area, Mumbai', 'Active', '2026-08-15', 'Key wholesale account, prefers bulk deliveries.'),
      ('Priya Patel', '+91 98123 45678', 'priya@techmart.in', 'TechMart Electronics', '24BBBCB56782Z1', 'Wholesale', '101 Trade Center, SG Highway, Ahmedabad', 'Active', '2026-08-20', 'Requested pricing update on monitor stock.'),
      ('Amit Kumar', '+91 97654 32109', 'amit@retailhub.com', 'Retail Hub Enterprises', '07CCCC12345Z9', 'Retail', '12 Commercial Complex, CP, New Delhi', 'Lead', '2026-08-12', 'Interested in initial sample order.'),
      ('Vikram Singh', '+91 99887 76655', 'vikram@globaltraders.org', 'Global Traders Corp', '19DDDD12346Z3', 'Distributor', '55 Park Street, Kolkata', 'Inactive', '2026-09-01', 'Payment overdue for previous quarter.')
      RETURNING id, name, business_name;`
    );

    const custApex = customerRes.rows[0].id;
    const custTech = customerRes.rows[1].id;

    console.log('Sample customers created.');

    // 3. Create Sample Products
    const productRes = await pool.query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location) VALUES
      ('Samsung 27" Gaming Monitor', 'MON-SAM-27', 'Electronics', 18500.00, 25, 5, 'Warehouse A - Bay 3'),
      ('Logitech Wireless MX Master 3S', 'MOU-LOG-MX3', 'Peripherals', 8990.00, 4, 10, 'Warehouse A - Bay 1'), -- LOW STOCK
      ('Dell XPS 15 Laptop i9 32GB', 'LAP-DEL-X15', 'Laptops', 145000.00, 10, 3, 'Warehouse B - Secure Room'),
      ('Keychron K2 Mechanical Keyboard', 'KEY-KEY-K2', 'Peripherals', 7490.00, 30, 8, 'Warehouse A - Bay 2'),
      ('Ergonomic Mesh Office Chair', 'FUR-CHAIR-ERG', 'Furniture', 12500.00, 2, 5, 'Warehouse C - Heavy Goods') -- LOW STOCK
      RETURNING id, name, sku, unit_price, current_stock;`
    );

    const prodMonitor = productRes.rows[0].id;
    const prodMouse = productRes.rows[1].id;
    const prodKeyboard = productRes.rows[3].id;

    console.log('Sample products created.');

    // 4. Create Initial Stock Movements (IN)
    await pool.query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES
      ($1, 30, 'IN', 'Initial Supplier Shipment Received', $4),
      ($2, 10, 'IN', 'Initial Stock Entry', $4),
      ($3, 10, 'IN', 'Purchase Order #PO-2026-001', $4),
      ($5, 5, 'IN', 'Factory Restock', $4);`,
      [prodMonitor, prodMouse, productRes.rows[2].id, warehouseId, productRes.rows[4].id]
    );

    console.log('Initial stock movements logged.');

    // 5. Create Initial Sales Challans
    const challanDraftRes = await pool.query(
      `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
      VALUES ('CH-2026-0001', $1, 3, 44490.00, 'DRAFT', $2)
      RETURNING id;`,
      [custTech, salesId]
    );
    const draftChallanId = challanDraftRes.rows[0].id;

    await pool.query(
      `INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, subtotal) VALUES
      ($1, $2, 'Logitech Wireless MX Master 3S', 'MOU-LOG-MX3', 8990.00, 1, 8990.00),
      ($1, $3, 'Samsung 27" Gaming Monitor', 'MON-SAM-27', 18500.00, 1, 18500.00),
      ($1, $4, 'Keychron K2 Mechanical Keyboard', 'KEY-KEY-K2', 7490.00, 2, 14980.00);`,
      [draftChallanId, prodMouse, prodMonitor, prodKeyboard]
    );

    const challanConfRes = await pool.query(
      `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
      VALUES ('CH-2026-0002', $1, 5, 92500.00, 'CONFIRMED', $2)
      RETURNING id;`,
      [custApex, salesId]
    );
    const confChallanId = challanConfRes.rows[0].id;

    await pool.query(
      `INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, subtotal) VALUES
      ($1, $2, 'Samsung 27" Gaming Monitor', 'MON-SAM-27', 18500.00, 5, 92500.00);`,
      [confChallanId, prodMonitor]
    );

    await pool.query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES
      ($1, 5, 'OUT', 'Sales Challan CH-2026-0002 Confirmed', $2);`,
      [prodMonitor, salesId]
    );

    console.log('Sample sales challans created.');
    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDb().then(() => pool.end());
}
