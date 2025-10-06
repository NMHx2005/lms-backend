import { body, query, param } from 'express-validator';

export const billsValidation = {
    queryParams: [
        query('search').optional().isLength({ min: 1, max: 100 }).trim().escape(),
        query('status').optional().isIn(['all', 'pending', 'paid', 'failed', 'refunded', 'cancelled']),
        query('paymentMethod').optional().isIn(['all', 'vnpay', 'stripe', 'paypal', 'bank_transfer', 'cash']),
        query('dateRange').optional().isIn(['all', 'today', 'week', 'month']),
        query('sortBy').optional().isIn(['createdAt', 'paidAt', 'amount', 'status', 'transactionId']),
        query('sortOrder').optional().isIn(['asc', 'desc']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],

    getBill: [
        param('id').isMongoId().withMessage('Invalid bill ID')
    ],

    createBill: [
        body('studentId').isMongoId().withMessage('Invalid student ID'),
        body('courseId').optional().isMongoId().withMessage('Invalid course ID'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('currency').optional().isIn(['VND', 'USD', 'EUR', 'JPY', 'KRW']).withMessage('Invalid currency'),
        body('purpose').isIn(['course_purchase', 'subscription', 'refund', 'other']).withMessage('Invalid purpose'),
        body('status').optional().isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Invalid status'),
        body('paymentMethod').isIn(['stripe', 'paypal', 'bank_transfer', 'cash', 'vnpay']).withMessage('Invalid payment method'),
        body('description').notEmpty().withMessage('Description is required')
    ],

    updateBill: [
        param('id').isMongoId().withMessage('Invalid bill ID'),
        body('status').optional().isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Invalid status'),
        body('paymentMethod').optional().isIn(['stripe', 'paypal', 'bank_transfer', 'cash', 'vnpay']).withMessage('Invalid payment method'),
        body('paidAt').optional().isISO8601().withMessage('Invalid payment date format'),
        body('amount').optional().isNumeric().withMessage('Amount must be a number'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty')
    ],

    deleteBill: [
        param('id').isMongoId().withMessage('Invalid bill ID')
    ]
};
