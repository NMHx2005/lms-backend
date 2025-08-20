import * as ev from 'express-validator';
const { body, param, query } = ev;

export const reviewModerationValidation = {
  // Get reviews needing moderation
  getReviewsNeedingModeration: [
    query('status')
      .optional()
      .isIn(['published', 'pending', 'hidden', 'deleted'])
      .withMessage('Invalid status filter'),
    query('reportCount')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Report count must be a positive integer'),
    query('courseId')
      .optional()
      .isMongoId()
      .withMessage('Course ID must be valid if provided'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['newest', 'most_reported', 'quality_score'])
      .withMessage('Invalid sort option')
  ],

  // Get review for moderation
  getReviewForModeration: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required')
  ],

  // Moderate review
  moderateReview: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required'),
    body('action')
      .isIn(['approved', 'hidden', 'deleted'])
      .withMessage('Action must be approved, hidden, or deleted'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Reason must be between 5 and 500 characters')
  ],

  // Bulk moderate reviews
  bulkModerateReviews: [
    body('reviewIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('Review IDs must be an array with 1-50 items'),
    body('reviewIds.*')
      .isMongoId()
      .withMessage('Each review ID must be valid'),
    body('action')
      .isIn(['approved', 'hidden', 'deleted'])
      .withMessage('Action must be approved, hidden, or deleted'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Reason must be between 5 and 500 characters')
  ],

  // Feature review
  featureReview: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required'),
    body('featured')
      .isBoolean()
      .withMessage('Featured must be a boolean')
  ],

  // Highlight review
  highlightReview: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required'),
    body('highlighted')
      .isBoolean()
      .withMessage('Highlighted must be a boolean')
  ],

  // Get moderation statistics (no validation needed)
  getModerationStatistics: [],

  // Get moderation history
  getModerationHistory: [
    query('adminId')
      .optional()
      .isMongoId()
      .withMessage('Admin ID must be valid if provided'),
    query('action')
      .optional()
      .isIn(['approved', 'hidden', 'deleted'])
      .withMessage('Invalid action filter'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Date from must be a valid ISO date'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Date to must be a valid ISO date')
      .custom((value, { req }) => {
        if (req.query?.dateFrom && new Date(value) <= new Date(req.query.dateFrom as string)) {
          throw new Error('Date to must be after date from');
        }
        return true;
      }),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Get course reviews for admin
  getCourseReviewsForAdmin: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required'),
    query('status')
      .optional()
      .isIn(['all', 'published', 'pending', 'hidden', 'deleted'])
      .withMessage('Invalid status filter'),
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating filter must be between 1 and 5'),
    query('sortBy')
      .optional()
      .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'most_reported'])
      .withMessage('Invalid sort option'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Export moderation data
  exportModerationData: [
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Date from must be a valid ISO date'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Date to must be a valid ISO date'),
    query('status')
      .optional()
      .isIn(['published', 'pending', 'hidden', 'deleted'])
      .withMessage('Invalid status filter'),
    query('action')
      .optional()
      .isIn(['approved', 'hidden', 'deleted'])
      .withMessage('Invalid action filter'),
    query('format')
      .optional()
      .isIn(['csv', 'xlsx', 'json'])
      .withMessage('Format must be csv, xlsx, or json')
  ],

  // Get review engagement analytics
  getReviewEngagementAnalytics: [
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Date from must be a valid ISO date'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Date to must be a valid ISO date'),
    query('courseId')
      .optional()
      .isMongoId()
      .withMessage('Course ID must be valid if provided')
  ]
};
