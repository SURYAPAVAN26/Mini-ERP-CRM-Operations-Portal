import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
  createCustomerSchema,
  updateCustomerSchema,
  followUpSchema,
} from '../controllers/customerController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

// All roles can view customer lists and details
router.get('/', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getCustomers);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getCustomerById);

// Admin & Sales can create, update, and add follow-up notes
router.post('/', requireRole(['ADMIN', 'SALES']), validate(createCustomerSchema), createCustomer);
router.put('/:id', requireRole(['ADMIN', 'SALES']), validate(updateCustomerSchema), updateCustomer);
router.post('/:id/notes', requireRole(['ADMIN', 'SALES']), validate(followUpSchema), addFollowUpNote);

export default router;
