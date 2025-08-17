import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';

export const adminAnalyticsValidation = {
  // Analytics period validation
  analyticsPeriod: [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly', 'custom']).withMessage('Invalid period parameter'),
  ],

  // Date range validation
  dateRange: [
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)'),
    query('startDate').custom((value, { req }) => {
      if (value && req.query?.endDate) {
        const start = new Date(value);
        const end = new Date(req.query.endDate as string);
        if (start >= end) {
          throw new Error('Start date must be before end date');
        }
      }
      return true;
    }),
  ],

  // User analytics
  userAnalytics: [
    ...commonValidations.pagination(),
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('roles').optional().isArray().withMessage('Roles must be an array'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('sortBy').optional().isIn(['createdAt', 'lastLogin', 'enrollmentCount', 'courseCount']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],

  // Course analytics
  courseAnalytics: [
    ...commonValidations.pagination(),
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    query('domain').optional().isLength({ min: 2, max: 100 }),
    query('instructorId').optional().isMongoId(),
    query('sortBy').optional().isIn(['createdAt', 'enrollmentCount', 'rating', 'price', 'duration']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],

  // Revenue analytics
  revenueAnalytics: [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('paymentMethod').optional().isIn(['credit_card', 'paypal', 'bank_transfer', 'crypto']),
    query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year', 'course', 'instructor']),
  ],

  // Learning analytics
  learningAnalytics: [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('courseId').optional().isMongoId(),
    query('userId').optional().isMongoId(),
    query('instructorId').optional().isMongoId(),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'course', 'user', 'instructor']),
  ],

  // System performance analytics
  systemPerformance: [
    query('period').optional().isIn(['1m', '5m', '15m', '1h', '6h', '1d']),
    query('startTime').optional().isISO8601().withMessage('Start time must be in ISO 8601 format'),
    query('endTime').optional().isISO8601().withMessage('End time must be in ISO 8601 format'),
    query('metric').optional().isIn(['cpu', 'memory', 'disk', 'network', 'database', 'api']),
    query('aggregation').optional().isIn(['avg', 'min', 'max', 'sum', 'count']),
    query('detailed').optional().isBoolean().withMessage('Detailed must be a boolean'),
  ],

  // Custom report generation
  customReport: [
    body('name').notEmpty().withMessage('Report name is required'),
    body('name').isLength({ min: 3, max: 100 }).withMessage('Report name must be between 3 and 100 characters'),
    body('description').optional(),
    body('description').isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('type').notEmpty().withMessage('Report type is required'),
    body('type').isIn(['user', 'course', 'revenue', 'learning', 'system', 'custom']).withMessage('Invalid report type'),
    body('parameters').optional(),
    body('parameters').isObject().withMessage('Parameters must be an object'),
    body('schedule').optional(),
    body('schedule.frequency').optional().isIn(['daily', 'weekly', 'monthly']),
    body('schedule.time').optional().isLength({ min: 4, max: 5 }).withMessage('Schedule time must be in HH:MM format'),
    body('recipients').optional(),
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*').isEmail().withMessage('Each recipient must be a valid email'),
  ],

  // Export analytics data
  exportData: [
    query('format').notEmpty().withMessage('Export format is required'),
    query('format').isIn(['csv', 'excel', 'json', 'pdf']).withMessage('Export format must be csv, excel, json, or pdf'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('includeCharts').optional().isBoolean().withMessage('Include charts must be a boolean'),
    query('compression').optional().isBoolean().withMessage('Compression must be a boolean'),
  ],
};
