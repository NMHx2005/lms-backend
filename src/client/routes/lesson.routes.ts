import { Router } from 'express';
import { ClientLessonController } from '../controllers/lesson.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { clientLessonValidation } from '../validators/lesson.validator';

const router = Router();

// All lesson routes require authentication (enrolled students only)
router.use(authenticate);

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

// Get lesson attachments
router.get('/:id/attachments', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonAttachments);

// Get lesson navigation (previous/next)
router.get('/:id/navigation', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonNavigation);

// Get lesson summary
router.get('/:id/summary', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getLessonSummary);

export default router;
