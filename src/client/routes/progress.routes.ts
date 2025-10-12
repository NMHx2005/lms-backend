import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { validateRequest } from '../../shared/middleware/validation';
import { clientProgressValidation } from '../validators/progress.validator';

const router = Router();

// Mark lesson as completed
router.post('/course/:courseId/lesson/:lessonId/complete',
    validateRequest(clientProgressValidation.markLessonCompleted),
    ProgressController.markLessonCompleted
);

// Get lesson progress
router.get('/course/:courseId/lesson/:lessonId',
    validateRequest(clientProgressValidation.getLessonProgress),
    ProgressController.getLessonProgress
);

// Get course progress
router.get('/course/:courseId',
    validateRequest(clientProgressValidation.getCourseProgress),
    ProgressController.getCourseProgress
);

// Add time spent on lesson
router.post('/course/:courseId/lesson/:lessonId/time',
    validateRequest(clientProgressValidation.addTimeSpent),
    ProgressController.addTimeSpent
);

export default router;
