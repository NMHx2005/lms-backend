import { Router } from 'express';
import { ClientLessonController } from '../controllers/lesson.controller';
import { authenticate } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { clientLessonValidation } from '../validators/lesson.validator';

const router = Router();

// All lesson routes require authentication (enrolled students and teachers)
router.use(authenticate);

// Teacher CRUD operations (must be before /:id to avoid route conflicts)
router.post('/', ClientLessonController.createLesson);
router.put('/:id', ClientLessonController.updateLesson);
router.delete('/:id', ClientLessonController.deleteLesson);
router.patch('/section/:sectionId/reorder', ClientLessonController.reorderLessons);

// Get lesson by ID (for enrolled students)
router.get('/:id', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonById);

// Get lessons by section (for enrolled students)
router.get('/section/:sectionId', validateRequest(clientLessonValidation.sectionId), ClientLessonController.getLessonsBySection);

// Get lesson content (for enrolled students)
router.get('/:id/content', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonContent);

// Get lesson progress
router.get('/:id/progress', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonProgress);

// Get next lesson (for navigation)
router.get('/:id/next', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getNextLesson);

// Get previous lesson (for navigation)
router.get('/:id/previous', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getPreviousLesson);

// Mark lesson as completed
router.post('/:id/complete', validateRequest(clientLessonValidation.lessonId), ClientLessonController.markLessonCompleted);

// Track time spent on lesson
router.post('/:id/time', validateRequest(clientLessonValidation.addTime), ClientLessonController.addTimeSpent);

// Get lesson attachments
router.get('/:id/attachments', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonAttachments);

// Get lesson navigation (previous/next)
router.get('/:id/navigation', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonNavigation);

// Get lesson summary
router.get('/:id/summary', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonSummary);

export default router;
