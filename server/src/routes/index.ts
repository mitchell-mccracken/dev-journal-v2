import { Router } from 'express';
import authRoutes from './auth';
import cameraRoutes from './cameras';
import filmStockRoutes from './filmStocks';
import filmRollRoutes from './filmRolls';
import chemicalBatchRoutes from './chemicalBatches';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cameras', cameraRoutes);
router.use('/film-stocks', filmStockRoutes);
router.use('/film-rolls', filmRollRoutes);
router.use('/chemical-batches', chemicalBatchRoutes);

export default router;
