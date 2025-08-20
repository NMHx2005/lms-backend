import * as ev from 'express-validator';
const { param, query } = ev;

export const courseSubmissionValidation = {
  // Submit course for evaluation
  submitCourseForEvaluation: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required')
  ],

  // Get course submission status
  getCourseSubmissionStatus: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required')
  ],

  // Get my evaluations
  getMyEvaluations: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Get evaluation details
  getEvaluationDetails: [
    param('evaluationId')
      .isMongoId()
      .withMessage('Valid evaluation ID is required')
  ],

  // Get submittable courses (no validation needed - uses authenticated user)
  getSubmittableCourses: [],

  // Get courses needing revision (no validation needed - uses authenticated user)
  getCoursesNeedingRevision: [],

  // Get submission statistics (no validation needed - uses authenticated user)
  getSubmissionStatistics: [],

  // Resubmit course
  resubmitCourse: [
    param('courseId')
      .isMongoId()
      .withMessage('Valid course ID is required')
  ],

  // Get evaluation feedback
  getEvaluationFeedback: [
    param('evaluationId')
      .isMongoId()
      .withMessage('Valid evaluation ID is required')
  ]
};
