import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

export async function initDb() {
  try {
    console.log('Connecting to PostgreSQL database to execute schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('Database schema created successfully.');
  } catch (error) {
    console.error('Error creating database schema:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  initDb().then(() => pool.end());
}
