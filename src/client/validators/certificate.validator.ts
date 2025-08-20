import { body, param, query } from 'express-validator';

export const validateGetMyCertificates = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['active', 'revoked', 'expired', 'replaced']).withMessage('Invalid status')
];

export const validateCertificateId = [
  param('id').isMongoId().withMessage('Invalid certificate ID')
];

export const validateCourseId = [
  param('courseId').isMongoId().withMessage('Invalid course ID')
];

export const validateRequestCertificate = [
  body('courseId').isMongoId().withMessage('Valid course ID is required')
];

export const validateSearchCertificates = [
  query('q').optional().isString().trim().withMessage('Search query must be a string'),
  query('type')
    .optional()
    .isIn(['completion', 'achievement', 'mastery', 'professional', 'expert'])
    .withMessage('Invalid certificate type'),
  query('level')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
    .withMessage('Invalid level'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

export const validateCertificateFilters = [
  query('status').optional().isIn(['active', 'revoked', 'expired', 'replaced']).withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['completion', 'achievement', 'mastery', 'professional', 'expert'])
    .withMessage('Invalid certificate type'),
  query('level')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
    .withMessage('Invalid level')
];
