import { Router, Request, Response, NextFunction } from 'express';
import * as teacherDashboardController from '../controllers/teacher-dashboard.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/client/teacher-dashboard
 * @desc    Get teacher dashboard overview
 * @access  Teacher
 */
router.get('/', teacherDashboardController.getTeacherDashboard);

/**
 * @route   GET /api/client/teacher-dashboard/performance
 * @desc    Get teacher performance metrics
 * @access  Teacher
 */
router.get(
  '/performance',
  [
    query('period')
      .optional()
      .isIn(['monthly', 'quarterly', 'yearly'])
      .withMessage('Period must be monthly, quarterly, or yearly'),
    validateRequest
  ],
  teacherDashboardController.getPerformanceMetrics
);

/**
 * @route   GET /api/client/teacher-dashboard/feedback
 * @desc    Get teacher's student feedback
 * @access  Teacher
 */
router.get(
  '/feedback',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('courseId').optional().isMongoId().withMessage('Invalid course ID'),
    query('rating')
      .optional()
      .isIn(['positive', 'neutral', 'negative'])
      .withMessage('Rating filter must be positive, neutral, or negative'),
    validateRequest
  ],
  teacherDashboardController.getStudentFeedback
);

/**
 * @route   POST /api/client/teacher-dashboard/feedback/:ratingId/respond
 * @desc    Respond to student feedback
 * @access  Teacher
 */
router.post(
  '/feedback/:ratingId/respond',
  [
    param('ratingId').isString().withMessage('Rating ID is required'),
    body('responseText')
      .isString()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Response text must be between 10 and 2000 characters')
      .trim(),
    body('acknowledgedIssues')
      .optional()
      .isArray()
      .withMessage('Acknowledged issues must be an array'),
    body('acknowledgedIssues.*')
      .optional()
      .isString()
      .withMessage('Each acknowledged issue must be a string'),
    body('improvementCommitments')
      .optional()
      .isArray()
      .withMessage('Improvement commitments must be an array'),
    body('improvementCommitments.*')
      .optional()
      .isString()
      .withMessage('Each improvement commitment must be a string'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('Is public must be boolean'),
    validateRequest
  ],
  teacherDashboardController.respondToFeedback
);

/**
 * @route   GET /api/client/teacher-dashboard/goals
 * @desc    Get teacher's goals and action plans
 * @access  Teacher
 */
router.get('/goals', teacherDashboardController.getGoalsAndPlans);

/**
 * @route   PUT /api/client/teacher-dashboard/goals
 * @desc    Update teacher goals
 * @access  Teacher
 */
router.put(
  '/goals',
  [
    body('targetScore')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Target score must be between 0 and 100'),
    body('actionPlan')
      .optional()
      .isArray()
      .withMessage('Action plan must be an array'),
    body('actionPlan.*')
      .optional()
      .isString()
      .isLength({ min: 5, max: 200 })
      .withMessage('Each action plan item must be 5-200 characters'),
    body('personalNotes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Personal notes must be max 1000 characters'),
    validateRequest
  ],
  teacherDashboardController.updateGoals
);

/**
 * @route   GET /api/client/teacher-dashboard/analytics
 * @desc    Get teacher analytics data
 * @access  Teacher
 */
router.get(
  '/analytics',
  (req: Request, res: Response, next: NextFunction) => {
    return teacherDashboardController.getAnalytics(req, res, next);
  }
);

/**
 * @route   GET /api/client/teacher-dashboard/peer-comparison
 * @desc    Get teacher comparison with peers
 * @access  Teacher
 */
router.get('/peer-comparison', teacherDashboardController.getPeerComparison);

export default router;
