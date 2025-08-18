import { Router } from 'express';
import { AdminAssignmentController } from '../controllers/assignment.controller';
import { authenticate, requireAdmin, requireTeacher } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { adminAssignmentValidation } from '../validators/assignment.validator';

const router = Router();
const assignmentController = new AdminAssignmentController();

// Apply authentication and authorization middleware to all routes
router.use(authenticate);
router.use(requireAdmin || requireTeacher);

// Assignment CRUD operations
router.post('/', 
  validateRequest(adminAssignmentValidation.createAssignment),
  assignmentController.createAssignment
);

router.get('/:id', 
  validateRequest(adminAssignmentValidation.assignmentId),
  assignmentController.getAssignmentById
);

router.put('/:id', 
  validateRequest(adminAssignmentValidation.updateAssignment),
  assignmentController.updateAssignment
);

router.delete('/:id', 
  validateRequest(adminAssignmentValidation.assignmentId),
  assignmentController.deleteAssignment
);

// Get assignments by lesson
router.get('/lesson/:lessonId', 
  validateRequest(adminAssignmentValidation.getAssignmentsByLesson),
  assignmentController.getAssignmentsByLesson
);

// Get assignments by course
router.get('/course/:courseId', 
  validateRequest(adminAssignmentValidation.getAssignmentsByCourse),
  assignmentController.getAssignmentsByCourse
);

// Assignment management
router.patch('/:id/required', 
  validateRequest(adminAssignmentValidation.toggleAssignmentRequired),
  assignmentController.toggleAssignmentRequired
);

router.get('/:id/stats', 
  validateRequest(adminAssignmentValidation.assignmentId),
  assignmentController.getAssignmentStats
);

// Get overdue assignments
router.get('/overdue', 
  validateRequest(adminAssignmentValidation.getOverdueAssignments),
  assignmentController.getOverdueAssignments
);

// Bulk operations
router.patch('/course/:courseId/bulk-update', 
  validateRequest(adminAssignmentValidation.bulkUpdateAssignments),
  assignmentController.bulkUpdateAssignments
);

// Attachment management
router.post('/:id/attachments', 
  validateRequest(adminAssignmentValidation.addAttachment),
  assignmentController.addAttachment
);

router.delete('/:id/attachments/:attachmentIndex', 
  validateRequest(adminAssignmentValidation.removeAttachment),
  assignmentController.removeAttachment
);

// Search assignments
router.get('/search', 
  validateRequest(adminAssignmentValidation.searchAssignments),
  assignmentController.searchAssignments
);

export default router;
