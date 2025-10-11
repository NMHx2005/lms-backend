import { Router } from 'express';
import EarningsController from '../controllers/earnings.controller';
import { authenticate, requireTeacher } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication and teacher role middleware to all routes
router.use(authenticate);
router.use(requireTeacher);

/**
 * @route   GET /api/client/earnings/overview
 * @desc    Get earnings overview
 * @access  Teacher
 */
router.get('/overview', EarningsController.getOverview);

/**
 * @route   GET /api/client/earnings/balance
 * @desc    Get current balance
 * @access  Teacher
 */
router.get('/balance', EarningsController.getBalance);

/**
 * @route   GET /api/client/earnings/history
 * @desc    Get earnings history with pagination
 * @access  Teacher
 */
router.get(
    '/history',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date'),
        query('courseId').optional().isMongoId().withMessage('Invalid course ID'),
        validateRequest
    ],
    EarningsController.getHistory
);

/**
 * @route   GET /api/client/earnings/pending
 * @desc    Get pending earnings
 * @access  Teacher
 */
router.get('/pending', EarningsController.getPendingEarnings);

/**
 * @route   POST /api/client/earnings/withdraw
 * @desc    Request withdrawal
 * @access  Teacher
 */
router.post(
    '/withdraw',
    [
        body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
        body('method').isIn(['bank_transfer', 'paypal', 'stripe']).withMessage('Invalid withdrawal method'),
        body('accountDetails').isObject().withMessage('Account details are required'),
        body('accountDetails.accountName').isString().trim().notEmpty().withMessage('Account name is required'),
        body('accountDetails.accountNumber').isString().trim().notEmpty().withMessage('Account number is required'),
        body('notes').optional().isString().trim().isLength({ max: 500 }),
        validateRequest
    ],
    EarningsController.requestWithdrawal
);

/**
 * @route   GET /api/client/earnings/withdrawals
 * @desc    Get withdrawal history
 * @access  Teacher
 */
router.get(
    '/withdrawals',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['pending', 'processing', 'completed', 'rejected']),
        validateRequest
    ],
    EarningsController.getWithdrawals
);

/**
 * @route   GET /api/client/earnings/withdrawals/:id
 * @desc    Get withdrawal details
 * @access  Teacher
 */
router.get(
    '/withdrawals/:id',
    [
        param('id').isMongoId().withMessage('Invalid withdrawal ID'),
        validateRequest
    ],
    EarningsController.getWithdrawalById
);

/**
 * @route   GET /api/client/earnings/stats
 * @desc    Get earnings statistics
 * @access  Teacher
 */
router.get(
    '/stats',
    [
        query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
        validateRequest
    ],
    EarningsController.getStats
);

/**
 * @route   GET /api/client/earnings/transactions
 * @desc    Get earnings transactions
 * @access  Teacher
 */
router.get(
    '/transactions',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('type').optional().isIn(['sale', 'refund', 'adjustment', 'withdrawal']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('courseId').optional().isMongoId(),
        query('status').optional().isIn(['pending', 'completed', 'failed']),
        validateRequest
    ],
    EarningsController.getTransactions
);

/**
 * @route   GET /api/client/earnings/analytics/overview
 * @desc    Get earnings analytics overview
 * @access  Teacher
 */
router.get('/analytics/overview', EarningsController.getAnalyticsOverview);

/**
 * @route   GET /api/client/earnings/analytics/trends
 * @desc    Get earnings trends
 * @access  Teacher
 */
router.get(
    '/analytics/trends',
    [
        query('period').optional().isIn(['7days', '30days', '90days', '1year']),
        validateRequest
    ],
    EarningsController.getTrends
);

/**
 * @route   GET /api/client/earnings/analytics/by-course
 * @desc    Get earnings by course
 * @access  Teacher
 */
router.get('/analytics/by-course', EarningsController.getEarningsByCourse);

/**
 * @route   GET /api/client/earnings/analytics/by-period
 * @desc    Get earnings by time period
 * @access  Teacher
 */
router.get(
    '/analytics/by-period',
    [
        query('groupBy').optional().isIn(['day', 'week', 'month', 'quarter', 'year']),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validateRequest
    ],
    EarningsController.getEarningsByPeriod
);

/**
 * @route   GET /api/client/earnings/analytics/forecast
 * @desc    Get earnings forecast
 * @access  Teacher
 */
router.get(
    '/analytics/forecast',
    [
        query('months').optional().isInt({ min: 1, max: 12 }),
        validateRequest
    ],
    EarningsController.getForecast
);

/**
 * @route   GET /api/client/earnings/analytics/comparison
 * @desc    Get earnings comparison
 * @access  Teacher
 */
router.get(
    '/analytics/comparison',
    [
        query('compareTo').optional().isIn(['previous_period', 'same_period_last_year']),
        validateRequest
    ],
    EarningsController.getComparison
);

/**
 * @route   GET /api/client/earnings/monthly-breakdown
 * @desc    Get monthly breakdown for chart
 * @access  Teacher
 */
router.get(
    '/monthly-breakdown',
    [
        query('months').optional().isInt({ min: 1, max: 12 }).withMessage('Months must be between 1 and 12'),
        validateRequest
    ],
    EarningsController.getMonthlyBreakdown
);

export default router;

