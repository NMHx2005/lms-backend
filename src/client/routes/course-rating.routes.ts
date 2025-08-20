import { Router } from 'express';
import { CourseRatingController } from '../controllers/course-rating.controller';
import { authenticate, requireStudent } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { courseRatingValidation } from '../validators/course-rating.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Public routes (any authenticated user can view)
// Get course reviews
router.get(
  '/courses/:courseId/reviews',
  validateRequest(courseRatingValidation.getCourseReviews),
  CourseRatingController.getCourseReviews
);

// Get course rating summary
router.get(
  '/courses/:courseId/summary',
  validateRequest(courseRatingValidation.getCourseSummary),
  CourseRatingController.getCourseSummary
);

// Student-only routes (enrolled students can interact)
router.use(requireStudent);

// Create review for a course
router.post(
  '/courses/:courseId/reviews',
  validateRequest(courseRatingValidation.createReview),
  CourseRatingController.createReview
);

// Get user's review for a course
router.get(
  '/courses/:courseId/my-review',
  validateRequest(courseRatingValidation.getUserReview),
  CourseRatingController.getUserReview
);

// Update user's review
router.put(
  '/reviews/:reviewId',
  validateRequest(courseRatingValidation.updateReview),
  CourseRatingController.updateReview
);

// Delete user's review
router.delete(
  '/reviews/:reviewId',
  validateRequest(courseRatingValidation.deleteReview),
  CourseRatingController.deleteReview
);

// Upvote a review
router.post(
  '/reviews/:reviewId/upvote',
  validateRequest(courseRatingValidation.voteReview),
  CourseRatingController.upvoteReview
);

// Downvote a review
router.post(
  '/reviews/:reviewId/downvote',
  validateRequest(courseRatingValidation.voteReview),
  CourseRatingController.downvoteReview
);

// Mark review as helpful
router.post(
  '/reviews/:reviewId/helpful',
  validateRequest(courseRatingValidation.markHelpful),
  CourseRatingController.markReviewHelpful
);

// Report a review
router.post(
  '/reviews/:reviewId/report',
  validateRequest(courseRatingValidation.reportReview),
  CourseRatingController.reportReview
);

// Get user's own reviews
router.get(
  '/my-reviews',
  validateRequest(courseRatingValidation.getMyReviews),
  CourseRatingController.getMyReviews
);

// Get user's review statistics
router.get(
  '/my-reviews/stats',
  CourseRatingController.getMyReviewStats
);

export default router;
