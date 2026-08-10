import { Router, Request, Response, NextFunction } from 'express';
import { getTransporter, verifySmtpConnection } from '../services/emailService';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Development-only middleware guard
router.use((req: Request, res: Response, next: NextFunction) => {
  if (config.nodeEnv === 'production') {
    res.status(403).json({
      success: false,
      message: 'Development test endpoints are disabled in production environment.',
    });
    return;
  }
  next();
});

// GET /api/dev/verify-smtp - Test SMTP connection & credentials
router.get('/verify-smtp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await verifySmtpConnection();
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        config: {
          host: config.emailHost,
          port: config.emailPort,
          secure: config.emailSecure,
          userConfigured: !!config.emailUser,
          passConfigured: !!config.emailPassword,
          from: config.emailFrom,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        config: {
          host: config.emailHost,
          port: config.emailPort,
          secure: config.emailSecure,
          userConfigured: !!config.emailUser,
          passConfigured: !!config.emailPassword,
          from: config.emailFrom,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/dev/test-email - Send a test email to specified test address
router.post('/test-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Recipient email address is required', 400, 'MISSING_EMAIL');
    }

    const mailTransporter = await getTransporter();
    
    // 1. Verify connection
    await mailTransporter.verify();

    const sender = config.emailFrom || `"NEXUS OPERA" <${config.emailUser}>`;

    // 2. Send test email
    const info = await mailTransporter.sendMail({
      from: sender,
      to: email.trim(),
      subject: 'Test Email - NEXUS OPERA',
      text: 'This is a test email from NEXUS OPERA development environment.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #6366f1; border-radius: 8px; background: #0f172a; color: #ffffff;">
          <h2 style="color: #818cf8;">Test Email - NEXUS OPERA</h2>
          <p>This is a test email sent from the NEXUS OPERA development environment to verify SMTP email delivery.</p>
          <p style="color: #94a3b8; font-size: 13px;">Recipient: ${email}</p>
        </div>
      `,
    });

    const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];
    const rejectedList = Array.isArray(info.rejected) ? info.rejected : [];

    if (rejectedList.includes(email.trim()) || acceptedList.length === 0) {
      res.status(500).json({
        success: false,
        message: 'Test email was rejected by SMTP provider',
        rejected: rejectedList,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Test email successfully accepted by SMTP provider!',
      data: {
        messageId: info.messageId,
        accepted: acceptedList,
        rejected: rejectedList,
        response: info.response,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
