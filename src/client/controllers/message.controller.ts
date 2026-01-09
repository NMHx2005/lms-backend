import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';

export class MessageController {
    /**
     * Get user messages with pagination and filters
     */
    static async getMessages(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { page = 1, limit = 20, type = 'inbox', conversationId, search } = req.query;

            const result = await MessageService.getMessages(userId, {
                page: Number(page),
                limit: Number(limit),
                type: type as string,
                conversationId: conversationId as string,
                search: search as string
            });

            res.json({
                success: true,
                data: result.messages,
                pagination: result.pagination
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get user conversations
     */
    static async getConversations(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { page = 1, limit = 20 } = req.query;

            const result = await MessageService.getConversations(userId, {
                page: Number(page),
                limit: Number(limit)
            });

            res.json({
                success: true,
                data: result.conversations,
                pagination: result.pagination
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get unread messages count
     */
    static async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const count = await MessageService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get message by ID
     */
    static async getMessageById(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { id } = req.params;

            const message = await MessageService.getMessageById(id, userId);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: 'Message not found'
                });
            }

            res.json({
                success: true,
                data: message
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Send new message
     */
    static async sendMessage(req: Request, res: Response) {
        try {
            const senderId = (req.user as any)?.id;
            const { recipientId, subject, content, conversationId, attachments } = req.body;

            const message = await MessageService.sendMessage({
                senderId,
                recipientId,
                subject,
                content,
                conversationId,
                attachments
            });

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: message
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Update message (edit draft)
     */
    static async updateMessage(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { id } = req.params;
            const updates = req.body;

            const message = await MessageService.updateMessage(id, userId, updates);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: 'Message not found or cannot be updated'
                });
            }

            res.json({
                success: true,
                message: 'Message updated successfully',
                data: message
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Delete message
     */
    static async deleteMessage(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { id } = req.params;

            await MessageService.deleteMessage(id, userId);

            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Mark message as read
     */
    static async markAsRead(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { id } = req.params;

            const message = await MessageService.markAsRead(id, userId);

            res.json({
                success: true,
                message: 'Message marked as read',
                data: message
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Archive message
     */
    static async archiveMessage(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { id } = req.params;

            const message = await MessageService.archiveMessage(id, userId);

            res.json({
                success: true,
                message: 'Message archived successfully',
                data: message
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Bulk mark messages as read
     */
    static async bulkMarkAsRead(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { messageIds } = req.body;

            const result = await MessageService.bulkMarkAsRead(messageIds, userId);

            res.json({
                success: true,
                message: `${result.modifiedCount} messages marked as read`,
                data: result
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Send typing indicator
     */
    static async sendTypingIndicator(req: Request, res: Response) {
        try {
            const userId = (req.user as any)?.id;
            const { conversationId } = req.params;

            await MessageService.sendTypingIndicator(conversationId, userId);

            res.json({
                success: true,
                message: 'Typing indicator sent'
            });
        } catch (error) {

            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

export default MessageController;

