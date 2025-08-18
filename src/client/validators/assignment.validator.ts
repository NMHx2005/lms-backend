import { body, param, query } from 'express-validator';

export const clientAssignmentValidation = {
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
    query('isRequired').optional().isBoolean().withMessage('Is required must be a boolean')
  ],

  // Get assignment progress validation
  getAssignmentProgress: [
    param('assignmentId').notEmpty().withMessage('Assignment ID is required')
  ],

  // Submit assignment validation
  submitAssignment: [
    body('assignmentId').notEmpty().withMessage('Assignment ID is required'),
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('answers').optional().isArray().withMessage('Answers must be an array'),
    body('fileUrl').optional().trim().isString().withMessage('File URL must be a string'),
    body('fileSize').optional().isInt({ min: 1 }).withMessage('File size must be a positive integer'),
    body('fileType').optional().trim().isString().withMessage('File type must be a string'),
    body('textAnswer').optional().trim()
      .isLength({ max: 5000 }).withMessage('Text answer must not exceed 5000 characters')
  ],

  // Get student submissions validation
  getStudentSubmissions: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided'),
    query('assignmentId').optional().notEmpty().withMessage('Assignment ID must not be empty if provided'),
    query('status').optional().isIn(['submitted', 'graded', 'late', 'overdue']).withMessage('Invalid status')
  ],

  // Get submission by ID validation
  getSubmissionById: [
    param('id').notEmpty().withMessage('Submission ID is required')
  ],

  // Get upcoming assignments validation
  getUpcomingAssignments: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided')
  ],

  // Search assignments validation
  searchAssignments: [
    query('query').notEmpty().trim().withMessage('Search query is required')
      .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided'),
    query('type').optional().isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text')
  ],

  // Get student assignment stats validation
  getStudentAssignmentStats: [
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided')
  ],

  // Query parameters validation
  queryParams: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['title', 'dueDate', 'createdAt']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('type').optional().isIn(['file', 'quiz', 'text']).withMessage('Type must be file, quiz, or text'),
    query('isRequired').optional().isBoolean().withMessage('Is required must be a boolean'),
    query('includeProgress').optional().isBoolean().withMessage('Include progress must be a boolean'),
    query('includeSubmissions').optional().isBoolean().withMessage('Include submissions must be a boolean')
  ]
};
