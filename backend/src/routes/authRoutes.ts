import { Router } from 'express';
import { login, register, getCurrentUser, loginSchema, registerSchema } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
