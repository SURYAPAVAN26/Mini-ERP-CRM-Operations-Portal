import { Router, Request, Response, NextFunction } from 'express';
import { getTransporter, verifySmtpConnection, sendSimpleTestEmail } from '../services/emailService';
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
    res.json({
      success: result.success,
      smtpConnection: result.success ? 'PASS' : 'FAIL',
      message: result.message,
      config: {
        host: config.emailHost || 'NOT CONFIGURED',
        port: config.emailPort,
        secure: config.emailSecure,
        userConfigured: !!config.emailUser,
        passConfigured: !!config.emailPassword,
        from: config.emailFrom || 'NOT CONFIGURED',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/dev/test-email - Send a test email to specified test address (e.g. 2303031460082@paruluniversity.ac.in)
router.post('/test-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Recipient email address is required', 400, 'MISSING_EMAIL');
    }

    const targetEmail = String(email).trim();

    // Send simple test email without OTP
    const info = await sendSimpleTestEmail(targetEmail);

    const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];
    const rejectedList = Array.isArray(info.rejected) ? info.rejected : [];

    res.json({
      success: true,
      smtpConnection: 'PASS',
      provider: config.emailHost || 'SMTP Server',
      recipient: acceptedList.includes(targetEmail) ? 'accepted' : 'rejected',
      messageId: info.messageId,
      acceptedRecipients: acceptedList,
      rejectedRecipients: rejectedList,
      smtpResponse: info.response,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
