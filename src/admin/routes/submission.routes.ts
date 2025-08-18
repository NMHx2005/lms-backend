import { Router } from 'express';
import { AdminSubmissionController } from '../controllers/submission.controller';
import { authenticate, requireAdmin, requireTeacher } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { adminSubmissionValidation } from '../validators/submission.validator';

const router = Router();
const submissionController = new AdminSubmissionController();

// Apply authentication and authorization middleware to all routes
router.use(authenticate);
router.use(requireAdmin || requireTeacher);

// Submission management
router.get('/:id', 
  validateRequest(adminSubmissionValidation.submissionId),
  submissionController.getSubmissionById
);

router.put('/:id', 
  validateRequest(adminSubmissionValidation.updateSubmission),
  submissionController.updateSubmission
);

router.delete('/:id', 
  validateRequest(adminSubmissionValidation.submissionId),
  submissionController.deleteSubmission
);

// Get submissions by assignment
router.get('/assignment/:assignmentId', 
  validateRequest(adminSubmissionValidation.getSubmissionsByAssignment),
  submissionController.getSubmissionsByAssignment
);

// Get submissions by course
router.get('/course/:courseId', 
  validateRequest(adminSubmissionValidation.getSubmissionsByCourse),
  submissionController.getSubmissionsByCourse
);

// Get pending submissions
router.get('/pending', 
  validateRequest(adminSubmissionValidation.getPendingSubmissions),
  submissionController.getPendingSubmissions
);

// Get late submissions
router.get('/late', 
  validateRequest(adminSubmissionValidation.getLateSubmissions),
  submissionController.getLateSubmissions
);

// Grading operations
router.post('/:id/grade', 
  validateRequest(adminSubmissionValidation.gradeSubmission),
  submissionController.gradeSubmission
);

router.post('/bulk-grade', 
  validateRequest(adminSubmissionValidation.bulkGradeSubmissions),
  submissionController.bulkGradeSubmissions
);

// Statistics and analytics
router.get('/stats', 
  validateRequest(adminSubmissionValidation.getSubmissionStats),
  submissionController.getSubmissionStats
);

router.get('/analytics', 
  validateRequest(adminSubmissionValidation.getSubmissionAnalytics),
  submissionController.getSubmissionAnalytics
);

// Search submissions
router.get('/search', 
  validateRequest(adminSubmissionValidation.searchSubmissions),
  submissionController.searchSubmissions
);

export default router;
