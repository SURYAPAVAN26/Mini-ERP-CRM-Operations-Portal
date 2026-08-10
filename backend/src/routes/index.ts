import { Router } from 'express';
import authRoutes from './authRoutes';
import customerRoutes from './customerRoutes';
import productRoutes from './productRoutes';
import inventoryRoutes from './inventoryRoutes';
import challanRoutes from './challanRoutes';
import dashboardRoutes from './dashboardRoutes';

import devRoutes from './devRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/challans', challanRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/dev', devRoutes);

export default router;
