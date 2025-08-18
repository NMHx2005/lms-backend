import { body } from 'express-validator';

export const paymentsValidation = {
  createVnpay: [
    body('orderId').notEmpty().withMessage('orderId is required'),
    body('amount').isInt({ min: 1000 }).withMessage('amount must be >= 1000 VND'),
    body('orderInfo').notEmpty().withMessage('orderInfo is required'),
    body('ipAddr').optional().isString().withMessage('ipAddr must be string'),
    body('bankCode').optional().isString().withMessage('bankCode must be string')
  ]
};


