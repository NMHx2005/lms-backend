import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { MetricsController, metricsMiddleware } from '../controllers/metrics.controller';

const router = Router();

// Collect per-route metrics globally for these routes
router.use(metricsMiddleware);

// Only admin
router.use(authenticate, requirePermission('*', '*'));

router.get('/system', MetricsController.system);
router.get('/api', MetricsController.api);

export default router;


