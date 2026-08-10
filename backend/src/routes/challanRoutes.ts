import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
  createChallanSchema,
} from '../controllers/challanController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallans);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallanById);

router.post('/', requireRole(['ADMIN', 'SALES']), validate(createChallanSchema), createChallan);
router.post('/:id/confirm', requireRole(['ADMIN', 'SALES']), confirmChallan);
router.post('/:id/cancel', requireRole(['ADMIN', 'SALES']), cancelChallan);

export default router;
