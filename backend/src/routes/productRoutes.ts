import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  createProductSchema,
  updateProductSchema,
} from '../controllers/productController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

// All roles can view product list & detail
router.get('/', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getProducts);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getProductById);

// Admin & Warehouse can create & update products
router.post('/', requireRole(['ADMIN', 'WAREHOUSE']), validate(createProductSchema), createProduct);
router.put('/:id', requireRole(['ADMIN', 'WAREHOUSE']), validate(updateProductSchema), updateProduct);

export default router;
