import { Router } from 'express';
import {
  login,
  register,
  verifyOtp,
  resendOtp,
  getCurrentUser,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), resendOtp);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
