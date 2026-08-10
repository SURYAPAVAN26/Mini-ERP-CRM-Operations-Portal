import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Check if custom SMTP host and credentials are set in .env
  if (config.emailHost && config.emailUser) {
    console.log(`[SMTP CONFIG] Creating transporter for ${config.emailHost}:${config.emailPort} (User: ${config.emailUser}, Secure: ${config.emailSecure})`);
    
    cachedTransporter = nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPort,
      secure: config.emailSecure,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
      tls: {
        rejectUnauthorized: false, // Prevents certificate verification issues
      },
    });

    return cachedTransporter;
  }

  // Fallback for local development when SMTP_HOST is not yet configured in .env
  console.log('ℹ️ [SMTP INFO] SMTP_HOST not set in .env. Initializing Ethereal test email sandbox...');
  const testAccount = await nodemailer.createTestAccount();
  
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log(`[SMTP DEV SANDBOX] Ethereal test transporter ready (User: ${testAccount.user})`);
  return cachedTransporter;
}

// SMTP Connection Verification Test
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const mailTransporter = await getTransporter();
    await mailTransporter.verify();
    if (config.emailHost) {
      console.log(`✅ [SMTP VERIFIED] Successfully connected to ${config.emailHost}:${config.emailPort}`);
    }
    return true;
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const code = error.code || error.responseCode || 'SMTP_ERROR';
    console.error(`❌ [SMTP VERIFICATION FAILED] Host: ${config.emailHost}, Error (${code}): ${errorMsg}`);
    return false;
  }
}

export async function sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<void> {
  let mailTransporter: nodemailer.Transporter;
  
  try {
    mailTransporter = await getTransporter();
  } catch (initError: any) {
    const initMsg = initError.message || String(initError);
    console.error('❌ [SMTP INIT FAILED]:', initMsg);
    throw new AppError(`SMTP Configuration Error: ${initMsg}`, 500, 'SMTP_INIT_FAILED');
  }

  const sender = config.emailFrom || (config.emailUser ? `"NEXUS OPERA" <${config.emailUser}>` : 'NEXUS OPERA <noreply@nexusopera.com>');

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

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`📧 [ETHEREAL DEV INBOX] Test Email Sent! View message online: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`✅ [EMAIL DELIVERED] OTP Email successfully accepted by SMTP server for ${toEmail} (MessageId: ${info.messageId})`);
    }
  } catch (sendError: any) {
    const rawError = sendError.message || String(sendError);
    const code = sendError.code || sendError.responseCode || 'SMTP_SEND_FAILED';

    console.error(`❌ [SMTP DELIVERY FAILED] Could not send email to ${toEmail}:`);
    console.error(`   Error Code: ${code}`);
    console.error(`   Error Message: ${rawError}`);

    let userFriendlyMsg = 'Unable to send verification email. Please check your email address or SMTP configuration.';
    if (process.env.NODE_ENV !== 'production') {
      userFriendlyMsg += ` Details: [${code}] ${rawError}`;
    }

    throw new AppError(userFriendlyMsg, 500, 'EMAIL_DELIVERY_FAILED');
  }
}
