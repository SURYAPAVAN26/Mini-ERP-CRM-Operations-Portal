import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

let cachedTransporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // 1. If SMTP Host & User are configured in backend/.env
  if (config.emailHost && config.emailUser) {
    console.log(`[SMTP CONFIG] Using custom SMTP server: ${config.emailHost}:${config.emailPort} (User: ${config.emailUser}, Secure: ${config.emailSecure})`);
    
    cachedTransporter = nodemailer.createTransport({
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

    return cachedTransporter;
  }

  // 2. Local Development Sandbox Fallback (Ethereal test accounts)
  console.log('ℹ️ [SMTP INFO] SMTP_HOST not configured in backend/.env. Creating Ethereal sandbox transporter...');
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

  console.log(`[SMTP DEV SANDBOX] Ethereal test inbox ready (Account: ${testAccount.user})`);
  return cachedTransporter;
}

// Log safe configuration details without printing passwords
export function logSafeSmtpConfig(): void {
  console.log('--- SMTP Configuration Summary ---');
  console.log(`SMTP Host:     ${config.emailHost || 'NOT CONFIGURED (Using Ethereal Sandbox)'}`);
  console.log(`SMTP Port:     ${config.emailPort} (secure: ${config.emailSecure})`);
  console.log(`SMTP User:     ${config.emailUser ? `configured (${config.emailUser})` : 'NOT CONFIGURED'}`);
  console.log(`SMTP Password: ${config.emailPassword ? 'configured' : 'NOT CONFIGURED'}`);
  console.log(`FROM Address:  ${config.emailFrom || 'NOT CONFIGURED'}`);
  console.log('----------------------------------');
}

// Test SMTP connection via transporter.verify()
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  logSafeSmtpConfig();

  try {
    const mailTransporter = await getTransporter();
    await mailTransporter.verify();
    
    if (config.emailHost) {
      console.log(`✅ [SMTP VERIFIED] Successfully authenticated with ${config.emailHost}:${config.emailPort}`);
      return { success: true, message: `Successfully authenticated with ${config.emailHost}:${config.emailPort}` };
    } else {
      console.log(`ℹ️ [SMTP SANDBOX VERIFIED] Ethereal dev inbox ready.`);
      return { success: true, message: `Ethereal dev sandbox ready. Set EMAIL_HOST and EMAIL_USER in .env for live inbox delivery.` };
    }
  } catch (error: any) {
    const rawError = error.message || String(error);
    const code = error.code || error.responseCode || 'SMTP_VERIFY_FAILED';
    console.error(`❌ [SMTP VERIFICATION FAILED] Host: ${config.emailHost || 'ethereal'}, Error (${code}): ${rawError}`);
    return { success: false, message: `SMTP Verification Failed [${code}]: ${rawError}` };
  }
}

// Send OTP Email and verify provider acceptance
export async function sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<nodemailer.SentMessageInfo> {
  const mailTransporter = await getTransporter();

  // 1. Verify SMTP connection before attempting send
  try {
    await mailTransporter.verify();
  } catch (verifyError: any) {
    const vMsg = verifyError.message || String(verifyError);
    const vCode = verifyError.code || verifyError.responseCode || 'SMTP_AUTH_FAILED';
    console.error(`❌ [SMTP AUTH FAILED] Cannot send email to ${toEmail}. Error (${vCode}): ${vMsg}`);
    throw new AppError(`SMTP Connection/Auth Failed [${vCode}]: ${vMsg}`, 500, 'SMTP_AUTH_FAILED');
  }

  const sender = config.emailFrom || (config.emailUser ? `"NEXUS OPERA" <${config.emailUser}>` : 'NEXUS OPERA <noreply@nexusopera.com>');

  const mailOptions = {
    from: sender,
    to: toEmail.trim(), // Exact recipient email entered by user
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
      console.error(`❌ [SMTP REJECTED] Recipient ${toEmail} was rejected by SMTP server:`, rejectedList);
      throw new AppError(`Email delivery was rejected by SMTP provider for ${toEmail}`, 500, 'EMAIL_REJECTED');
    }

    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`📧 [DEV SANDBOX INBOX] Ethereal Message Sent! Preview online: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`✅ [EMAIL ACCEPTED BY SMTP] Message ID: ${info.messageId}`);
      console.log(`   Accepted recipients: ${acceptedList.join(', ')}`);
      console.log(`   Provider Response: ${info.response}`);
    }

    return info;
  } catch (sendError: any) {
    if (sendError instanceof AppError) {
      throw sendError;
    }

    const rawError = sendError.message || String(sendError);
    const code = sendError.code || sendError.responseCode || 'SMTP_SEND_FAILED';

    console.error(`❌ [SMTP DELIVERY FAILED] Could not send email to ${toEmail}:`);
    console.error(`   Error Code: ${code}`);
    console.error(`   Error Message: ${rawError}`);

    let devErrMsg = `Unable to send verification email. SMTP Error [${code}]: ${rawError}`;
    throw new AppError(devErrMsg, 500, 'EMAIL_DELIVERY_FAILED');
  }
}
