import { Router } from 'express';
import { login, getCurrentUser, loginSchema } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
