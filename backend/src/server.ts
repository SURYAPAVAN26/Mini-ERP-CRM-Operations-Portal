import os from 'os';
import app from './app';
import { config } from './config/env';
import { pool } from './config/database';
import { verifySmtpConnection } from './services/emailService';

const PORT = config.port;

function getNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

pool.query('SELECT NOW()')
  .then(async () => {
    const networkIp = getNetworkIp();
    console.log('PostgreSQL database connection established successfully.');
    
    if (config.emailHost && config.emailUser) {
      await verifySmtpConnection();
    } else {
      console.log('ℹ️ SMTP Email Service: Not configured in .env (Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env)');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Mini ERP + CRM Server running on port ${PORT}`);
      console.log(`🌐 Local Access:    http://localhost:${PORT}/`);
      console.log(`📡 Network Access:  http://${networkIp}:${PORT}/ (Accessible from any laptop/mobile on Wi-Fi)`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to PostgreSQL database:', err);
    process.exit(1);
  });
