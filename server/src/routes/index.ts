import { Hono } from 'hono';
import authRoutes from './auth';
import cameraRoutes from './cameras';
import filmStockRoutes from './filmStocks';
import filmRollRoutes from './filmRolls';
import chemicalBatchRoutes from './chemicalBatches';
import genericChemicalRoutes from './genericChemicals';
import oneShotBatchRoutes from './oneShotBatches';

const router = new Hono();

router.route('/auth', authRoutes);
router.route('/cameras', cameraRoutes);
router.route('/film-stocks', filmStockRoutes);
router.route('/film-rolls', filmRollRoutes);
router.route('/chemical-batches', chemicalBatchRoutes);
router.route('/generic-chemicals', genericChemicalRoutes);
router.route('/one-shot-batches', oneShotBatchRoutes);

export default router;
