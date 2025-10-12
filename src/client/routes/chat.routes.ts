import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();

/**
 * @route POST /api/client/chat/send
 * @desc Send message to AI chat
 * @access Private
 */
router.post('/send', ChatController.sendMessage);

/**
 * @route GET /api/client/chat/history
 * @desc Get chat history for user
 * @access Private
 */
router.get('/history', ChatController.getChatHistory);

/**
 * @route GET /api/client/chat/session
 * @desc Get active chat session
 * @access Private
 */
router.get('/session',
    ChatController.getActiveSession
);

/**
 * @route DELETE /api/client/chat/session
 * @desc End current chat session
 * @access Private
 */
router.delete('/session',
    ChatController.endSession
);

/**
 * @route GET /api/client/chat/stats
 * @desc Get chat statistics for user
 * @access Private
 */
router.get('/stats',
    ChatController.getChatStats
);

/**
 * @route GET /api/client/chat/test
 * @desc Test AI connection
 * @access Private
 */
router.get('/test',
    ChatController.testConnection
);

export default router;
