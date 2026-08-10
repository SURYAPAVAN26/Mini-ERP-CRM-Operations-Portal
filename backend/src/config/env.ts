import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Check all possible .env locations fail-safely
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

let loadedEnvPath = '';

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedEnvPath = envPath;
    break;
  }
}

if (!loadedEnvPath) {
  dotenv.config();
}

const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || '';
const portStr = process.env.EMAIL_PORT || process.env.SMTP_PORT || '587';
const user = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '';
const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || '';
const secureStr = process.env.EMAIL_SECURE || process.env.SMTP_SECURE || '';
const resendKey = process.env.RESEND_API_KEY || '';

const port = parseInt(portStr, 10);
const secure = secureStr ? secureStr.toLowerCase() === 'true' : port === 465;

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/mini_erp_crm',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_mini_erp_crm_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Loaded .env file path
  loadedEnvPath: loadedEnvPath || 'default cwd .env',

  // Resend API Key (Transactional Email API)
  resendApiKey: resendKey.trim(),

  // Email / SMTP Configuration
  emailHost: host.trim(),
  emailPort: port,
  emailSecure: secure,
  emailUser: user.trim(),
  emailPassword: pass.replace(/\s+/g, ''), // Strip spaces from App Passwords
  emailFrom: from.trim() || (user.trim() ? `"NEXUS OPERA" <${user.trim()}>` : 'NEXUS OPERA <onboarding@resend.dev>'),
};
