import { body, param, query } from 'express-validator';

export const adminSectionValidation = {
  // Validation for section ID parameter
  sectionId: [
    param('id').notEmpty().withMessage('Invalid section ID')
  ],

  // Validation for course ID parameter
  courseId: [
    param('courseId').notEmpty().withMessage('Invalid course ID')
  ],

  // Validation for creating a new section
  createSection: [
    body('courseId').notEmpty().withMessage('Invalid course ID'),
    body('title').notEmpty().trim().isLength({ min: 1, max: 200 }).withMessage('Section title must be between 1 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
    body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean value')
  ],

  // Validation for updating a section
  updateSection: [
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Section title must be between 1 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
    body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean value')
  ],

  // Validation for reordering sections
  reorderSections: [
    body('sectionOrders').isArray().withMessage('sectionOrders must be an array'),
    body('sectionOrders.*.sectionId').notEmpty().withMessage('Invalid section ID in sectionOrders'),
    body('sectionOrders.*.order').isInt({ min: 1 }).withMessage('Order must be a positive integer in sectionOrders')
  ],

  // Validation for bulk update sections
  bulkUpdateSections: [
    body('updates').isArray().withMessage('updates must be an array'),
    body('updates.*.sectionId').notEmpty().withMessage('Invalid section ID in updates'),
    body('updates.*.updates').isObject().withMessage('Each update must have an updates object')
  ],

  // Validation for query parameters
  queryParams: [
    query('includeHidden').optional().isBoolean().withMessage('includeHidden must be a boolean value')
  ]
};
