import { param, query, ValidationChain } from 'express-validator';

export const clientAnnouncementValidation = {
  getMyAnnouncements: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),

    query('unreadOnly')
      .optional()
      .isBoolean()
      .withMessage('unreadOnly must be a boolean')
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  acknowledgeAnnouncement: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  trackClick: [
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID')
  ],

  getCourseAnnouncements: [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],

  searchAnnouncements: [
    query('query')
      .notEmpty()
      .withMessage('Search query is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],

  getAnnouncementSummary: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],

  getUrgentAnnouncements: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ]
};
