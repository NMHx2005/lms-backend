import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const adminCourseValidation = {
  // Create course validation
  createCourse: [
    body('title').notEmpty().withMessage('Title is required'),
    commonValidations.name('title'),
    body('description').notEmpty().withMessage('Description is required'),
    commonValidations.description('description'),
    body('domain').notEmpty().withMessage('Domain is required'),
    body('domain').isLength({ min: 2, max: 100 }).trim().escape(),
    body('level').notEmpty().withMessage('Level is required'),
    body('level').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
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
    body('title').optional(),
    commonValidations.name('title'),
    body('description').optional(),
    commonValidations.description('description'),
    body('domain').optional(),
    body('domain').isLength({ min: 2, max: 100 }).trim().escape(),
    body('level').optional(),
    body('level').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    body('duration').optional(),
    commonValidations.duration('duration'),
    body('price').optional(),
    commonValidations.price('price'),
    body('instructorId').optional(),
    commonValidations.mongoId('instructorId'),
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

  // Bulk operations
  bulkUpdateStatus: [
    body('courseIds').notEmpty().withMessage('Course IDs are required'),
    body('courseIds').isArray().withMessage('Course IDs must be an array'),
    body('courseIds.*').isMongoId().withMessage('Each course ID must be a valid MongoDB ObjectId'),
    body('status').notEmpty().withMessage('Status is required'),
    body('status').isIn(VALIDATION_CONSTANTS.COURSE_STATUSES.ALL),
  ],

  bulkDelete: [
    body('courseIds').notEmpty().withMessage('Course IDs are required'),
    body('courseIds').isArray().withMessage('Course IDs must be an array'),
    body('courseIds.*').isMongoId().withMessage('Each course ID must be a valid MongoDB ObjectId'),
    body('forceDelete').optional().isBoolean().withMessage('Force delete must be a boolean'),
  ],

  // Course content validation
  addLesson: [
    body('title').notEmpty().withMessage('Lesson title is required'),
    commonValidations.name('title'),
    body('description').optional(),
    commonValidations.description('description'),
    body('duration').notEmpty().withMessage('Lesson duration is required'),
    commonValidations.duration('duration'),
    body('order').notEmpty().withMessage('Lesson order is required'),
    body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
    body('type').notEmpty().withMessage('Lesson type is required'),
    body('type').isIn(['video', 'text', 'quiz', 'assignment']),
    body('content').optional(),
    body('content').isLength({ max: 10000 }).withMessage('Content must be less than 10000 characters'),
  ],

  updateLesson: [
    body('title').optional(),
    commonValidations.name('title'),
    body('description').optional(),
    commonValidations.description('description'),
    body('duration').optional(),
    commonValidations.duration('duration'),
    body('order').optional(),
    body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
    body('type').optional(),
    body('type').isIn(['video', 'text', 'quiz', 'assignment']),
    body('content').optional(),
    body('content').isLength({ max: 10000 }).withMessage('Content must be less than 10000 characters'),
  ],

  // Course analytics validation
  analyticsQuery: [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('instructorId').optional().isMongoId(),
    query('category').optional().isLength({ min: 2, max: 50 }),
  ],
};
