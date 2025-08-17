import express from 'express';
import { SystemController } from '../controllers/system.controller';
import { adminSystemValidation } from '../validators/system.validator';
import { validateRequest } from '../../shared/middleware/validation';

const router = express.Router();

// Get system overview
router.get('/overview', SystemController.getSystemOverview);

// Get pending refunds
router.get('/refunds', validateRequest(adminSystemValidation.refundQuery), SystemController.getRefunds);

// Process refund request
router.put('/refunds/:id/process', 
  validateRequest([...adminSystemValidation.refundId, ...adminSystemValidation.processRefund]), 
  SystemController.processRefund
);

// Get system logs
router.get('/logs', validateRequest(adminSystemValidation.systemLogsQuery), SystemController.getSystemLogs);

// Get system settings
router.get('/settings', SystemController.getSystemSettings);

// Update system settings
router.put('/settings', validateRequest(adminSystemValidation.updateSystemSettings), SystemController.updateSystemSettings);

// Get backup status
router.get('/backup', SystemController.getBackupStatus);

export default router;
