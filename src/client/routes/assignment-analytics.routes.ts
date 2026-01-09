import { Router, RequestHandler } from 'express';
import { AssignmentAnalyticsController } from '../controllers/assignment-analytics.controller';
import { authenticate, requireTeacher } from '../../shared/middleware/auth';

const router = Router();

// All routes require authentication and teacher role
router.use(authenticate);
router.use(requireTeacher);

// Get assignment analytics
router.get('/assignments/:assignmentId/analytics', AssignmentAnalyticsController.getAnalytics as any);

// Get student performance
router.get('/assignments/:assignmentId/students/:studentId/performance', AssignmentAnalyticsController.getStudentPerformance as any);

export default router;
