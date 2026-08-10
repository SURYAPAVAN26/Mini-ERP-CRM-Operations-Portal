import nodemailer from 'nodemailer';
import https from 'https';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

let smtpTransporter: nodemailer.Transporter | null = null;

// Get safe configuration status (NO PASSWORDS OR API KEYS EXPOSED)
export function getEmailServiceStatus() {
  const hasResend = Boolean(config.resendApiKey);
  const hasSmtp = Boolean(config.emailHost && config.emailUser && config.emailPassword);

  let activeProvider = 'NONE (Not Configured)';
  if (hasResend) {
    activeProvider = 'Resend Transactional Email API';
  } else if (hasSmtp) {
    activeProvider = `SMTP Server (${config.emailHost}:${config.emailPort})`;
  }

  return {
    workingDirectory: process.cwd(),
    loadedEnvFile: config.loadedEnvPath,
    activeProvider,
    RESEND_API_KEY_configured: hasResend,
    EMAIL_HOST_configured: Boolean(config.emailHost),
    EMAIL_HOST_val: config.emailHost || 'NOT SET',
    EMAIL_PORT_val: config.emailPort,
    EMAIL_SECURE_val: config.emailSecure,
    EMAIL_USER_configured: Boolean(config.emailUser),
    EMAIL_PASSWORD_configured: Boolean(config.emailPassword),
    EMAIL_FROM_val: config.emailFrom || 'NOT SET',
  };
}

// Print safe configuration summary to terminal on startup
export function printSafeConfigSummary(): void {
  const status = getEmailServiceStatus();
  console.log('=============== EMAIL SERVICE DIAGNOSTIC SUMMARY ===============');
  console.log(`Active Email Provider:     ${status.activeProvider}`);
  console.log(`Loaded .env File Path:     ${status.loadedEnvFile}`);
  console.log(`RESEND_API_KEY configured: ${status.RESEND_API_KEY_configured}`);
  console.log(`SMTP Host configured:      ${status.EMAIL_HOST_configured} (${status.EMAIL_HOST_val}:${status.EMAIL_PORT_val})`);
  console.log(`SMTP User configured:      ${status.EMAIL_USER_configured}`);
  console.log(`SMTP Password configured:  ${status.EMAIL_PASSWORD_configured}`);
  console.log(`EMAIL_FROM Address:        ${status.EMAIL_FROM_val}`);
  console.log('================================================================');
}

