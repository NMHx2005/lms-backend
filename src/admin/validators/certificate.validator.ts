import { body, param, query } from 'express-validator';

export const validateGetCertificates = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'revoked', 'expired', 'replaced']).withMessage('Invalid status'),
  query('search').optional().isString().trim().withMessage('Search must be a string'),
  query('courseId').optional().isMongoId().withMessage('Invalid course ID'),
  query('studentId').optional().isMongoId().withMessage('Invalid student ID')
];

export const validateCertificateId = [
  param('id').isMongoId().withMessage('Invalid certificate ID')
];

export const validateCertificateIdentifier = [
  param('id').isString().isLength({ min: 1 }).withMessage('Certificate identifier is required')
];

export const validateGenerateCertificate = [
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('templateId').optional().isMongoId().withMessage('Invalid template ID')
];

export const validateRevokeCertificate = [
  param('id').isString().withMessage('Certificate ID is required'),
  body('reason')
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('Revocation reason must be between 10 and 500 characters')
    .trim()
];

export const validateBulkRevoke = [
  body('certificateIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Certificate IDs array is required (max 100)'),
  body('certificateIds.*').isString().withMessage('Each certificate ID must be a string'),
  body('reason')
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('Revocation reason must be between 10 and 500 characters')
    .trim()
];

export const validateExportCertificates = [
  query('status').optional().isIn(['active', 'revoked', 'expired', 'replaced']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

export const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

export const validateSearchQuery = [
  query('q').optional().isString().trim().withMessage('Search query must be a string'),
  query('type').optional().isIn(['completion', 'achievement', 'mastery', 'professional', 'expert']).withMessage('Invalid certificate type'),
  query('level').optional().isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond']).withMessage('Invalid level')
];
