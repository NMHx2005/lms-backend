import { Router } from 'express';
import { ClientAssignmentController } from '../controllers/assignment.controller';
import { authenticate, requireStudent } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { clientAssignmentValidation } from '../validators/assignment.validator';

const router = Router();
const assignmentController = new ClientAssignmentController();

// Apply authentication and authorization middleware to all routes
router.use(authenticate);
router.use(requireStudent);

// Assignment access
router.get('/:id', 
  validateRequest(clientAssignmentValidation.assignmentId),
  assignmentController.getAssignmentById
);

router.get('/lesson/:lessonId', 
  validateRequest(clientAssignmentValidation.getAssignmentsByLesson),
  assignmentController.getAssignmentsByLesson
);

router.get('/course/:courseId', 
  validateRequest(clientAssignmentValidation.getAssignmentsByCourse),
  assignmentController.getAssignmentsByCourse
);

// Assignment progress and submission
router.get('/:assignmentId/progress', 
  validateRequest(clientAssignmentValidation.getAssignmentProgress),
  assignmentController.getAssignmentProgress
);

router.post('/submit', 
  validateRequest(clientAssignmentValidation.submitAssignment),
  assignmentController.submitAssignment
);

// Student submissions
router.get('/submissions', 
  validateRequest(clientAssignmentValidation.getStudentSubmissions),
  assignmentController.getStudentSubmissions
);

router.get('/submissions/:id', 
  validateRequest(clientAssignmentValidation.getSubmissionById),
  assignmentController.getSubmissionById
);

// Assignment management
router.get('/upcoming', 
  validateRequest(clientAssignmentValidation.getUpcomingAssignments),
  assignmentController.getUpcomingAssignments
);

router.get('/search', 
  validateRequest(clientAssignmentValidation.searchAssignments),
  assignmentController.searchAssignments
);

router.get('/stats', 
  validateRequest(clientAssignmentValidation.getStudentAssignmentStats),
  assignmentController.getStudentAssignmentStats
);

export default router;
