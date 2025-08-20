import * as ev from 'express-validator';
const { body, param, query } = ev;

export const adminAIEvaluationValidation = {
  // Get pending evaluations
  getPendingEvaluations: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Get evaluation by ID
  getEvaluationById: [
    param('id')
      .isMongoId()
      .withMessage('Valid evaluation ID is required')
  ],

  // Submit admin review
  submitAdminReview: [
    param('id')
      .isMongoId()
      .withMessage('Valid evaluation ID is required'),
    body('decision')
      .isIn(['approved', 'rejected', 'needs_revision'])
      .withMessage('Decision must be approved, rejected, or needs_revision'),
    body('adminScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Admin score must be between 0 and 100'),
    body('adminFeedback')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Admin feedback must be between 10 and 1000 characters'),
    body('adminComments')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Admin comments cannot exceed 2000 characters'),
    body('revisionRequested')
      .optional()
      .isObject()
      .withMessage('Revision requested must be an object'),
    body('revisionRequested.sections')
      .optional()
      .isArray()
      .withMessage('Revision sections must be an array'),
    body('revisionRequested.sections.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Each revision section must be between 1 and 200 characters'),
    body('revisionRequested.details')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Revision details must be between 10 and 1000 characters'),
    body('revisionRequested.deadline')
      .optional()
      .isISO8601()
      .withMessage('Revision deadline must be a valid date')
      .custom((value) => {
        const deadline = new Date(value);
        const now = new Date();
        if (deadline <= now) {
          throw new Error('Revision deadline must be in the future');
        }
        return true;
      })
  ],

  // Get all evaluations with filtering
  getAllEvaluations: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['processing', 'ai_completed', 'admin_review', 'completed', 'failed'])
      .withMessage('Invalid status filter'),
    query('decision')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'needs_revision'])
      .withMessage('Invalid decision filter'),
    query('teacher')
      .optional()
      .isMongoId()
      .withMessage('Teacher filter must be a valid MongoDB ID'),
    query('sortBy')
      .optional()
      .isIn(['submittedAt', 'overallScore', 'decision', 'createdAt'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],

  // Bulk approve evaluations
  bulkApproveEvaluations: [
    body('evaluationIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('Evaluation IDs must be an array with 1-50 items'),
    body('evaluationIds.*')
      .isMongoId()
      .withMessage('Each evaluation ID must be a valid MongoDB ID')
  ],

  // Get course evaluation history
  getCourseEvaluationHistory: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required')
  ],

  // Retry AI evaluation
  retryAIEvaluation: [
    param('id')
      .isMongoId()
      .withMessage('Valid evaluation ID is required')
  ],

  // Export evaluations
  exportEvaluations: [
    query('status')
      .optional()
      .isIn(['processing', 'ai_completed', 'admin_review', 'completed', 'failed'])
      .withMessage('Invalid status filter'),
    query('decision')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'needs_revision'])
      .withMessage('Invalid decision filter'),
    query('teacher')
      .optional()
      .isMongoId()
      .withMessage('Teacher filter must be a valid MongoDB ID'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Date from must be a valid ISO date'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Date to must be a valid ISO date')
      .custom((value, { req }) => {
        if (req.query?.dateFrom && new Date(value) <= new Date(req.query.dateFrom as string)) {
          throw new Error('Date to must be after date from');
        }
        return true;
      })
  ]
};
