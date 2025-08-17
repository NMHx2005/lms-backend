import { Router } from 'express';
import { ClientCourseController } from '../controllers/course.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { clientCourseValidation } from '../validators/course.validator';

const router = Router();

// Public routes (no authentication required)
router.get('/', ClientCourseController.getPublishedCourses);
router.get('/categories', ClientCourseController.getCourseCategories);
router.get('/featured', ClientCourseController.getFeaturedCourses);
router.get('/popular', ClientCourseController.getPopularCourses);
router.get('/search', ClientCourseController.searchCourses);
router.get('/instructor/:instructorId', ClientCourseController.getCoursesByInstructor);
router.get('/:id', ClientCourseController.getCourseById);
router.get('/:id/related', ClientCourseController.getRelatedCourses);

// Protected routes (authentication required)
router.get('/:id/content', authenticate, ClientCourseController.getCourseContent);
router.get('/:id/progress', authenticate, ClientCourseController.getCourseProgress);
router.get('/:id/lessons/:lessonId', authenticate, ClientCourseController.getLessonContent);
router.get('/recommendations', authenticate, ClientCourseController.getCourseRecommendations);

export default router;
