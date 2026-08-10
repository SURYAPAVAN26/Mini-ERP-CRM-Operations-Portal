import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  // Strictly require real SMTP credentials
  if (!config.emailHost || !config.emailUser || !config.emailPassword) {
    throw new AppError(
      'SMTP Email service is not configured in backend/.env. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD in .env file.',
      500,
      'SMTP_NOT_CONFIGURED'
    );
  }

  transporter = nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: config.emailSecure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
    tls: {
      rejectUnauthorized: false, // Prevents local TLS certificate handshake errors
    },
  });

  return transporter;
}

// Log safe configuration summary without exposing passwords
export function printSafeConfigSummary(): void {
  console.log('=============== SMTP CONFIG SUMMARY ===============');
  console.log(`EMAIL_HOST:     ${config.emailHost ? config.emailHost : 'NOT CONFIGURED'}`);
  console.log(`EMAIL_PORT:     ${config.emailPort}`);
  console.log(`EMAIL_SECURE:   ${config.emailSecure}`);
  console.log(`EMAIL_USER:     ${config.emailUser ? `configured (${config.emailUser})` : 'NOT CONFIGURED'}`);
  console.log(`EMAIL_PASSWORD: ${config.emailPassword ? 'configured' : 'NOT CONFIGURED'}`);
  console.log(`EMAIL_FROM:     ${config.emailFrom ? config.emailFrom : 'NOT CONFIGURED'}`);
  console.log('===================================================');
}

// Verify SMTP connection using transporter.verify()
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  printSafeConfigSummary();

  try {
    const mailTransporter = getTransporter();
    await mailTransporter.verify();
    console.log(`✅ [SMTP CONNECTION PASS] Successfully connected & authenticated with ${config.emailHost}:${config.emailPort}`);
    return { success: true, message: `SMTP connection pass: ${config.emailHost}:${config.emailPort}` };
  } catch (error: any) {
    const rawError = error.message || String(error);
    const code = error.code || error.responseCode || 'SMTP_VERIFY_FAILED';
    console.error(`❌ [SMTP CONNECTION FAIL] Host: ${config.emailHost}, Error (${code}): ${rawError}`);
    return { success: false, message: `SMTP Verification Failed [${code}]: ${rawError}` };
  }
}

// Send Test Email without OTP (Development Endpoint)
export async function sendSimpleTestEmail(toEmail: string): Promise<nodemailer.SentMessageInfo> {
  const mailTransporter = getTransporter();

  // 1. Verify SMTP Connection
  await mailTransporter.verify();

  const sender = config.emailFrom || `"NEXUS OPERA" <${config.emailUser}>`;

  const mailOptions = {
    from: sender,
    to: toEmail.trim(), // Exact target email address
    subject: 'ERP CRM Email Delivery Test',
    text: 'This is a test email from the ERP CRM application.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #818cf8; margin-bottom: 12px;">ERP CRM Email Delivery Test</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
          This is a test email from the ERP CRM application sent to verify real email delivery for recipient: <strong>${toEmail}</strong>.
        </p>
      </div>
    `,
  };

  const info = await mailTransporter.sendMail(mailOptions);

  const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];
  const rejectedList = Array.isArray(info.rejected) ? info.rejected : [];

  if (rejectedList.includes(toEmail.trim()) || acceptedList.length === 0) {
    console.error(`❌ [SMTP REJECTED TEST EMAIL] Target recipient ${toEmail} was rejected:`, rejectedList);
    throw new AppError(`Test email delivery rejected by SMTP provider for ${toEmail}`, 500, 'EMAIL_REJECTED');
  }

  console.log(`✅ [SMTP TEST EMAIL ACCEPTED] Message ID: ${info.messageId}`);
  console.log(`   Accepted recipients: ${acceptedList.join(', ')}`);
  console.log(`   Provider Response: ${info.response}`);

  return info;
}

// Send OTP Email and verify provider acceptance
export async function sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<nodemailer.SentMessageInfo> {
  const mailTransporter = getTransporter();

  // 1. Verify SMTP connection before attempting send
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
    to: toEmail.trim(), // Exact recipient email entered by user (e.g. 2303031460082@paruluniversity.ac.in)
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
    // 2. Dispatch email via Nodemailer
    const info = await mailTransporter.sendMail(mailOptions);

    // 3. Inspect provider response: accepted vs rejected recipients
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
