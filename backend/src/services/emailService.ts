import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

let transporter: nodemailer.Transporter | null = null;

// Get safe configuration status for each environment variable (NO PASSWORDS PRINTED)
export function getSmtpConfigStatus() {
  const hostExists = Boolean(config.emailHost);
  const portExists = Boolean(config.emailPort);
  const secureExists = Boolean(config.emailSecure !== undefined);
  const userExists = Boolean(config.emailUser);
  const passExists = Boolean(config.emailPassword);
  const fromExists = Boolean(config.emailFrom);

  return {
    workingDirectory: process.cwd(),
    loadedEnvFile: config.loadedEnvPath,
    EMAIL_HOST_exists: hostExists,
    EMAIL_HOST_val: config.emailHost || 'NOT SET',
    EMAIL_PORT_exists: portExists,
    EMAIL_PORT_val: config.emailPort,
    EMAIL_SECURE_exists: secureExists,
    EMAIL_SECURE_val: config.emailSecure,
    EMAIL_USER_exists: userExists,
    EMAIL_PASSWORD_exists: passExists,
    EMAIL_FROM_exists: fromExists,
  };
}

// Print safe configuration summary to terminal (NO PASSWORDS)
export function printSafeConfigSummary(): void {
  const status = getSmtpConfigStatus();
  console.log('=============== BACKEND DIAGNOSTIC SUMMARY ===============');
  console.log(`Backend Working Directory: ${status.workingDirectory}`);
  console.log(`Loaded .env File Path:     ${status.loadedEnvFile}`);
  console.log(`EMAIL_HOST exists:         ${status.EMAIL_HOST_exists} (${status.EMAIL_HOST_val})`);
  console.log(`EMAIL_PORT exists:         ${status.EMAIL_PORT_exists} (${status.EMAIL_PORT_val})`);
  console.log(`EMAIL_SECURE exists:       ${status.EMAIL_SECURE_exists} (${status.EMAIL_SECURE_val})`);
  console.log(`EMAIL_USER exists:         ${status.EMAIL_USER_exists}`);
  console.log(`EMAIL_PASSWORD exists:     ${status.EMAIL_PASSWORD_exists}`);
  console.log(`EMAIL_FROM exists:         ${status.EMAIL_FROM_exists}`);
  console.log('==========================================================');
}

export function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  if (!config.emailHost || !config.emailUser || !config.emailPassword) {
    throw new AppError(
      'SMTP credentials are not configured in backend/.env. Please enter EMAIL_USER and EMAIL_PASSWORD in backend/.env file.',
      500,
      'SMTP_NOT_CONFIGURED'
    );
  }

  transporter = nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: config.emailSecure, // true for 465, false for 587
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

// Development-safe SMTP connection test
export async function verifySmtpConnection(): Promise<{
  success: boolean;
  status: string;
  message: string;
  configStatus: ReturnType<typeof getSmtpConfigStatus>;
}> {
  const status = getSmtpConfigStatus();

  if (!config.emailHost || !config.emailUser || !config.emailPassword) {
    return {
      success: false,
      status: 'AWAITING_CREDENTIALS',
      message: 'SMTP credentials are not configured in backend/.env. Enter EMAIL_USER and EMAIL_PASSWORD in backend/.env',
      configStatus: status,
    };
  }

  try {
    const mailTransporter = getTransporter();
    await mailTransporter.verify();
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

// Send OTP Email and verify provider acceptance
export async function sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<nodemailer.SentMessageInfo> {
  const mailTransporter = getTransporter();

  // 1. Verify SMTP connection before sending
  try {
    await mailTransporter.verify();
  } catch (verifyError: any) {
    const vMsg = verifyError.message || String(verifyError);
    const vCode = verifyError.code || verifyError.responseCode || 'SMTP_AUTH_FAILED';
    console.error(`❌ [SMTP AUTH FAILED] Cannot send email to ${toEmail}. Error (${vCode}): ${vMsg}`);
    throw new AppError(`SMTP Connection/Auth Failed [${vCode}]: ${vMsg}`, 500, 'SMTP_AUTH_FAILED');
  }

  const sender = config.emailFrom || `"NEXUS OPERA" <${config.emailUser}>`;

  const mailOptions = {
    from: sender,
    to: toEmail.trim(), // Exact target email address
    subject: 'Verify your email - NEXUS OPERA',
    text: `Hello ${userName || 'User'},\n\nYour verification OTP is:\n\n${otpCode}\n\nThis OTP will expire in 5 minutes.\n\nIf you did not request this verification, please ignore this email.\n\nRegards,\nNEXUS OPERA`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155;">
          <h1 style="color: #818cf8; margin: 0; font-size: 24px; font-weight: 800;">NEXUS OPERA</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Enterprise Wholesale ERP & CRM System</p>
        </div>
        
        <div style="padding: 28px 0; text-align: center;">
          <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 12px;">Email Verification Code</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            Hello <strong>${userName || 'User'}</strong>,<br/><br/>
            Please use the following 6-digit OTP code to verify your email address. This code will expire in <strong>5 minutes</strong>.
          </p>
          
          <div style="background: rgba(99, 102, 241, 0.15); border: 1px dashed #6366f1; border-radius: 10px; padding: 18px; display: inline-block; margin-bottom: 24px;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #818cf8;">${otpCode}</span>
          </div>
          
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            If you did not request this verification, please ignore this email.
          </p>
        </div>
        
        <div style="padding-top: 20px; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px;">
          &copy; 2026 NEXUS OPERA. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);

    const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];
    const rejectedList = Array.isArray(info.rejected) ? info.rejected : [];

    if (rejectedList.includes(toEmail.trim()) || acceptedList.length === 0) {
      console.error(`❌ [SMTP REJECTED RECIPIENT] Recipient ${toEmail} was rejected by SMTP server:`, rejectedList);
      throw new AppError(`Email delivery was rejected by SMTP provider for ${toEmail}`, 500, 'EMAIL_REJECTED');
    }

    console.log(`✅ [EMAIL ACCEPTED BY SMTP PROVIDER]`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Target Recipient: ${toEmail.trim()}`);
    console.log(`   Accepted recipients: ${acceptedList.join(', ')}`);
    console.log(`   SMTP Server Response: ${info.response}`);

    return info;
  } catch (sendError: any) {
    if (sendError instanceof AppError) {
      throw sendError;
    }

    const rawError = sendError.message || String(sendError);
    const code = sendError.code || sendError.responseCode || 'SMTP_SEND_FAILED';

    console.error(`❌ [SMTP DELIVERY FAILED] Could not send OTP email to ${toEmail}:`);
    console.error(`   Error Code: ${code}`);
    console.error(`   Error Message: ${rawError}`);

    let devErrMsg = `Unable to send verification email. SMTP Error [${code}]: ${rawError}`;
    throw new AppError(devErrMsg, 500, 'EMAIL_DELIVERY_FAILED');
  }
}
