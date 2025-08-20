import { Router } from 'express';
import { ReviewModerationController } from '../controllers/review-moderation.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { reviewModerationValidation } from '../validators/review-moderation.validator';

const router = Router();

// Apply authentication and admin role middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// Get moderation statistics (dashboard)
router.get(
  '/statistics',
  validateRequest(reviewModerationValidation.getModerationStatistics),
  ReviewModerationController.getModerationStatistics
);

// Get reviews needing moderation
router.get(
  '/pending',
  validateRequest(reviewModerationValidation.getReviewsNeedingModeration),
  ReviewModerationController.getReviewsNeedingModeration
);

// Get moderation history
router.get(
  '/history',
  validateRequest(reviewModerationValidation.getModerationHistory),
  ReviewModerationController.getModerationHistory
);

// Get review engagement analytics
router.get(
  '/analytics/engagement',
  validateRequest(reviewModerationValidation.getReviewEngagementAnalytics),
  ReviewModerationController.getReviewEngagementAnalytics
);

// Export moderation data
router.get(
  '/export',
  validateRequest(reviewModerationValidation.exportModerationData),
  ReviewModerationController.exportModerationData
);

// Get detailed review for moderation
router.get(
  '/reviews/:reviewId',
  validateRequest(reviewModerationValidation.getReviewForModeration),
  ReviewModerationController.getReviewForModeration
);

// Moderate a single review
router.post(
  '/reviews/:reviewId/moderate',
  validateRequest(reviewModerationValidation.moderateReview),
  ReviewModerationController.moderateReview
);

// Feature/unfeature a review
router.patch(
  '/reviews/:reviewId/feature',
  validateRequest(reviewModerationValidation.featureReview),
  ReviewModerationController.featureReview
);

// Highlight/unhighlight a review
router.patch(
  '/reviews/:reviewId/highlight',
  validateRequest(reviewModerationValidation.highlightReview),
  ReviewModerationController.highlightReview
);

// Bulk moderate multiple reviews
router.post(
  '/bulk/moderate',
  validateRequest(reviewModerationValidation.bulkModerateReviews),
  ReviewModerationController.bulkModerateReviews
);

// Get course reviews for admin (including hidden/deleted)
router.get(
  '/courses/:courseId/reviews',
  validateRequest(reviewModerationValidation.getCourseReviewsForAdmin),
  ReviewModerationController.getCourseReviewsForAdmin
);

export default router;
