import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const clientLessonValidation = {
  // Get lesson by ID validation
  getLessonById: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('includeAttachments')
      .optional()
      .isBoolean()
      .withMessage('Include attachments must be a boolean'),
    query('includeProgress')
      .optional()
      .isBoolean()
      .withMessage('Include progress must be a boolean'),
    query('includeNavigation')
      .optional()
      .isBoolean()
      .withMessage('Include navigation must be a boolean'),
  ],

  // Get lessons by section validation
  getLessonsBySection: [
    param('sectionId')
      .notEmpty()
      .withMessage('Section ID is required')
      .isMongoId()
      .withMessage('Section ID must be a valid MongoDB ObjectId'),
    query('includeAttachments')
      .optional()
      .isBoolean()
      .withMessage('Include attachments must be a boolean'),
    query('includeProgress')
      .optional()
      .isBoolean()
      .withMessage('Include progress must be a boolean'),
    query('sortBy')
      .optional()
      .isIn(['order', 'title', 'createdAt', 'estimatedTime'])
      .withMessage('Sort by must be one of: order, title, createdAt, estimatedTime'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
    query('type')
      .optional()
      .isIn(['video', 'text', 'file', 'link'])
      .withMessage('Type must be one of: video, text, file, link'),
    query('isRequired')
      .optional()
      .isBoolean()
      .withMessage('Is required must be a boolean'),
    query('isPreview')
      .optional()
      .isBoolean()
      .withMessage('Is preview must be a boolean'),
  ],

  // Get lesson content validation
  getLessonContent: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('includeAttachments')
      .optional()
      .isBoolean()
      .withMessage('Include attachments must be a boolean'),
    query('includeMetadata')
      .optional()
      .isBoolean()
      .withMessage('Include metadata must be a boolean'),
  ],

  // Get lesson progress validation
  getLessonProgress: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('detailed')
      .optional()
      .isBoolean()
      .withMessage('Detailed must be a boolean'),
    query('includeTimeSpent')
      .optional()
      .isBoolean()
      .withMessage('Include time spent must be a boolean'),
  ],

  // Get next lesson validation
  getNextLesson: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('includeContent')
      .optional()
      .isBoolean()
      .withMessage('Include content must be a boolean'),
    query('includeNavigation')
      .optional()
      .isBoolean()
      .withMessage('Include navigation must be a boolean'),
  ],

  // Get previous lesson validation
  getPreviousLesson: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('includeContent')
      .optional()
      .isBoolean()
      .withMessage('Include content must be a boolean'),
    query('includeNavigation')
      .optional()
      .isBoolean()
      .withMessage('Include navigation must be a boolean'),
  ],

  // Mark lesson as completed validation
  markLessonCompleted: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    body('timeSpent')
      .optional()
      .isInt({ min: 0, max: VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX })
      .withMessage(`Time spent must be between 0 and ${VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX} minutes`),
    body('completionDate')
      .optional()
      .isISO8601()
      .withMessage('Completion date must be in ISO 8601 format'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('feedback')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Feedback must be less than 500 characters'),
  ],
  // Track time spent on lesson
  addTime: [
    param('id').notEmpty().withMessage('Lesson ID is required').isMongoId().withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    body('seconds').notEmpty().withMessage('seconds is required').isInt({ min: 1, max: 86400 }).withMessage('seconds must be between 1 and 86400')
  ],

  // Get lesson attachments validation
  getLessonAttachments: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('type')
      .optional()
      .isIn(['all', 'document', 'image', 'video', 'audio'])
      .withMessage('Type must be one of: all, document, image, video, audio'),
    query('includeMetadata')
      .optional()
      .isBoolean()
      .withMessage('Include metadata must be a boolean'),
  ],

  // Get lesson navigation validation
  getLessonNavigation: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('includeContent')
      .optional()
      .isBoolean()
      .withMessage('Include content must be a boolean'),
    query('includeProgress')
      .optional()
      .isBoolean()
      .withMessage('Include progress must be a boolean'),
  ],

  // Get lesson summary validation
  getLessonSummary: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    query('includeProgress')
      .optional()
      .isBoolean()
      .withMessage('Include progress must be a boolean'),
    query('includeStats')
      .optional()
      .isBoolean()
      .withMessage('Include stats must be a boolean'),
  ],

  // Common query parameters validation
  queryParams: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT })
      .withMessage(`Limit must be between 1 and ${VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT}`),
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('type')
      .optional()
      .isIn(['video', 'text', 'file', 'link'])
      .withMessage('Type must be one of: video, text, file, link'),
    query('isRequired')
      .optional()
      .isBoolean()
      .withMessage('Is required must be a boolean'),
    query('isPreview')
      .optional()
      .isBoolean()
      .withMessage('Is preview must be a boolean'),
    query('estimatedTimeMin')
      .optional()
      .isInt({ min: 1, max: VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX })
      .withMessage(`Estimated time min must be between 1 and ${VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX} minutes`),
    query('estimatedTimeMax')
      .optional()
      .isInt({ min: 1, max: VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX })
      .withMessage(`Estimated time max must be between 1 and ${VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX} minutes`),
  ],

  // Lesson ID parameter validation (reusable)
  lessonId: [
    param('id')
      .notEmpty()
      .withMessage('Lesson ID is required')
      .isMongoId()
      .withMessage('Lesson ID must be a valid MongoDB ObjectId'),
  ],

  // Section ID parameter validation (reusable)
  sectionId: [
    param('sectionId')
      .notEmpty()
      .withMessage('Section ID is required')
      .isMongoId()
      .withMessage('Section ID must be a valid MongoDB ObjectId'),
  ],
};
