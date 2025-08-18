import { body, param, query } from 'express-validator';

export const adminAnnouncementValidation = {
  createAnnouncement: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters')
      .trim(),

    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Content must be between 1 and 5000 characters')
      .trim(),

    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['general', 'course', 'urgent', 'maintenance', 'update'])
      .withMessage('Invalid announcement type'),

    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Invalid priority level'),

    body('target')
      .notEmpty()
      .withMessage('Target is required')
      .isObject()
      .withMessage('Target must be an object'),

    body('target.type')
      .notEmpty()
      .withMessage('Target type is required')
      .isIn(['all', 'role', 'course', 'user'])
      .withMessage('Invalid target type'),

    body('target.value')
      .optional()
      .custom((value, { req }) => {
        const targetType = req.body.target?.type;
        if (targetType && targetType !== 'all') {
          if (value === undefined || value === null) {
            throw new Error('Target value is required for specific targeting');
          }
        }
        return true;
      }),

    body('isScheduled')
      .optional()
      .isBoolean()
      .withMessage('isScheduled must be a boolean'),

    body('scheduledAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid scheduled date format')
      .custom((value, { req }) => {
        if (req.body.isScheduled && value) {
          const scheduledDate = new Date(value);
          if (scheduledDate <= new Date()) {
            throw new Error('Scheduled date must be in the future');
          }
        }
        return true;
      }),

    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiration date format')
      .custom((value) => {
        if (value) {
          const expiryDate = new Date(value);
          if (expiryDate <= new Date()) {
            throw new Error('Expiration date must be in the future');
          }
        }
        return true;
      }),

    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),

    body('attachments.*.type')
      .optional()
      .isIn(['image', 'video', 'document'])
      .withMessage('Invalid attachment type'),

    body('attachments.*.url')
      .optional()
      .isURL()
      .withMessage('Invalid attachment URL'),

    body('attachments.*.filename')
      .optional()
      .notEmpty()
      .withMessage('Attachment filename is required')
      .trim(),

    body('attachments.*.size')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Attachment size must be a positive number'),

    body('displayOptions')
      .optional()
      .isObject()
      .withMessage('Display options must be an object'),

    body('displayOptions.showAsPopup')
      .optional()
      .isBoolean()
      .withMessage('showAsPopup must be a boolean'),

    body('displayOptions.showOnDashboard')
      .optional()
      .isBoolean()
      .withMessage('showOnDashboard must be a boolean'),

    body('displayOptions.sendEmail')
      .optional()
      .isBoolean()
      .withMessage('sendEmail must be a boolean'),

    body('displayOptions.sendPush')
      .optional()
      .isBoolean()
      .withMessage('sendPush must be a boolean'),

    body('displayOptions.requireAcknowledgment')
      .optional()
      .isBoolean()
      .withMessage('requireAcknowledgment must be a boolean'),

    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),

    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters')
  ],

  updateAnnouncement: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID'),

    body('title')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters')
      .trim(),

    body('content')
      .optional()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Content must be between 1 and 5000 characters')
      .trim(),

    body('type')
      .optional()
      .isIn(['general', 'course', 'urgent', 'maintenance', 'update'])
      .withMessage('Invalid announcement type'),

    body('priority')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Invalid priority level'),

    body('target')
      .optional()
      .isObject()
      .withMessage('Target must be an object'),

    body('target.type')
      .optional()
      .isIn(['all', 'role', 'course', 'user'])
      .withMessage('Invalid target type'),

    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiration date format')
      .custom((value) => {
        if (value) {
          const expiryDate = new Date(value);
          if (expiryDate <= new Date()) {
            throw new Error('Expiration date must be in the future');
          }
        }
        return true;
      }),

    body('displayOptions')
      .optional()
      .isObject()
      .withMessage('Display options must be an object'),

    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),

    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters')
  ],

  getAnnouncements: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'publishedAt', 'title', 'priority', 'type'])
      .withMessage('Invalid sort field'),

    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),

    query('status')
      .optional()
      .custom((value) => {
        const validStatuses = ['draft', 'scheduled', 'published', 'expired', 'cancelled'];
        if (Array.isArray(value)) {
          return value.every(status => validStatuses.includes(status));
        } else if (typeof value === 'string') {
          return validStatuses.includes(value);
        }
        return false;
      })
      .withMessage('Invalid status value(s)'),

    query('type')
      .optional()
      .custom((value) => {
        const validTypes = ['general', 'course', 'urgent', 'maintenance', 'update'];
        if (Array.isArray(value)) {
          return value.every(type => validTypes.includes(type));
        } else if (typeof value === 'string') {
          return validTypes.includes(value);
        }
        return false;
      })
      .withMessage('Invalid type value(s)'),

    query('priority')
      .optional()
      .custom((value) => {
        const validPriorities = ['low', 'normal', 'high', 'urgent'];
        if (Array.isArray(value)) {
          return value.every(priority => validPriorities.includes(priority));
        } else if (typeof value === 'string') {
          return validPriorities.includes(value);
        }
        return false;
      })
      .withMessage('Invalid priority value(s)'),

    query('targetType')
      .optional()
      .custom((value) => {
        const validTargetTypes = ['all', 'role', 'course', 'user'];
        if (Array.isArray(value)) {
          return value.every(targetType => validTargetTypes.includes(targetType));
        } else if (typeof value === 'string') {
          return validTargetTypes.includes(value);
        }
        return false;
      })
      .withMessage('Invalid target type value(s)'),

    query('createdBy')
      .optional()
      .isMongoId()
      .withMessage('Invalid creator ID'),

    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),

    query('search')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  deleteAnnouncement: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  publishAnnouncement: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  cancelAnnouncement: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  getAnalytics: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  bulkPublish: [
    body('announcementIds')
      .isArray({ min: 1 })
      .withMessage('Announcement IDs array is required'),

    body('announcementIds.*')
      .isMongoId()
      .withMessage('Each announcement ID must be valid')
  ],

  bulkDelete: [
    body('announcementIds')
      .isArray({ min: 1 })
      .withMessage('Announcement IDs array is required'),

    body('announcementIds.*')
      .isMongoId()
      .withMessage('Each announcement ID must be valid')
  ],

  getStats: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),

    query('type')
      .optional()
      .isIn(['general', 'course', 'urgent', 'maintenance', 'update'])
      .withMessage('Invalid announcement type'),

    query('targetType')
      .optional()
      .isIn(['all', 'role', 'course', 'user'])
      .withMessage('Invalid target type')
  ]
};
