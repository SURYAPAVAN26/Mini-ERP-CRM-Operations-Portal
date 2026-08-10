import nodemailer from 'nodemailer';
import { config } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.emailHost && config.emailUser) {
    transporter = nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPort,
      secure: config.emailPort === 465,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
  } else {
    // Development fallback using Ethereal Test Account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EMAIL SERVICE] Initialized Nodemailer with Ethereal test account (${testAccount.user})`);
  }

  return transporter;
}

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
  try {
    const mailTransporter = await getTransporter();

    const mailOptions = {
      from: config.emailFrom,
      to: toEmail,
      subject: 'NEXUS OPERA - Your Email Verification OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #0f172a; color: #f8fafc;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155;">
            <h1 style="color: #818cf8; margin: 0; font-size: 24px;">NEXUS OPERA</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Enterprise Wholesale ERP & CRM System</p>
          </div>
          
          <div style="padding: 24px 0; text-align: center;">
            <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 12px;">Verify Your Email Address</h2>
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
              Please use the following 6-digit OTP code to verify your account registration. This code is valid for <strong>5 minutes</strong>.
            </p>
            
            <div style="background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; border-radius: 8px; padding: 16px; display: inline-block; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${otpCode}</span>
            </div>
            
            <p style="color: #64748b; font-size: 13px; margin: 0;">
              If you did not request this email verification, please ignore this email.
            </p>
          </div>
          
          <div style="padding-top: 20px; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px;">
            &copy; 2026 NEXUS OPERA. All rights reserved. • Secure Email Verification
          </div>
        </div>
      `,
    };

    const info = await mailTransporter.sendMail(mailOptions);

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[EMAIL SENT] Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`[EMAIL SENT] OTP Email successfully delivered to: ${toEmail}`);
    }

    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send OTP email to ${toEmail}:`, error);
    return false;
  }
}
