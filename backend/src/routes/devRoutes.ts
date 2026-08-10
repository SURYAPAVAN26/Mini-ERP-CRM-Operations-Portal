import { Router, Request, Response, NextFunction } from 'express';
import { getTransporter, verifySmtpConnection, sendOtpEmail } from '../services/emailService';
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

// GET /api/dev/verify-smtp - Test SMTP connection & report variable configuration status
router.get('/verify-smtp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await verifySmtpConnection();
    res.json({
      success: result.success,
      status: result.status,
      message: result.message,
      configStatus: result.configStatus,
    });
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

    const targetEmail = String(email).trim();

    // Send test email
    const info = await sendOtpEmail(targetEmail, 'Test User', '123456');

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
