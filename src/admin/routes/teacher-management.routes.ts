import { Router } from 'express';
import * as teacherManagementController from '../controllers/teacher-management.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/teacher-management
 * @desc    Get all teachers with scores and performance metrics
 * @access  Admin
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim().withMessage('Search must be a string'),
    query('sortBy').optional().isIn(['overallScore', 'name', 'coursesCount']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
    query('minScore').optional().isInt({ min: 0, max: 100 }).withMessage('Min score must be 0-100'),
    query('maxScore').optional().isInt({ min: 0, max: 100 }).withMessage('Max score must be 0-100'),
    validateRequest
  ],
  teacherManagementController.getAllTeachers
);

/**
 * @route   GET /api/admin/teacher-management/statistics
 * @desc    Get teacher performance statistics
 * @access  Admin
 */
router.get(
  '/statistics',
  [
    query('period').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period'),
    validateRequest
  ],
  teacherManagementController.getTeacherStatistics
);

/**
 * @route   GET /api/admin/teacher-management/leaderboard
 * @desc    Get teacher leaderboard
 * @access  Admin
 */
router.get(
  '/leaderboard',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('periodType').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period type'),
    validateRequest
  ],
  teacherManagementController.getTeacherLeaderboard
);

/**
 * @route   GET /api/admin/teacher-management/export
 * @desc    Export teacher performance report
 * @access  Admin
 */
router.get(
  '/export',
  [
    query('format').optional().isIn(['csv', 'json']).withMessage('Format must be csv or json'),
    query('periodType').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid period type'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validateRequest
  ],
  teacherManagementController.exportTeacherReport
);

/**
 * @route   GET /api/admin/teacher-management/:teacherId
 * @desc    Get teacher detail with complete performance data
 * @access  Admin
 */
router.get(
  '/:teacherId',
  [
    param('teacherId').isMongoId().withMessage('Invalid teacher ID'),
    validateRequest
  ],
  teacherManagementController.getTeacherDetail
);

/**
 * @route   GET /api/admin/teacher-management/:teacherId/trends
 * @desc    Get teacher performance trends
 * @access  Admin
 */
router.get(
  '/:teacherId/trends',
  [
    param('teacherId').isMongoId().withMessage('Invalid teacher ID'),
    query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24'),
    validateRequest
  ],
  teacherManagementController.getTeacherTrends
);

/**
 * @route   POST /api/admin/teacher-management/:teacherId/generate-score
 * @desc    Generate teacher score manually
 * @access  Admin
 */
router.post(
  '/:teacherId/generate-score',
  [
    param('teacherId').isMongoId().withMessage('Invalid teacher ID'),
    body('periodType')
      .optional()
      .isIn(['monthly', 'quarterly', 'yearly'])
      .withMessage('Period type must be monthly, quarterly, or yearly'),
    validateRequest
  ],
  teacherManagementController.generateTeacherScore
);

/**
 * @route   POST /api/admin/teacher-management/bulk/generate-scores
 * @desc    Bulk generate scores for teachers
 * @access  Admin
 */
router.post(
  '/bulk/generate-scores',
  [
    body('periodType')
      .optional()
      .isIn(['monthly', 'quarterly', 'yearly'])
      .withMessage('Period type must be monthly, quarterly, or yearly'),
    body('teacherIds')
      .optional()
      .isArray()
      .withMessage('Teacher IDs must be an array'),
    body('teacherIds.*')
      .optional()
      .isMongoId()
      .withMessage('Each teacher ID must be valid'),
    validateRequest
  ],
  teacherManagementController.bulkGenerateScores
);

/**
 * @route   PUT /api/admin/teacher-management/scores/:scoreId
 * @desc    Update teacher score status or review
 * @access  Admin
 */
router.put(
  '/scores/:scoreId',
  [
    param('scoreId').isString().withMessage('Score ID is required'),
    body('status')
      .optional()
      .isIn(['active', 'under_review', 'final', 'archived'])
      .withMessage('Invalid status'),
    body('reviewNotes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Review notes must be max 1000 characters'),
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
      .withMessage('Each action plan item must be a string'),
    validateRequest
  ],
  teacherManagementController.updateTeacherScore
);

export default router;
