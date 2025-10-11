import { Router } from 'express';
import MessageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/client/messages
 * @desc    Get user messages with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('type').optional().isIn(['inbox', 'sent', 'archived']).withMessage('Invalid message type'),
        query('conversationId').optional().isMongoId().withMessage('Invalid conversation ID'),
        query('search').optional().isString().trim(),
        validateRequest
    ],
    MessageController.getMessages
);

/**
 * @route   GET /api/client/messages/conversations
 * @desc    Get user conversations
 * @access  Private
 */
router.get(
    '/conversations',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        validateRequest
    ],
    MessageController.getConversations
);

/**
 * @route   GET /api/client/messages/unread-count
 * @desc    Get unread messages count
 * @access  Private
 */
router.get('/unread-count', MessageController.getUnreadCount);

/**
 * @route   GET /api/client/messages/:id
 * @desc    Get message by ID
 * @access  Private
 */
router.get(
    '/:id',
    [
        param('id').isMongoId().withMessage('Invalid message ID'),
        validateRequest
    ],
    MessageController.getMessageById
);

/**
 * @route   POST /api/client/messages
 * @desc    Send new message
 * @access  Private
 */
router.post(
    '/',
    [
        body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
        body('subject').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Subject must be 1-200 characters'),
        body('content').isString().trim().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),
        body('conversationId').optional().isMongoId().withMessage('Invalid conversation ID'),
        body('attachments').optional().isArray().withMessage('Attachments must be an array'),
        body('attachments.*.url').optional().isURL().withMessage('Invalid attachment URL'),
        body('attachments.*.name').optional().isString().trim(),
        body('attachments.*.type').optional().isString().trim(),
        validateRequest
    ],
    MessageController.sendMessage
);

/**
 * @route   PUT /api/client/messages/:id
 * @desc    Update message (edit draft)
 * @access  Private
 */
router.put(
    '/:id',
    [
        param('id').isMongoId().withMessage('Invalid message ID'),
        body('subject').optional().isString().trim().isLength({ min: 1, max: 200 }),
        body('content').optional().isString().trim().isLength({ min: 1, max: 5000 }),
        body('attachments').optional().isArray(),
        validateRequest
    ],
    MessageController.updateMessage
);

/**
 * @route   DELETE /api/client/messages/:id
 * @desc    Delete message
 * @access  Private
 */
router.delete(
    '/:id',
    [
        param('id').isMongoId().withMessage('Invalid message ID'),
        validateRequest
    ],
    MessageController.deleteMessage
);

/**
 * @route   PATCH /api/client/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.patch(
    '/:id/read',
    [
        param('id').isMongoId().withMessage('Invalid message ID'),
        validateRequest
    ],
    MessageController.markAsRead
);

/**
 * @route   PATCH /api/client/messages/:id/archive
 * @desc    Archive message
 * @access  Private
 */
router.patch(
    '/:id/archive',
    [
        param('id').isMongoId().withMessage('Invalid message ID'),
        validateRequest
    ],
    MessageController.archiveMessage
);

/**
 * @route   PATCH /api/client/messages/bulk/read
 * @desc    Mark multiple messages as read
 * @access  Private
 */
router.patch(
    '/bulk/read',
    [
        body('messageIds').isArray({ min: 1 }).withMessage('Message IDs array is required'),
        body('messageIds.*').isMongoId().withMessage('Invalid message ID in array'),
        validateRequest
    ],
    MessageController.bulkMarkAsRead
);

/**
 * @route   POST /api/client/messages/conversations/:conversationId/typing
 * @desc    Send typing indicator
 * @access  Private
 */
router.post(
    '/conversations/:conversationId/typing',
    [
        param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
        validateRequest
    ],
    MessageController.sendTypingIndicator
);

export default router;

