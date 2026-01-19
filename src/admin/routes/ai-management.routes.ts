import { Router } from 'express';
import { AIManagementController } from '../controllers/ai-management.controller';

const router = Router();

// AI Settings
router.get('/settings', AIManagementController.getAISettings);
router.put('/settings', AIManagementController.updateAISettings);

// AI Evaluation History
router.get('/evaluations', AIManagementController.getEvaluations);
router.get('/evaluations/:id', AIManagementController.getEvaluationDetails);

// AI Statistics
router.get('/statistics', AIManagementController.getStatistics);

// Test AI Connection
router.post('/test-connection', AIManagementController.testConnection);

// Manually trigger AI evaluation for a course
router.post('/trigger-evaluation/:courseId', AIManagementController.triggerEvaluation);

export default router;
