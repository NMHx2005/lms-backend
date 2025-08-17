import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const adminSupportValidation = {
  // Ticket operations
  createTicket: [
    body('title').notEmpty().withMessage('Title is required'),
    commonValidations.name('title'),
    body('description').notEmpty().withMessage('Description is required'),
    commonValidations.description('description'),
    body('category').notEmpty().withMessage('Category is required'),
    body('category').isIn(['technical', 'billing', 'course', 'account', 'general']).withMessage('Invalid category'),
    body('priority').notEmpty().withMessage('Priority is required'),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('userId').notEmpty().withMessage('User ID is required'),
    commonValidations.mongoId('userId'),
    body('attachments').optional(),
    body('attachments').isArray().withMessage('Attachments must be an array'),
  ],

  updateTicket: [
    body('title').optional(),
    commonValidations.name('title'),
    body('description').optional(),
    commonValidations.description('description'),
    body('status').optional(),
    body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    body('priority').optional(),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('category').optional(),
    body('category').isIn(['technical', 'billing', 'course', 'account', 'general']).withMessage('Invalid category'),
    body('assignedTo').optional(),
    commonValidations.mongoId('assignedTo'),
    body('resolution').optional(),
    body('resolution').isLength({ max: 2000 }).withMessage('Resolution must be less than 2000 characters'),
  ],

  // Ticket ID validation
  ticketId: [
    commonValidations.mongoId('ticketId'),
  ],

  // Query parameters validation
  ticketQuery: [
    ...commonValidations.pagination(),
    commonValidations.search('search'),
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('category').optional().isIn(['technical', 'billing', 'course', 'account', 'general']),
    query('assignedTo').optional().isMongoId(),
    query('userId').optional().isMongoId(),
    query('createdAtFrom').optional().isISO8601().withMessage('Created at from must be in ISO 8601 format'),
    query('createdAtTo').optional().isISO8601().withMessage('Created at to must be in ISO 8601 format'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'priority', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],

  // Ticket assignment
  assignTicket: [
    body('assignedTo').notEmpty().withMessage('Assigned user ID is required'),
    commonValidations.mongoId('assignedTo'),
    body('note').optional(),
    body('note').isLength({ max: 500 }).withMessage('Note must be less than 500 characters'),
  ],

  // Ticket response
  addResponse: [
    body('message').notEmpty().withMessage('Message is required'),
    body('message').isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
    body('isInternal').optional(),
    commonValidations.boolean('isInternal'),
    body('attachments').optional(),
    body('attachments').isArray().withMessage('Attachments must be an array'),
  ],

  // Bulk operations
  bulkUpdateStatus: [
    body('ticketIds').notEmpty().withMessage('Ticket IDs are required'),
    body('ticketIds').isArray().withMessage('Ticket IDs must be an array'),
    body('ticketIds.*').isMongoId().withMessage('Each ticket ID must be a valid MongoDB ObjectId'),
    body('status').notEmpty().withMessage('Status is required'),
    body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
    body('note').optional(),
    body('note').isLength({ max: 500 }).withMessage('Note must be less than 500 characters'),
  ],

  bulkAssign: [
    body('ticketIds').notEmpty().withMessage('Ticket IDs are required'),
    body('ticketIds').isArray().withMessage('Ticket IDs must be an array'),
    body('ticketIds.*').isMongoId().withMessage('Each ticket ID must be a valid MongoDB ObjectId'),
    body('assignedTo').notEmpty().withMessage('Assigned user ID is required'),
    commonValidations.mongoId('assignedTo'),
    body('note').optional(),
    body('note').isLength({ max: 500 }).withMessage('Note must be less than 500 characters'),
  ],

  // Support analytics
  analyticsQuery: [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('category').optional().isIn(['technical', 'billing', 'course', 'account', 'general']),
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    query('assignedTo').optional().isMongoId(),
  ],

  // Knowledge base
  createArticle: [
    body('title').notEmpty().withMessage('Title is required'),
    commonValidations.name('title'),
    body('content').notEmpty().withMessage('Content is required'),
    body('content').isLength({ min: 100, max: 10000 }).withMessage('Content must be between 100 and 10000 characters'),
    body('category').notEmpty().withMessage('Category is required'),
    body('category').isIn(['technical', 'billing', 'course', 'account', 'general']).withMessage('Invalid category'),
    body('tags').optional(),
    body('tags').isArray().withMessage('Tags must be an array'),
    body('isPublished').optional(),
    commonValidations.boolean('isPublished'),
  ],

  updateArticle: [
    body('title').optional(),
    commonValidations.name('title'),
    body('content').optional(),
    body('content').isLength({ min: 100, max: 10000 }).withMessage('Content must be between 100 and 10000 characters'),
    body('category').optional(),
    body('category').isIn(['technical', 'billing', 'course', 'account', 'general']).withMessage('Invalid category'),
    body('tags').optional(),
    body('tags').isArray().withMessage('Tags must be an array'),
    body('isPublished').optional(),
    commonValidations.boolean('isPublished'),
  ],

  // FAQ management
  createFAQ: [
    body('question').notEmpty().withMessage('Question is required'),
    body('question').isLength({ min: 10, max: 500 }).withMessage('Question must be between 10 and 500 characters'),
    body('answer').notEmpty().withMessage('Answer is required'),
    body('answer').isLength({ min: 20, max: 2000 }).withMessage('Answer must be between 20 and 2000 characters'),
    body('category').notEmpty().withMessage('Category is required'),
    body('category').isIn(['technical', 'billing', 'course', 'account', 'general']).withMessage('Invalid category'),
    body('isPublished').optional(),
    commonValidations.boolean('isPublished'),
  ],

  updateFAQ: [
    body('question').optional(),
    body('question').isLength({ min: 10, max: 500 }).withMessage('Question must be between 10 and 500 characters'),
    body('answer').optional(),
    body('answer').isLength({ min: 20, max: 2000 }).withMessage('Answer must be between 20 and 2000 characters'),
    body('category').optional(),
    body('category').isIn(['technical', 'billing', 'course', 'account', 'general']).withMessage('Invalid category'),
    body('isPublished').optional(),
    commonValidations.boolean('isPublished'),
  ],
};
