import { Router } from 'express';
import { QuestionBankController } from '../controllers/question-bank.controller';
import { authenticate } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get question bank
router.get('/', QuestionBankController.getQuestionBank);

// Create question
router.post('/', QuestionBankController.createQuestion);

// Update question
router.put('/:id', QuestionBankController.updateQuestion);

// Delete question
router.delete('/:id', QuestionBankController.deleteQuestion);

// Add questions to lesson
router.post('/add-to-lesson', QuestionBankController.addQuestionsToLesson);

export default router;
