import express from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { adminAnalyticsValidation } from '../validators/analytics.validator';
import { validateRequest } from '../../shared/middleware/validation';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', AnalyticsController.getDashboardAnalytics);

// Get user analytics
router.get('/users', validateRequest(adminAnalyticsValidation.userAnalytics), AnalyticsController.getUserAnalytics);

// Get course analytics
router.get('/courses', validateRequest(adminAnalyticsValidation.courseAnalytics), AnalyticsController.getCourseAnalytics);

// Get revenue analytics
router.get('/revenue', validateRequest([...adminAnalyticsValidation.analyticsPeriod, ...adminAnalyticsValidation.dateRange]), AnalyticsController.getRevenueAnalytics);

// Get enrollment analytics
router.get('/enrollments', validateRequest([...adminAnalyticsValidation.analyticsPeriod, ...adminAnalyticsValidation.dateRange]), AnalyticsController.getEnrollmentAnalytics);

export default router;
