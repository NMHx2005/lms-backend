import { Router } from 'express';
import { ClientLessonController } from '../controllers/lesson.controller';
import { FileController } from '../controllers/file.controller';
import { authenticate } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { clientLessonValidation } from '../validators/lesson.validator';
import { multerInstances } from '../../shared/middleware/multer';
import { requireTeacher } from '../../shared/middleware/auth';

const router = Router();

// All lesson routes require authentication (enrolled students and teachers)
router.use(authenticate);

// Teacher CRUD operations (must be before /:id to avoid route conflicts)
router.post('/', ClientLessonController.createLesson);
router.put('/:id', ClientLessonController.updateLesson);
router.delete('/:id', ClientLessonController.deleteLesson);
router.patch('/section/:sectionId/reorder', ClientLessonController.reorderLessons);

// File routes - MUST be before /:id routes to avoid route conflicts
router.post('/:id/files', 
  requireTeacher,
  validateRequest(clientLessonValidation.lessonId),
  multerInstances.mixedFiles.array('files', 20),
  FileController.uploadFiles as any
);
router.get('/:id/files', 
  validateRequest(clientLessonValidation.lessonId),
  FileController.getFiles as any
);
router.delete('/:id/files/:fileId', 
  requireTeacher,
  validateRequest(clientLessonValidation.lessonId),
  FileController.deleteFile as any
);

// Quiz routes - MUST be before /:id routes to avoid route conflicts
router.get('/:id/quiz/attempts', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getQuizAttempts);
router.post('/:id/quiz/attempts', validateRequest(clientLessonValidation.lessonId), ClientLessonController.submitQuizAttempt);
router.get('/:id/quiz/settings', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getQuizSettings);
router.get('/:id/quiz/analytics', validateRequest(clientLessonValidation.lessonId), ClientLessonController.getQuizAnalytics);

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
