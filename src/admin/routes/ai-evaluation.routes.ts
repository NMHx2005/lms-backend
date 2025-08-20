import { Router } from 'express';
import { AdminAIEvaluationController } from '../controllers/ai-evaluation.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { adminAIEvaluationValidation } from '../validators/ai-evaluation.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// Get evaluation statistics (dashboard)
router.get('/statistics', AdminAIEvaluationController.getEvaluationStatistics);

// Get pending evaluations
router.get(
  '/pending',
  validateRequest(adminAIEvaluationValidation.getPendingEvaluations),
  AdminAIEvaluationController.getPendingEvaluations
);

// Get all evaluations with filtering
router.get(
  '/',
  validateRequest(adminAIEvaluationValidation.getAllEvaluations),
  AdminAIEvaluationController.getAllEvaluations
);

// Export evaluations to CSV
router.get(
  '/export',
  validateRequest(adminAIEvaluationValidation.exportEvaluations),
  AdminAIEvaluationController.exportEvaluations
);

// Get evaluation by ID
router.get(
  '/:id',
  validateRequest(adminAIEvaluationValidation.getEvaluationById),
  AdminAIEvaluationController.getEvaluationById
);

// Submit admin review decision
router.post(
  '/:id/review',
  validateRequest(adminAIEvaluationValidation.submitAdminReview),
  AdminAIEvaluationController.submitAdminReview
);

// Retry AI evaluation for failed evaluations
router.post(
  '/:id/retry',
  validateRequest(adminAIEvaluationValidation.retryAIEvaluation),
  AdminAIEvaluationController.retryAIEvaluation
);

// Bulk approve evaluations
router.post(
  '/bulk/approve',
  validateRequest(adminAIEvaluationValidation.bulkApproveEvaluations),
  AdminAIEvaluationController.bulkApproveEvaluations
);

// Get course evaluation history
router.get(
  '/course/:courseId/history',
  validateRequest(adminAIEvaluationValidation.getCourseEvaluationHistory),
  AdminAIEvaluationController.getCourseEvaluationHistory
);

export default router;
