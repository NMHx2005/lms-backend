import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import EnhancedCourseController from '../controllers/enhanced-course.controller';

const router = Router();

// Public routes
router.get('/enhanced', EnhancedCourseController.getCoursesWithFilters);
router.get('/search', EnhancedCourseController.searchCourses);
router.get('/stats/category', EnhancedCourseController.getCourseStatsByCategory);
router.get('/stats/accessibility', EnhancedCourseController.getAccessibilityStats);
router.get('/stats/monetization', EnhancedCourseController.getMonetizationStats);

// Protected routes (require authentication)
router.use(authenticate);

router.put('/:id/analytics', EnhancedCourseController.updateCourseAnalytics as any);
router.put('/:id/seo', EnhancedCourseController.updateCourseSEO as any);
router.put('/:id/localization', EnhancedCourseController.updateCourseLocalization as any);
router.put('/:id/compliance', EnhancedCourseController.updateCourseCompliance as any);
router.post('/recommendations', EnhancedCourseController.getCourseRecommendations as any);

export default router;
