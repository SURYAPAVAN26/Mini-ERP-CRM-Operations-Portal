import { Router } from 'express';
import {
  login,
  register,
  verifyOtp,
  resendOtp,
  getCurrentUser,
  adminCreateUser,
  getAllUsers,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  adminCreateUserSchema,
} from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), resendOtp);
router.get('/me', authenticateToken, getCurrentUser);

// Admin User Provisioning & Management Routes (Protected to ADMIN role)
router.post('/admin/users', authenticateToken, authorizeRoles(['ADMIN']), validate(adminCreateUserSchema), adminCreateUser);
router.get('/admin/users', authenticateToken, authorizeRoles(['ADMIN']), getAllUsers);

export default router;
