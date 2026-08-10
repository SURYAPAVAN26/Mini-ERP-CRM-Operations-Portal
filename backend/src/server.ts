import app from './app';
import { config } from './config/env';
import { pool } from './config/database';

const PORT = config.port;

pool.query('SELECT NOW()')
  .then(() => {
    console.log('PostgreSQL database connection established successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Mini ERP + CRM Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to PostgreSQL database:', err);
    process.exit(1);
  });
