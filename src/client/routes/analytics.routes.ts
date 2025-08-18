import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ClientAnalyticsController } from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);
router.get('/overview', ClientAnalyticsController.getOverview);
router.get('/progress', ClientAnalyticsController.getProgress);
router.get('/time-spent', ClientAnalyticsController.getTimeSpent);
router.get('/insights', ClientAnalyticsController.getInsights);

export default router;


