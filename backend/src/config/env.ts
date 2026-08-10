import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || '';
const portStr = process.env.EMAIL_PORT || process.env.SMTP_PORT || '587';
const user = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '';
const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || '';
const secureStr = process.env.EMAIL_SECURE || process.env.SMTP_SECURE || '';

const port = parseInt(portStr, 10);
const secure = secureStr ? secureStr.toLowerCase() === 'true' : port === 465;

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/mini_erp_crm',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_mini_erp_crm_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Email / SMTP Configuration
  emailHost: host.trim(),
  emailPort: port,
  emailSecure: secure,
  emailUser: user.trim(),
  emailPassword: pass.trim(),
  emailFrom: from.trim() || (user.trim() ? `"NEXUS OPERA" <${user.trim()}>` : 'NEXUS OPERA <noreply@nexusopera.com>'),
};
