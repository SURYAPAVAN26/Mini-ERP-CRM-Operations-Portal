import { Router } from 'express';
import {
  getInventorySummary,
  getStockMovements,
  adjustStock,
  stockAdjustmentSchema,
} from '../controllers/inventoryController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getInventorySummary);
router.get('/movements', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getStockMovements);
router.post('/adjust', requireRole(['ADMIN', 'WAREHOUSE']), validate(stockAdjustmentSchema), adjustStock);

export default router;
