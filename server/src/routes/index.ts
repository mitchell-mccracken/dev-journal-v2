import { Router } from 'express';
import authRoutes from './auth';
import cameraRoutes from './cameras';
import filmStockRoutes from './filmStocks';
import filmRollRoutes from './filmRolls';
import chemicalBatchRoutes from './chemicalBatches';
import genericChemicalRoutes from './genericChemicals';
import oneShotBatchRoutes from './oneShotBatches';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cameras', cameraRoutes);
router.use('/film-stocks', filmStockRoutes);
router.use('/film-rolls', filmRollRoutes);
router.use('/chemical-batches', chemicalBatchRoutes);
router.use('/generic-chemicals', genericChemicalRoutes);
router.use('/one-shot-batches', oneShotBatchRoutes);

export default router;
