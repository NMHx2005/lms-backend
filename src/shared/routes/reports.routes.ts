import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ReportsController } from '../controllers/reports.controller';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.use(authenticate);

// Export
router.get('/export.csv', ReportsController.exportCsv);
router.get('/export.pdf', ReportsController.exportPdf);

// Schedules
router.post('/schedules', validateRequest([]), ReportsController.createSchedule);
router.get('/schedules', ReportsController.listSchedules);
router.delete('/schedules/:id', ReportsController.deleteSchedule);

// Custom builder & templates
router.post('/custom', ReportsController.customReport);
router.get('/templates', ReportsController.templates);

export default router;


