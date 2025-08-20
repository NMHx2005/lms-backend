import { body, param, query } from 'express-validator';
import { validateRequest } from '../../shared/middleware/validation';

export const getModerationQueueValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'flagged', 'rejected'])
    .withMessage('Invalid status filter'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validateRequest
];

export const moderateCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  body('action')
    .isIn(['approve', 'reject', 'flag'])
    .withMessage('Action must be approve, reject, or flag'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Reason must be less than 1000 characters'),
  
  validateRequest
];

export const bulkModerateCommentsValidation = [
  body('commentIds')
    .isArray({ min: 1 })
    .withMessage('Comment IDs must be a non-empty array'),
  
  body('commentIds.*')
    .isMongoId()
    .withMessage('Each comment ID must be a valid MongoDB ID'),
  
  body('action')
    .isIn(['approve', 'reject', 'flag'])
    .withMessage('Action must be approve, reject, or flag'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Reason must be less than 1000 characters'),
  
  validateRequest
];

export const getModerationStatsValidation = [
  query('contentType')
    .optional()
    .isIn(['course', 'lesson', 'discussion', 'assignment'])
    .withMessage('Invalid content type'),
  
  query('contentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid content ID'),
  
  validateRequest
];

export const getCommentReportsValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  validateRequest
];

export const resolveReportValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  param('reportId')
    .isMongoId()
    .withMessage('Invalid report ID'),
  
  body('status')
    .isIn(['resolved', 'dismissed'])
    .withMessage('Status must be resolved or dismissed'),
  
  body('resolutionNote')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resolution note must be less than 1000 characters'),
  
  validateRequest
];

export const getCommentAuditValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  validateRequest
];
