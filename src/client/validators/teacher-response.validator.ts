import * as ev from 'express-validator';
const { body, param, query } = ev;

export const teacherResponseValidation = {
  // Add teacher response
  addResponse: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Response content must be between 10 and 1000 characters')
  ],

  // Update teacher response
  updateResponse: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Response content must be between 10 and 1000 characters')
  ],

  // Delete teacher response
  deleteResponse: [
    param('reviewId')
      .isMongoId()
      .withMessage('Valid review ID is required')
  ],

  // Get my courses reviews
  getMyCoursesReviews: [
    query('courseId')
      .optional()
      .isMongoId()
      .withMessage('Course ID must be valid if provided'),
    query('hasResponse')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('hasResponse must be true or false'),
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating filter must be between 1 and 5'),
    query('sortBy')
      .optional()
      .isIn(['newest', 'oldest', 'rating_high', 'rating_low', 'most_helpful'])
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

  // Get response statistics (no validation needed - uses authenticated user)
  getResponseStatistics: [],

  // Get pending responses
  getPendingResponses: [
    query('courseId')
      .optional()
      .isMongoId()
      .withMessage('Course ID must be valid if provided'),
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating filter must be between 1 and 5'),
    query('sortBy')
      .optional()
      .isIn(['oldest', 'newest', 'rating_low', 'rating_high'])
      .withMessage('Invalid sort option'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};
