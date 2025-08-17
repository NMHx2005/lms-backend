import { body, query, param } from 'express-validator';
import { commonValidations, customValidations } from './common.validator';
import { VALIDATION_CONSTANTS } from './constants';

export const courseValidation = {
  // Create course validation
  createCourse: [
    body('title').notEmpty().withMessage('Title is required'),
    commonValidations.name('title'),
    body('description').notEmpty().withMessage('Description is required'),
    commonValidations.description('description'),
    body('domain').notEmpty().withMessage('Domain is required').isLength({ min: 2, max: 100 }).trim().escape(),
    body('level').notEmpty().withMessage('Level is required').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('duration').notEmpty().withMessage('Duration is required'),
    commonValidations.duration('duration'),
    body('price').notEmpty().withMessage('Price is required'),
    commonValidations.price('price'),
    body('instructorId').notEmpty().withMessage('Instructor ID is required'),
    commonValidations.mongoId('instructorId'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('requirements').optional().isArray().withMessage('Requirements must be an array'),
    body('learningOutcomes').optional().isArray().withMessage('Learning outcomes must be an array'),
    body('thumbnail').optional().isURL().withMessage('Thumbnail must be a valid URL'),
    body('status').optional().isIn(VALIDATION_CONSTANTS.COURSE_STATUSES.ALL),
  ],

  // Update course validation
  updateCourse: [
    commonValidations.name('title').optional(),
    commonValidations.description('description').optional(),
    body('domain').optional().isLength({ min: 2, max: 100 }).trim().escape(),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    commonValidations.duration('duration').optional(),
    commonValidations.price('price').optional(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('requirements').optional().isArray().withMessage('Requirements must be an array'),
    body('learningOutcomes').optional().isArray().withMessage('Learning outcomes must be an array'),
    body('thumbnail').optional().isURL().withMessage('Thumbnail must be a valid URL'),
    body('status').optional().isIn(VALIDATION_CONSTANTS.COURSE_STATUSES.ALL),
  ],

  // Course ID validation
  courseId: [
    commonValidations.mongoId('courseId'),
  ],

  // Query parameters validation
  queryParams: [
    ...commonValidations.pagination(),
    commonValidations.search('search'),
    query('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    query('status').optional().isIn(VALIDATION_CONSTANTS.COURSE_STATUSES.ALL),
    query('domain').optional().isLength({ min: 2, max: 100 }).trim().escape(),
    query('instructorId').optional().isMongoId(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('minDuration').optional().isInt({ min: 1 }),
    query('maxDuration').optional().isInt({ min: 1 }),
    query('sortBy').optional().isIn(['title', 'price', 'duration', 'rating', 'createdAt', 'updatedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],

  // Course enrollment validation
  enrollCourse: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('paymentMethod').optional().isIn(['credit_card', 'paypal', 'bank_transfer']),
    body('couponCode').optional().isLength({ min: 3, max: 20 }).trim(),
  ],

  // Course review validation
  createReview: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('rating').notEmpty().withMessage('Rating is required'),
    commonValidations.rating('rating'),
    body('comment').notEmpty().withMessage('Comment is required'),
    body('comment').isLength({ min: 10, max: 1000 }).trim().escape(),
  ],

  // Course progress validation
  updateProgress: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('lessonId').notEmpty().withMessage('Lesson ID is required'),
    commonValidations.mongoId('lessonId'),
    body('progress').notEmpty().withMessage('Progress is required'),
    commonValidations.percentage('progress'),
    body('timeSpent').optional().isInt({ min: 0 }),
    body('completed').optional().isBoolean(),
  ],
};
