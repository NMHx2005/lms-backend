import * as ev from 'express-validator';
const { body, param, query } = ev;

export const courseRatingValidation = {
  // Create review
  createReview: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title')
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Review title must be between 5 and 200 characters'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review content must be between 10 and 2000 characters'),
    body('pros')
      .optional()
      .isArray()
      .withMessage('Pros must be an array'),
    body('pros.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Each pro must be between 1 and 200 characters'),
    body('cons')
      .optional()
      .isArray()
      .withMessage('Cons must be an array'),
    body('cons.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Each con must be between 1 and 200 characters'),
    body('isAnonymous')
      .optional()
      .isBoolean()
      .withMessage('isAnonymous must be a boolean')
  ],

  // Update review
  updateReview: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Review title must be between 5 and 200 characters'),
    body('content')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Review content must be between 10 and 2000 characters'),
    body('pros')
      .optional()
      .isArray()
      .withMessage('Pros must be an array'),
    body('pros.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Each pro must be between 1 and 200 characters'),
    body('cons')
      .optional()
      .isArray()
      .withMessage('Cons must be an array'),
    body('cons.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Each con must be between 1 and 200 characters')
  ],

  // Delete review
  deleteReview: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required')
  ],

  // Get course reviews
  getCourseReviews: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required'),
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating filter must be between 1 and 5'),
    query('sortBy')
      .optional()
      .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful', 'quality'])
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

  // Get user review
  getUserReview: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required')
  ],

  // Get course summary
  getCourseSummary: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required')
  ],

  // Vote on review
  voteReview: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required')
  ],

  // Mark helpful
  markHelpful: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required')
  ],

  // Report review
  reportReview: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Report reason must be between 5 and 500 characters')
  ],

  // Get my reviews
  getMyReviews: [
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
      .isIn(['newest', 'oldest', 'rating_high', 'rating_low'])
      .withMessage('Invalid sort option')
  ]
};
