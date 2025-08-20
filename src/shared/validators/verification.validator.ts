import { body, param, query } from 'express-validator';

export const validateCertificateIdentifier = [
  param('identifier')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Certificate identifier is required and must be valid')
    .trim()
];

export const validateQRVerification = [
  body('qrData')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('QR code data is required and must be valid')
    .trim()
];

export const validateBulkVerification = [
  body('identifiers')
    .isArray({ min: 1, max: 50 })
    .withMessage('Identifiers array is required (max 50)'),
  body('identifiers.*')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each identifier must be a valid string')
];

export const validateReportGeneration = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv')
];

export const validateVerificationStats = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Period must be day, week, month, or year'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateCertificateSearch = [
  query('q').optional().isString().trim().withMessage('Search query must be a string'),
  query('domain').optional().isString().trim().withMessage('Domain must be a string'),
  query('level')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
    .withMessage('Invalid level'),
  query('type')
    .optional()
    .isIn(['completion', 'achievement', 'mastery', 'professional', 'expert'])
    .withMessage('Invalid certificate type'),
  query('verified').optional().isBoolean().withMessage('Verified must be boolean')
];

export const validatePublicAccess = [
  param('identifier')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Certificate identifier is required'),
  query('format')
    .optional()
    .isIn(['json', 'pdf', 'image'])
    .withMessage('Format must be json, pdf, or image')
];

export const validateBatchOperation = [
  body('operation')
    .isIn(['verify', 'validate', 'check'])
    .withMessage('Operation must be verify, validate, or check'),
  body('identifiers')
    .isArray({ min: 1, max: 100 })
    .withMessage('Identifiers array is required (max 100)'),
  body('options').optional().isObject().withMessage('Options must be an object')
];
