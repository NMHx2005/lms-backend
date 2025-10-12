import { Request, Response } from 'express';
import ChatService from '../services/chat.service';
import { validateRequest } from '../../shared/middleware/validation';
import { clientChatValidation } from '../validators/chat.validator';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * Send message to AI chat
   */
  static async sendMessage(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { message, context } = req.body;

      const chatService = new ChatService();
      const result = await chatService.sendMessage(userId, message, context);

      res.json({
        success: true,
        data: result,
        message: 'Message processed successfully'
      });
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process message'
      });
    }
  }

  /**
   * Get chat history for user
   */
  static async getChatHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { limit = 20 } = req.query;

      const chatService = new ChatService();
      const history = await chatService.getChatHistory(userId, Number(limit));

      res.json({
        success: true,
        data: history,
        message: 'Chat history retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve chat history'
      });
    }
  }

  /**
   * Get active chat session
   */
  static async getActiveSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const chatService = new ChatService();
      const session = await chatService.getActiveSession(userId);

      res.json({
        success: true,
        data: session,
        message: 'Active session retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get active session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve active session'
      });
    }
  }

  /**
   * End current chat session
   */
  static async endSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const chatService = new ChatService();
      await chatService.endSession(userId);

      res.json({
        success: true,
        message: 'Session ended successfully'
      });
    } catch (error: any) {
      console.error('End session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to end session'
      });
    }
  }

  /**
   * Get chat statistics
   */
  static async getChatStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const chatService = new ChatService();
      const stats = await chatService.getChatStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'Chat statistics retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get chat stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve chat statistics'
      });
    }
  }

  /**
   * Test AI connection
   */
  static async testConnection(req: Request, res: Response) {
    try {
      const chatService = new ChatService();
      const isConnected = await chatService.testAIConnection();

      res.json({
        success: true,
        data: { connected: isConnected },
        message: isConnected ? 'AI connection successful' : 'AI connection failed'
      });
    } catch (error: any) {
      console.error('Test connection error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test AI connection'
      });
    }
  }
}

export default ChatController;