// Helper to send email using Resend Transactional Email REST API
function sendViaResendApi(
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const sender = config.emailFrom || 'NEXUS OPERA <onboarding@resend.dev>';
    
    const postData = JSON.stringify({
      from: sender,
      to: [toEmail.trim()], // Dynamic recipient address
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    const options: https.RequestOptions = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && parsed.id) {
            resolve({ id: parsed.id });
          } else {
            const errMsg = parsed.message || parsed.error || `HTTP Status ${res.statusCode}`;
            console.error(`❌ [RESEND API REJECTED] Code ${res.statusCode}: ${errMsg}`);
            reject(new AppError(`Resend API Error: ${errMsg}`, 500, 'RESEND_API_FAILED'));
          }
        } catch (parseErr) {
          console.error(`❌ [RESEND API PARSE ERROR] Raw response: ${data}`);
          reject(new AppError(`Invalid response from Resend API`, 500, 'RESEND_RESPONSE_INVALID'));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [RESEND API NETWORK ERROR]: ${err.message}`);
      reject(new AppError(`Resend API Network Failure: ${err.message}`, 500, 'RESEND_NETWORK_ERROR'));
    });

    req.write(postData);
    req.end();
  });
}

// Get Nodemailer SMTP transporter fallback
export function getSmtpTransporter(): nodemailer.Transporter {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  smtpTransporter = nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: config.emailSecure,
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return smtpTransporter;
}

export const getTransporter = getSmtpTransporter;

// Verify Email Service Provider Status / Authentication
export async function verifySmtpConnection(): Promise<{
  success: boolean;
  status: string;
  message: string;
  configStatus: ReturnType<typeof getEmailServiceStatus>;
}> {
  const status = getEmailServiceStatus();

  // Mode 1: Resend API
  if (config.resendApiKey) {
    console.log(`✅ [RESEND API READY] Resend API Key is configured.`);
    return {
      success: true,
      status: 'RESEND_API_READY',
      message: 'Resend Transactional Email API key is configured.',
      configStatus: status,
    };
  }

  // Mode 2: SMTP Credentials
  if (config.emailHost && config.emailUser && config.emailPassword) {
    try {
      const transporter = getSmtpTransporter();
      await transporter.verify();
      console.log(`✅ [SMTP VERIFIED] Successfully authenticated with ${config.emailHost}:${config.emailPort}`);
      return {
        success: true,
        status: 'SMTP_PASS',
        message: `Successfully authenticated with ${config.emailHost}:${config.emailPort}`,
        configStatus: status,
      };
    } catch (error: any) {
      const rawError = error.message || String(error);
      const code = error.code || error.responseCode || 'SMTP_VERIFY_FAILED';
      console.error(`❌ [SMTP VERIFICATION FAILED] Host: ${config.emailHost}, Error (${code}): ${rawError}`);
      return {
        success: false,
        status: 'SMTP_FAIL',
        message: `SMTP Verification Failed [${code}]: ${rawError}`,
        configStatus: status,
      };
    }
  }

  return {
    success: false,
    status: 'AWAITING_CREDENTIALS',
    message: 'Email service is not configured. Please set RESEND_API_KEY or SMTP credentials in backend/.env',
    configStatus: status,
  };
}

// Send OTP Email (Supports Resend API & Nodemailer SMTP with strict provider acceptance)
export async function sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<{
  provider: string;
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
}> {
  const recipient = toEmail.trim();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155;">
        <h1 style="color: #818cf8; margin: 0; font-size: 24px; font-weight: 800;">NEXUS OPERA</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Enterprise Wholesale ERP & CRM System</p>
      </div>
      
      <div style="padding: 28px 0; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 12px;">Email Verification Code</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
          Hello <strong>${userName || 'User'}</strong>,<br/><br/>
          Your verification OTP is:
        </p>
        
        <div style="background: rgba(99, 102, 241, 0.15); border: 1px dashed #6366f1; border-radius: 10px; padding: 18px; display: inline-block; margin-bottom: 24px;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #818cf8;">${otpCode}</span>
        </div>
        
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 16px;">
          This OTP will expire in <strong>5 minutes</strong>.
        </p>
        
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          If you did not request this verification, please ignore this email.
        </p>
      </div>
      
      <div style="padding-top: 20px; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px;">
        &copy; 2026 NEXUS OPERA. All rights reserved.
      </div>
    </div>
  `;

  const textContent = `Hello ${userName || 'User'},\n\nYour verification OTP is:\n\n${otpCode}\n\nThis OTP will expire in 5 minutes.\n\nIf you did not request this verification, please ignore this email.\n\nRegards,\nNEXUS OPERA`;

  // -------------------------------------------------------------
  // Option 1: Send via Resend Transactional Email REST API
  // -------------------------------------------------------------
  if (config.resendApiKey) {
    console.log(`📡 Sending OTP email via Resend API to dynamic recipient: ${recipient}...`);
    const resendResult = await sendViaResendApi(
      recipient,
      'Verify your email - NEXUS OPERA',
      htmlContent,
      textContent
    );

    console.log(`✅ [RESEND EMAIL DISPATCHED] Message ID: ${resendResult.id}, Recipient: ${recipient}`);
    return {
      provider: 'Resend API',
      messageId: resendResult.id,
      accepted: [recipient],
      rejected: [],
      response: '200 OK (Accepted by Resend API)',
    };
  }

  // -------------------------------------------------------------
  // Option 2: Send via Nodemailer SMTP (Gmail, Brevo, Ethereal)
  // -------------------------------------------------------------
  if (config.emailHost && config.emailUser && config.emailPassword) {
    const transporter = getSmtpTransporter();

    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      const vMsg = verifyErr.message || String(verifyErr);
      console.error(`❌ [SMTP AUTH FAILED] Cannot send email to ${recipient}: ${vMsg}`);
      throw new AppError(`SMTP Auth/Connection Failed: ${vMsg}`, 500, 'SMTP_AUTH_FAILED');
    }

    const sender = config.emailFrom || `"NEXUS OPERA" <${config.emailUser}>`;
    const mailOptions = {
      from: sender,
      to: recipient, // Dynamic target email
      subject: 'Verify your email - NEXUS OPERA',
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];
    const rejectedList = Array.isArray(info.rejected) ? info.rejected : [];

    if (rejectedList.includes(recipient) || acceptedList.length === 0) {
      console.error(`❌ [SMTP REJECTED RECIPIENT] Recipient ${recipient} rejected:`, rejectedList);
      throw new AppError(`Email delivery rejected by SMTP provider for ${recipient}`, 500, 'EMAIL_REJECTED');
    }

    console.log(`✅ [SMTP EMAIL ACCEPTED] Message ID: ${info.messageId}, Recipient: ${recipient}`);
    return {
      provider: `SMTP (${config.emailHost})`,
      messageId: info.messageId,
      accepted: acceptedList,
      rejected: rejectedList,
      response: info.response,
    };
  }

  // -------------------------------------------------------------
  // Option 3: Neither Resend nor SMTP is configured
  // -------------------------------------------------------------
  throw new AppError(
    'Unable to send verification email. Email service is not configured. Please set RESEND_API_KEY or SMTP credentials in backend/.env',
    500,
    'EMAIL_NOT_CONFIGURED'
  );
}
