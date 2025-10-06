import { Router } from 'express';
import { PerformanceController } from '../controllers/performance.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply authentication and admin role middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// System Overview
router.get('/system/overview', PerformanceController.getSystemOverview);

// Performance Metrics
router.get('/analytics/dashboard', PerformanceController.getPerformanceMetrics);

// Activity Summary
router.get('/activity/summary', PerformanceController.getActivitySummary);

// System Logs
router.get('/system/logs', PerformanceController.getSystemLogs);

// Backup Performance
router.get('/system/backup', PerformanceController.getBackupPerformance);

export default router;
