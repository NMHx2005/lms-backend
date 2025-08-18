import { body, param, query, check } from 'express-validator';

export const adminAssignmentValidation = {
  // Assignment ID validation
  assignmentId: [
    param('id').notEmpty().withMessage('Assignment ID is required')
  ],

  // Lesson ID validation
  lessonId: [
    param('lessonId').notEmpty().withMessage('Lesson ID is required')
  ],

  // Course ID validation
  courseId: [
    param('courseId').notEmpty().withMessage('Course ID is required')
  ],

  // Create assignment validation
  createAssignment: [
    body('lessonId').notEmpty().withMessage('Lesson ID is required'),
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('title').notEmpty().trim().withMessage('Title is required')
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().trim().isString().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('instructions').optional().trim().isString().isLength({ max: 2000 }).withMessage('Instructions must not exceed 2000 characters'),
    body('type').isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO date'),
    body('maxScore').optional().isInt({ min: 1, max: 1000 }).withMessage('Max score must be between 1 and 1000'),
    body('timeLimit').optional().isInt({ min: 1, max: 1440 }).withMessage('Time limit must be between 1 and 1440 minutes'),
    body('attempts').optional().isInt({ min: 1, max: 10 }).withMessage('Attempts must be between 1 and 10'),
    body('isRequired').optional().isBoolean().withMessage('Is required must be a boolean'),
    body('isGraded').optional().isBoolean().withMessage('Is graded must be a boolean'),
    body('importantNotes').optional().trim().isString().isLength({ max: 500 }).withMessage('Important notes must not exceed 500 characters')
  ],

  // Update assignment validation
  updateAssignment: [
    param('id').notEmpty().withMessage('Assignment ID is required'),
    body('title').optional().trim().isString().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().trim().isString().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('instructions').optional().trim().isString().isLength({ max: 2000 }).withMessage('Instructions must not exceed 2000 characters'),
    body('type').optional().isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO date'),
    body('maxScore').optional().isInt({ min: 1, max: 1000 }).withMessage('Max score must be between 1 and 1000'),
    body('timeLimit').optional().isInt({ min: 1, max: 1440 }).withMessage('Time limit must be between 1 and 1440 minutes'),
    body('attempts').optional().isInt({ min: 1, max: 10 }).withMessage('Attempts must be between 1 and 10'),
    body('isRequired').optional().isBoolean().withMessage('Is required must be a boolean'),
    body('isGraded').optional().isBoolean().withMessage('Is graded must be a boolean'),
    body('importantNotes').optional().trim().isString().isLength({ max: 500 }).withMessage('Important notes must not exceed 500 characters')
  ],

  // Get assignments by lesson validation
  getAssignmentsByLesson: [
    param('lessonId').notEmpty().withMessage('Lesson ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text'),
    query('isRequired').optional().isBoolean().withMessage('Is required must be a boolean')
  ],

  // Get assignments by course validation
  getAssignmentsByCourse: [
    param('courseId').notEmpty().withMessage('Course ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text'),
    query('isRequired').optional().isBoolean().withMessage('Is required must be a boolean'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
  ],

  // Toggle assignment required validation
  toggleAssignmentRequired: [
    param('id').notEmpty().withMessage('Assignment ID is required'),
    body('isRequired').isBoolean().withMessage('Is required must be a boolean')
  ],

  // Get overdue assignments validation
  getOverdueAssignments: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided')
  ],

  // Bulk update assignments validation
  bulkUpdateAssignments: [
    param('courseId').notEmpty().withMessage('Course ID is required'),
    body('updates').isArray({ min: 1 }).withMessage('Updates must be a non-empty array'),
    body('updates.*.assignmentId').notEmpty().withMessage('Assignment ID is required for each update'),
    body('updates.*.updates').isObject().withMessage('Updates object is required for each assignment')
  ],

  // Add attachment validation
  addAttachment: [
    param('id').notEmpty().withMessage('Assignment ID is required'),
    body('fileName').notEmpty().trim().withMessage('File name is required'),
    body('fileUrl').notEmpty().trim().withMessage('File URL is required'),
    body('fileSize').optional().isInt({ min: 1 }).withMessage('File size must be a positive integer'),
    body('fileType').optional().trim().isString().withMessage('File type must be a string'),
    body('description').optional().trim().isString().isLength({ max: 200 }).withMessage('Description must not exceed 200 characters')
  ],

  // Remove attachment validation
  removeAttachment: [
    param('id').notEmpty().withMessage('Assignment ID is required'),
    param('attachmentIndex').isInt({ min: 0 }).withMessage('Attachment index must be a non-negative integer')
  ],

  // Search assignments validation
  searchAssignments: [
    query('query').notEmpty().trim().withMessage('Search query is required')
      .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided'),
    query('lessonId').optional().notEmpty().withMessage('Lesson ID must not be empty if provided'),
    query('type').optional().isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text'),
    query('isRequired').optional().isBoolean().withMessage('Is required must be a boolean')
  ],

  // Query parameters validation
  queryParams: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['title', 'createdAt', 'dueDate', 'maxScore']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('type').optional().isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text'),
    query('isRequired').optional().isBoolean().withMessage('Is required must be a boolean'),
    query('isGraded').optional().isBoolean().withMessage('Is graded must be a boolean'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
  ]
};