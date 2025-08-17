import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const clientCourseValidation = {
  // Course browsing and search
  courseQuery: [
    ...commonValidations.pagination(),
    commonValidations.search('search'),
    query('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    query('domain').optional().isLength({ min: 2, max: 100 }).trim().escape(),
    query('instructorId').optional().isMongoId(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('minDuration').optional().isInt({ min: 1 }),
    query('maxDuration').optional().isInt({ min: 1 }),
    query('rating').optional().isFloat({ min: 1, max: 5 }),
    query('sortBy').optional().isIn(['title', 'price', 'duration', 'rating', 'createdAt', 'popularity']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('free').optional().isBoolean().withMessage('Free must be a boolean'),
    query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  ],

  // Course enrollment
  enrollCourse: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('paymentMethod').optional().isIn(['credit_card', 'paypal', 'bank_transfer', 'wallet']),
    body('couponCode').optional().isLength({ min: 3, max: 20 }).trim(),
    body('installmentPlan').optional().isBoolean().withMessage('Installment plan must be a boolean'),
  ],

  // Course progress
  updateProgress: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('lessonId').notEmpty().withMessage('Lesson ID is required'),
    commonValidations.mongoId('lessonId'),
    body('progress').notEmpty().withMessage('Progress is required'),
    commonValidations.percentage('progress'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  ],

  // Course review
  createReview: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('rating').notEmpty().withMessage('Rating is required'),
    commonValidations.rating('rating'),
    body('comment').notEmpty().withMessage('Comment is required'),
    body('comment').isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
    body('anonymous').optional().isBoolean().withMessage('Anonymous must be a boolean'),
  ],

  updateReview: [
    body('rating').optional(),
    commonValidations.rating('rating'),
    body('comment').optional(),
    body('comment').isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
    body('anonymous').optional().isBoolean().withMessage('Anonymous must be a boolean'),
  ],

  // Course bookmark and wishlist
  toggleBookmark: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('action').notEmpty().withMessage('Action is required'),
    body('action').isIn(['add', 'remove']).withMessage('Action must be add or remove'),
  ],

  // Course notes
  saveNote: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('lessonId').optional(),
    commonValidations.mongoId('lessonId'),
    body('content').notEmpty().withMessage('Note content is required'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('Note content must be between 1 and 2000 characters'),
    body('timestamp').optional().isFloat({ min: 0 }).withMessage('Timestamp must be a positive number'),
    body('isPrivate').optional().isBoolean().withMessage('Is private must be a boolean'),
  ],

  updateNote: [
    body('content').notEmpty().withMessage('Note content is required'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('Note content must be between 1 and 2000 characters'),
    body('timestamp').optional().isFloat({ min: 0 }).withMessage('Timestamp must be a positive number'),
    body('isPrivate').optional().isBoolean().withMessage('Is private must be a boolean'),
  ],

  // Course discussion
  createDiscussion: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('title').notEmpty().withMessage('Discussion title is required'),
    body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('content').notEmpty().withMessage('Discussion content is required'),
    body('content').isLength({ min: 20, max: 2000 }).withMessage('Content must be between 20 and 2000 characters'),
    body('category').optional().isIn(['general', 'question', 'discussion', 'help']),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
  ],

  addDiscussionReply: [
    body('content').notEmpty().withMessage('Reply content is required'),
    body('content').isLength({ min: 10, max: 1000 }).withMessage('Reply content must be between 10 and 1000 characters'),
    body('parentId').optional().isMongoId().withMessage('Parent ID must be a valid MongoDB ObjectId'),
    body('isAnswer').optional().isBoolean().withMessage('Is answer must be a boolean'),
  ],

  // Course certificate
  requestCertificate: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('name').optional(),
    body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').optional(),
    commonValidations.email('email'),
    body('message').optional(),
    body('message').isLength({ max: 500 }).withMessage('Message must be less than 500 characters'),
  ],

  // Course feedback
  submitFeedback: [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    commonValidations.mongoId('courseId'),
    body('type').notEmpty().withMessage('Feedback type is required'),
    body('type').isIn(['bug', 'feature', 'improvement', 'other']).withMessage('Invalid feedback type'),
    body('title').notEmpty().withMessage('Feedback title is required'),
    body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description').notEmpty().withMessage('Feedback description is required'),
    body('description').isLength({ min: 20, max: 1000 }).withMessage('Description must be between 20 and 1000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('anonymous').optional().isBoolean().withMessage('Anonymous must be a boolean'),
  ],
};
