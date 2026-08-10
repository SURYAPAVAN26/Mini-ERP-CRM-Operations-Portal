import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

let transporter: nodemailer.Transporter | null = null;

function createTransporter(): nodemailer.Transporter {
  if (!config.emailHost || !config.emailUser || !config.emailPassword) {
    throw new AppError(
      'Email service is not configured. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD in backend/.env',
      500,
      'EMAIL_NOT_CONFIGURED'
    );
  }

  const port = config.emailPort || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: config.emailHost,
    port: port,
    secure: isSecure,
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed certificate errors
    },
  });
}

// SMTP Connection Verification Test
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const mailTransporter = createTransporter();
    await mailTransporter.verify();
    console.log(`[SMTP SERVICE] Connected successfully to SMTP host: ${config.emailHost}:${config.emailPort}`);
    return true;
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to connect to SMTP host (${config.emailHost}):`, error.message || error);
    return false;
  }
}

export async function sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<void> {
  try {
    const mailTransporter = createTransporter();

    const sender = config.emailFrom || `"NEXUS OPERA" <${config.emailUser}>`;

    const mailOptions = {
      from: sender,
      to: toEmail,
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

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[EMAIL DELIVERED] OTP Email accepted by SMTP server for recipient: ${toEmail} (MessageId: ${info.messageId})`);
  } catch (error: any) {
    console.error(`[EMAIL DELIVERY FAILURE] Could not send OTP email to ${toEmail}:`, error.message || error);
    
    // Throw AppError so API returns 500 error instead of false success!
    throw new AppError(
      'Unable to send verification email. Please check your email address or SMTP configuration.',
      500,
      'EMAIL_DELIVERY_FAILED'
    );
  }
}
