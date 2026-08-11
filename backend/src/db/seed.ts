import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { initDb } from './initDb';

export async function seedDb() {
  await initDb();
  console.log('Seeding initial database data...');

  try {
    // Hashes
    const passwordHashAdmin = await bcrypt.hash('admin123', 10);
    const passwordHashSales = await bcrypt.hash('sales123', 10);
    const passwordHashWarehouse = await bcrypt.hash('warehouse123', 10);
    const passwordHashAccounts = await bcrypt.hash('accounts123', 10);
    const passwordHashRajan = await bcrypt.hash('password123', 10);

    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_email_verified) VALUES
      -- Team Accounts (Surya, Shashank, Jyanesh, Koushik, Ruthwik, Rajan)
      ($1, $2, $3, $4, TRUE),
      ($5, $6, $7, $8, TRUE),
      ($9, $10, $11, $12, TRUE),
      ($13, $14, $15, $16, TRUE),
      ($17, $18, $19, $20, TRUE),
      ($21, $22, $23, $24, TRUE),
      -- Additional Team Aliases
      ($25, $26, $27, $28, TRUE),
      ($29, $30, $31, $32, TRUE),
      ($33, $34, $35, $36, TRUE)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        is_email_verified = TRUE,
        role = EXCLUDED.role
      RETURNING id, name, email, role;`,
      [
        'Surya Pavan (System Admin)', 'kodipathrunisuryapavan2005@gmail.com', passwordHashAdmin, 'ADMIN',
        'Shashank (Warehouse Manager)', 'shashank@nexusopera.com', passwordHashWarehouse, 'WAREHOUSE',
        'Jyanesh (Sales Executive)', 'jyanesh@nexusopera.com', passwordHashSales, 'SALES',
        'Koushik (Accounts Officer)', 'koushik@nexusopera.com', passwordHashAccounts, 'ACCOUNTS',
        'Ruthwik (Sales Executive)', 'ruthwik@nexusopera.com', passwordHashSales, 'SALES',
        'Rajan Atharun (Admin)', 'rajanatharun8@gmail.com', passwordHashRajan, 'ADMIN',

        'Surya (Gmail)', 'surya@gmail.com', passwordHashAdmin, 'ADMIN',
        'Shashank (Gmail)', 'shashank@gmail.com', passwordHashWarehouse, 'WAREHOUSE',
        'Jyanesh (Gmail)', 'jyanesh@gmail.com', passwordHashSales, 'SALES',
      ]
    );

    const adminId = userRes.rows.find((u) => u.role === 'ADMIN')?.id;
    const salesId = userRes.rows.find((u) => u.role === 'SALES')?.id;
    const warehouseId = userRes.rows.find((u) => u.role === 'WAREHOUSE')?.id;

    console.log('Registered team users created (Surya, Shashank, Jyanesh, Koushik, Ruthwik, Rajan).');

    // 2. Create Sample Customers
    const customerRes = await pool.query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
      ('Rahul Sharma', '+91 98765 43210', 'rahul@apexdistributors.com', 'Apex Distributors Pvt Ltd', '27AAACA12341Z5', 'Distributor', 'Plot 42, MIDC Industrial Area, Mumbai', 'Active', '2026-08-15', 'Key wholesale account, prefers bulk deliveries.'),
      ('Priya Patel', '+91 98123 45678', 'priya@techmart.in', 'TechMart Electronics', '24BBBCB56782Z1', 'Wholesale', '101 Trade Center, SG Highway, Ahmedabad', 'Active', '2026-08-20', 'Requested pricing update on monitor stock.'),
      ('Amit Kumar', '+91 97654 32109', 'amit@retailhub.com', 'Retail Hub Enterprises', '07CCCC12345Z9', 'Retail', '12 Commercial Complex, CP, New Delhi', 'Lead', '2026-08-12', 'Interested in initial sample order.'),
      ('Vikram Singh', '+91 99887 76655', 'vikram@globaltraders.org', 'Global Traders Corp', '19DDDD12346Z3', 'Distributor', '55 Park Street, Kolkata', 'Inactive', '2026-09-01', 'Payment overdue for previous quarter.')
      ON CONFLICT DO NOTHING
      RETURNING id, name, business_name;`
    );

    const custApex = customerRes.rows[0]?.id || 1;
    const custTech = customerRes.rows[1]?.id || 2;

    console.log('Sample customers checked/created.');

    // 3. Create Sample Products
    const productRes = await pool.query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location) VALUES
      ('Samsung 27" Gaming Monitor', 'MON-SAM-27', 'Electronics', 18500.00, 25, 5, 'Warehouse A - Bay 3'),
      ('Logitech Wireless MX Master 3S', 'MOU-LOG-MX3', 'Peripherals', 8990.00, 4, 10, 'Warehouse A - Bay 1'),
      ('Dell XPS 15 Laptop i9 32GB', 'LAP-DEL-X15', 'Laptops', 145000.00, 10, 3, 'Warehouse B - Secure Room'),
      ('Keychron K2 Mechanical Keyboard', 'KEY-KEY-K2', 'Peripherals', 7490.00, 30, 8, 'Warehouse A - Bay 2'),
      ('Ergonomic Mesh Office Chair', 'FUR-CHAIR-ERG', 'Furniture', 12500.00, 2, 5, 'Warehouse C - Heavy Goods')
      ON CONFLICT DO NOTHING
      RETURNING id, name, sku, unit_price, current_stock;`
    );

    console.log('Sample products checked/created.');
    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDb().then(() => pool.end());
}
