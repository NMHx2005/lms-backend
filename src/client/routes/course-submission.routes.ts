import { Router } from 'express';
import { CourseSubmissionController } from '../controllers/course-submission.controller';
import { authenticate, requireTeacher } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { courseSubmissionValidation } from '../validators/course-submission.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTeacher);

// Get teacher's submission statistics (dashboard)
router.get('/statistics', CourseSubmissionController.getSubmissionStatistics);

// Get my evaluations
router.get(
  '/evaluations',
  validateRequest(courseSubmissionValidation.getMyEvaluations),
  CourseSubmissionController.getMyEvaluations
);

// Get submittable courses
router.get('/submittable', CourseSubmissionController.getSubmittableCourses);

// Get courses needing revision
router.get('/needs-revision', CourseSubmissionController.getCoursesNeedingRevision);

// Submit course for AI evaluation
router.post(
  '/courses/:courseId/submit',
  validateRequest(courseSubmissionValidation.submitCourseForEvaluation),
  CourseSubmissionController.submitCourseForEvaluation
);

// Get course submission status
router.get(
  '/courses/:courseId/status',
  validateRequest(courseSubmissionValidation.getCourseSubmissionStatus),
  CourseSubmissionController.getCourseSubmissionStatus
);

// Resubmit course after revision
router.post(
  '/courses/:courseId/resubmit',
  validateRequest(courseSubmissionValidation.resubmitCourse),
  CourseSubmissionController.resubmitCourse
);

// Get evaluation details
router.get(
  '/evaluations/:evaluationId',
  validateRequest(courseSubmissionValidation.getEvaluationDetails),
  CourseSubmissionController.getEvaluationDetails
);

// Get evaluation feedback summary
router.get(
  '/evaluations/:evaluationId/feedback',
  validateRequest(courseSubmissionValidation.getEvaluationFeedback),
  CourseSubmissionController.getEvaluationFeedback
);

export default router;
