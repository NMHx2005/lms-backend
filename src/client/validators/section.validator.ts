import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const clientSectionValidation = {
  // Get sections by course validation
  getSectionsByCourse: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isMongoId()
      .withMessage('Course ID must be a valid MongoDB ObjectId'),
    query('includeLessons')
      .optional()
      .isBoolean()
      .withMessage('Include lessons must be a boolean'),
    query('includeProgress')
      .optional()
      .isBoolean()
      .withMessage('Include progress must be a boolean'),
    query('sortBy')
      .optional()
      .isIn(['order', 'title', 'createdAt'])
      .withMessage('Sort by must be one of: order, title, createdAt'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
  ],

  // Get section by ID validation
  getSectionById: [
    param('id')
      .notEmpty()
      .withMessage('Section ID is required')
      .isMongoId()
      .withMessage('Section ID must be a valid MongoDB ObjectId'),
    query('includeLessons')
      .optional()
      .isBoolean()
      .withMessage('Include lessons must be a boolean'),
    query('includeProgress')
      .optional()
      .isBoolean()
      .withMessage('Include progress must be a boolean'),
  ],

  // Get section progress validation
  getSectionProgress: [
    param('id')
      .notEmpty()
      .withMessage('Section ID is required')
      .isMongoId()
      .withMessage('Section ID must be a valid MongoDB ObjectId'),
    query('detailed')
      .optional()
      .isBoolean()
      .withMessage('Detailed must be a boolean'),
  ],

  // Get next section validation
  getNextSection: [
    param('id')
      .notEmpty()
      .withMessage('Section ID is required')
      .isMongoId()
      .withMessage('Section ID must be a valid MongoDB ObjectId'),
    query('includeLessons')
      .optional()
      .isBoolean()
      .withMessage('Include lessons must be a boolean'),
  ],

  // Get previous section validation
  getPreviousSection: [
    param('id')
      .notEmpty()
      .withMessage('Section ID is required')
      .isMongoId()
      .withMessage('Section ID must be a valid MongoDB ObjectId'),
    query('includeLessons')
      .optional()
      .isBoolean()
      .withMessage('Include lessons must be a boolean'),
  ],

  // Get section overview validation
  getSectionOverview: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isMongoId()
      .withMessage('Course ID must be a valid MongoDB ObjectId'),
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
    query('isVisible')
      .optional()
      .isBoolean()
      .withMessage('Is visible must be a boolean'),
    query('hasContent')
      .optional()
      .isBoolean()
      .withMessage('Has content must be a boolean'),
  ],

  // Section ID parameter validation (reusable)
  sectionId: [
    param('id')
      .notEmpty()
      .withMessage('Section ID is required')
      .isMongoId()
      .withMessage('Section ID must be a valid MongoDB ObjectId'),
  ],

  // Course ID parameter validation (reusable)
  courseId: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isMongoId()
      .withMessage('Course ID must be a valid MongoDB ObjectId'),
  ],
};
