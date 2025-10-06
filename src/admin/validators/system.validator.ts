import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const adminSystemValidation = {
  // Refund ID validation
  refundId: [
    commonValidations.mongoId('id'),
  ],

  // Refund operations
  processRefund: [
    body('action').notEmpty().withMessage('Action is required'),
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('notes').optional(),
    body('notes').isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
    body('refundMethod').optional(),
    body('refundMethod').isIn(['original_payment', 'credit', 'bank_transfer']).withMessage('Invalid refund method'),
  ],

  // Bulk process refunds
  bulkProcessRefunds: [
    body('refundIds').isArray().withMessage('Refund IDs must be an array'),
    body('refundIds').isArray({ min: 1 }).withMessage('At least one refund ID is required'),
    body('action').notEmpty().withMessage('Action is required'),
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('notes').optional(),
    body('notes').isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  ],

  refundQuery: [
    ...commonValidations.pagination(),
    query('status').optional().isIn(['approved', 'rejected', 'pending']),
    query('userId').optional().isMongoId(),
    query('courseId').optional().isMongoId(),
    query('createdAtFrom').optional().isISO8601().withMessage('Created at from must be in ISO 8601 format'),
    query('createdAtTo').optional().isISO8601().withMessage('Created at to must be in ISO 8601 format'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'refundAmount', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],

  // System logs
  systemLogsQuery: [
    ...commonValidations.pagination(),
    query('severity').optional().isIn(['error', 'warn', 'info', 'debug']),
    query('type').optional().isIn(['auth', 'payment', 'course', 'user', 'system']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('userId').optional().isMongoId(),
    query('sortBy').optional().isIn(['timestamp', 'severity', 'type']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],

  // System settings
  updateSystemSettings: [
    body('maintenanceMode').optional(),
    commonValidations.boolean('maintenanceMode'),
    body('maintenanceMessage').optional(),
    body('maintenanceMessage').isLength({ max: 500 }).withMessage('Maintenance message must be less than 500 characters'),
    body('maxFileSize').optional(),
    body('maxFileSize').isInt({ min: 1024, max: 100 * 1024 * 1024 }).withMessage('Max file size must be between 1KB and 100MB'),
    body('allowedFileTypes').optional(),
    body('allowedFileTypes').isArray().withMessage('Allowed file types must be an array'),
    body('sessionTimeout').optional(),
    body('sessionTimeout').isInt({ min: 300, max: 86400 }).withMessage('Session timeout must be between 5 minutes and 24 hours'),
    body('maxLoginAttempts').optional(),
    body('maxLoginAttempts').isInt({ min: 3, max: 10 }).withMessage('Max login attempts must be between 3 and 10'),
    body('passwordPolicy').optional(),
    body('passwordPolicy.minLength').optional().isInt({ min: 6, max: 20 }),
    body('passwordPolicy.requireUppercase').optional().isBoolean(),
    body('passwordPolicy.requireLowercase').optional().isBoolean(),
    body('passwordPolicy.requireNumbers').optional().isBoolean(),
    body('passwordPolicy.requireSpecialChars').optional().isBoolean(),
  ],

  // System health check
  healthCheckQuery: [
    query('detailed').optional().isBoolean().withMessage('Detailed must be a boolean'),
    query('services').optional().isArray().withMessage('Services must be an array'),
    query('timeout').optional().isInt({ min: 1000, max: 30000 }).withMessage('Timeout must be between 1 and 30 seconds'),
  ],

  // Backup operations
  createBackup: [
    body('type').notEmpty().withMessage('Backup type is required'),
    body('type').isIn(['full', 'incremental', 'database', 'files']).withMessage('Backup type must be full, incremental, database, or files'),
    body('description').optional(),
    body('description').isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('retentionDays').optional(),
    body('retentionDays').isInt({ min: 1, max: 365 }).withMessage('Retention days must be between 1 and 365'),
  ],

  restoreBackup: [
    body('backupId').notEmpty().withMessage('Backup ID is required'),
    commonValidations.mongoId('backupId'),
    body('confirmRestore').notEmpty().withMessage('Confirmation is required'),
    body('confirmRestore').isBoolean().withMessage('Confirmation must be a boolean'),
    body('restoreOptions').optional(),
    body('restoreOptions.overwrite').optional().isBoolean(),
    body('restoreOptions.validateOnly').optional().isBoolean(),
  ],

  // System monitoring
  monitoringQuery: [
    query('metric').notEmpty().withMessage('Metric is required'),
    query('metric').isIn(['cpu', 'memory', 'disk', 'network', 'database', 'api']),
    query('period').optional().isIn(['1m', '5m', '15m', '1h', '6h', '1d']),
    query('startTime').optional().isISO8601().withMessage('Start time must be in ISO 8601 format'),
    query('endTime').optional().isISO8601().withMessage('End time must be in ISO 8601 format'),
    query('aggregation').optional().isIn(['avg', 'min', 'max', 'sum', 'count']),
  ],

  // System alerts
  updateAlertSettings: [
    body('enabled').optional(),
    commonValidations.boolean('enabled'),
    body('thresholds').optional(),
    body('thresholds.cpu').optional().isFloat({ min: 0, max: 100 }),
    body('thresholds.memory').optional().isFloat({ min: 0, max: 100 }),
    body('thresholds.disk').optional().isFloat({ min: 0, max: 100 }),
    body('notifications').optional(),
    body('notifications.email').optional().isArray(),
    body('notifications.slack').optional().isArray(),
    body('notifications.webhook').optional().isArray(),
  ],
};
