import { Router } from 'express';
import { TeacherResponseController } from '../controllers/teacher-response.controller';
import { authenticate, requireTeacher } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { teacherResponseValidation } from '../validators/teacher-response.validator';

const router = Router();

// Apply authentication and teacher role middleware to all routes
router.use(authenticate);
router.use(requireTeacher);

// Get teacher's response statistics (dashboard)
router.get(
  '/statistics',
  validateRequest(teacherResponseValidation.getResponseStatistics),
  TeacherResponseController.getResponseStatistics
);

// Get all reviews for teacher's courses
router.get(
  '/my-courses-reviews',
  validateRequest(teacherResponseValidation.getMyCoursesReviews),
  TeacherResponseController.getMyCoursesReviews
);

// Get pending responses (reviews without teacher response)
router.get(
  '/pending-responses',
  validateRequest(teacherResponseValidation.getPendingResponses),
  TeacherResponseController.getPendingResponses
);

// Add response to a review
router.post(
  '/reviews/:reviewId/response',
  validateRequest(teacherResponseValidation.addResponse),
  TeacherResponseController.addResponse
);

// Update teacher response
router.put(
  '/reviews/:reviewId/response',
  validateRequest(teacherResponseValidation.updateResponse),
  TeacherResponseController.updateResponse
);

// Delete teacher response
router.delete(
  '/reviews/:reviewId/response',
  validateRequest(teacherResponseValidation.deleteResponse),
  TeacherResponseController.deleteResponse
);

export default router;
