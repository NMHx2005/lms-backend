import { Router } from 'express';
import { QuizHistoryController } from '../controllers/quiz-history.controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all quiz attempts for current user
router.get('/', QuizHistoryController.getAllQuizAttempts);

// Get quiz attempt by ID
router.get('/:id', QuizHistoryController.getQuizAttemptById);

export default router;
