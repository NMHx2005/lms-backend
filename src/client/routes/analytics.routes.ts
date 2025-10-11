import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ClientAnalyticsController } from '../controllers/analytics.controller';
import * as courseAnalyticsController from '../controllers/course-analytics.controller';
import * as studentAnalyticsController from '../controllers/student-analytics.controller';

const router = Router();

router.use(authenticate);

// Student analytics (existing - for student dashboard)
router.get('/overview', ClientAnalyticsController.getOverview);
router.get('/progress', ClientAnalyticsController.getProgress);
router.get('/time-spent', ClientAnalyticsController.getTimeSpent);
router.get('/insights', ClientAnalyticsController.getInsights);

// Course analytics (teacher)
router.get('/courses', courseAnalyticsController.getCourseAnalyticsOverview);
router.get('/courses/performance', courseAnalyticsController.getCoursePerformance);
router.get('/courses/comparison', courseAnalyticsController.getCourseComparison);
router.get('/courses/top', courseAnalyticsController.getTopCourses);
router.get('/courses/revenue', courseAnalyticsController.getCourseRevenue);

// Course detail analytics
router.get('/courses/:id', courseAnalyticsController.getCourseAnalyticsDetail);
router.get('/courses/:id/enrollment', courseAnalyticsController.getCourseEnrollmentTrends);
router.get('/courses/:id/completion', courseAnalyticsController.getCourseCompletionRates);
router.get('/courses/:id/engagement', courseAnalyticsController.getCourseEngagementMetrics);
router.get('/courses/:id/revenue', courseAnalyticsController.getCourseRevenueDetail);
router.get('/courses/:id/feedback', courseAnalyticsController.getCourseFeedback);

// Student analytics (teacher - analyzing students)
router.get('/students/overview', studentAnalyticsController.getStudentOverview);
router.get('/students/demographics', studentAnalyticsController.getStudentDemographics);
router.get('/students/progress', studentAnalyticsController.getStudentProgress);
router.get('/students/retention', studentAnalyticsController.getStudentRetention);
router.get('/students/satisfaction', studentAnalyticsController.getStudentSatisfaction);
router.get('/students/activity', studentAnalyticsController.getStudentActivity);

export default router;


