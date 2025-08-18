import { body, param, query } from 'express-validator';

export const adminSubmissionValidation = {
  // Submission ID validation
  submissionId: [
    param('id').notEmpty().withMessage('Submission ID is required')
  ],

  // Assignment ID validation
  assignmentId: [
    param('assignmentId').notEmpty().withMessage('Assignment ID is required')
  ],

  // Course ID validation
  courseId: [
    param('courseId').notEmpty().withMessage('Course ID is required')
  ],

  // Update submission validation
  updateSubmission: [
    param('id').notEmpty().withMessage('Submission ID is required'),
    body('score').optional().isInt({ min: 0, max: 1000 }).withMessage('Score must be between 0 and 1000'),
    body('feedback').optional().trim()
      .isLength({ max: 1000 }).withMessage('Feedback must not exceed 1000 characters'),
    body('status').optional().isIn(['submitted', 'graded', 'late', 'overdue']).withMessage('Invalid status'),
    body('isLate').optional().isBoolean().withMessage('Is late must be a boolean'),
    body('attemptNumber').optional().isInt({ min: 1, max: 10 }).withMessage('Attempt number must be between 1 and 10')
  ],

  // Get submissions by assignment validation
  getSubmissionsByAssignment: [
    param('assignmentId').notEmpty().withMessage('Assignment ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['submitted', 'graded', 'late', 'overdue']).withMessage('Invalid status'),
    query('isLate').optional().isBoolean().withMessage('Is late must be a boolean')
  ],

  // Get submissions by course validation
  getSubmissionsByCourse: [
    param('courseId').notEmpty().withMessage('Course ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['submitted', 'graded', 'late', 'overdue']).withMessage('Invalid status'),
    query('isLate').optional().isBoolean().withMessage('Is late must be a boolean'),
    query('assignmentId').optional().notEmpty().withMessage('Assignment ID must not be empty if provided')
  ],

  // Get pending submissions validation
  getPendingSubmissions: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided'),
    query('assignmentId').optional().notEmpty().withMessage('Assignment ID must not be empty if provided')
  ],

  // Get late submissions validation
  getLateSubmissions: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided'),
    query('assignmentId').optional().notEmpty().withMessage('Assignment ID must not be empty if provided')
  ],

  // Grade submission validation
  gradeSubmission: [
    param('id').notEmpty().withMessage('Submission ID is required'),
    body('score').isInt({ min: 0, max: 1000 }).withMessage('Score must be between 0 and 1000'),
    body('feedback').notEmpty().trim().withMessage('Feedback is required')
      .isLength({ max: 1000 }).withMessage('Feedback must not exceed 1000 characters'),
    body('gradedBy').notEmpty().withMessage('Grader ID is required')
  ],

  // Bulk grade submissions validation
  bulkGradeSubmissions: [
    body('gradingData').isArray({ min: 1 }).withMessage('Grading data must be a non-empty array'),
    body('gradingData.*.submissionId').notEmpty().withMessage('Submission ID is required for each grade'),
    body('gradingData.*.score').isInt({ min: 0, max: 1000 }).withMessage('Score must be between 0 and 1000 for each submission'),
    body('gradingData.*.feedback').notEmpty().trim().withMessage('Feedback is required for each submission')
      .isLength({ max: 1000 }).withMessage('Feedback must not exceed 1000 characters for each submission'),
    body('gradingData.*.gradedBy').notEmpty().withMessage('Grader ID is required for each submission')
  ],

  // Get submission stats validation
  getSubmissionStats: [
    query('assignmentId').optional().notEmpty().withMessage('Assignment ID must not be empty if provided'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided')
  ],

  // Get submission analytics validation
  getSubmissionAnalytics: [
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
  ],

  // Search submissions validation
  searchSubmissions: [
    query('query').notEmpty().trim().withMessage('Search query is required')
      .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('courseId').optional().notEmpty().withMessage('Course ID must not be empty if provided'),
    query('assignmentId').optional().notEmpty().withMessage('Assignment ID must not be empty if provided'),
    query('studentId').optional().notEmpty().withMessage('Student ID must not be empty if provided'),
    query('status').optional().isIn(['submitted', 'graded', 'late', 'overdue']).withMessage('Invalid status')
  ],

  // Query parameters validation
  queryParams: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['submittedAt', 'gradedAt', 'score', 'status']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('status').optional().isIn(['submitted', 'graded', 'late', 'overdue']).withMessage('Invalid status'),
    query('isLate').optional().isBoolean().withMessage('Is late must be a boolean'),
    query('includeFeedback').optional().isBoolean().withMessage('Include feedback must be a boolean'),
    query('includeScore').optional().isBoolean().withMessage('Include score must be a boolean')
  ]
};
