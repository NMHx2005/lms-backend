import { Router, RequestHandler } from 'express';
import { AssignmentGradingController } from '../controllers/assignment-grading.controller';
import { authenticate, requireTeacher } from '../../shared/middleware/auth';

const router = Router();

// All routes require authentication and teacher role
router.use(authenticate);
router.use(requireTeacher);

// Get submissions for an assignment
router.get('/assignments/:assignmentId/submissions', AssignmentGradingController.getSubmissions as any);

// Get submission by ID
router.get('/submissions/:submissionId', AssignmentGradingController.getSubmissionById as any);

// Grade a submission
router.post('/submissions/:submissionId/grade', AssignmentGradingController.gradeSubmission as any);

// Bulk grade submissions
router.post('/submissions/bulk-grade', AssignmentGradingController.bulkGrade as any);

// Return submission for revision
router.post('/submissions/:submissionId/return', AssignmentGradingController.returnSubmission as any);

export default router;
