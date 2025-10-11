import { Message } from '../../shared/models/core/Message';
import mongoose from 'mongoose';

export class MessageService {
    /**
     * Generate conversation ID from two user IDs
     */
    static generateConversationId(userId1: string, userId2: string): string {
        const sortedIds = [userId1, userId2].sort();
        return `conv_${sortedIds[0]}_${sortedIds[1]}`;
    }

    /**
     * Get user messages with pagination and filters
     */
    static async getMessages(userId: string, filters: any) {
        const { page, limit, type, conversationId, search } = filters;
        const skip = (page - 1) * limit;

        let query: any = {};

        // Filter by type
        if (type === 'inbox') {
            query.recipientId = userId;
            query.isArchived = false;
        } else if (type === 'sent') {
            query.senderId = userId;
            query.isArchived = false;
        } else if (type === 'archived') {
            query.$or = [{ senderId: userId }, { recipientId: userId }];
            query.isArchived = true;
        } else {
            // All messages
            query.$or = [{ senderId: userId }, { recipientId: userId }];
        }

        // Filter by conversation
        if (conversationId) {
            query.conversationId = conversationId;
        }

        // Search in subject and content
        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { subject: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Quick check: if no messages exist, return empty immediately
        const hasMessages = await Message.exists(query);

        if (!hasMessages) {
            return {
                messages: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    pages: 0
                }
            };
        }

        const [messages, total] = await Promise.all([
            Message.find(query)
                .populate('senderId', 'firstName lastName email avatar roles')
                .populate('recipientId', 'firstName lastName email avatar roles')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Message.countDocuments(query)
        ]);

        return {
            messages,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get user conversations
     */
    static async getConversations(userId: string, filters: any) {
        const { page, limit } = filters;
        const skip = (page - 1) * limit;

        // Get unique conversation IDs for the user
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: new mongoose.Types.ObjectId(userId) },
                        { recipientId: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$recipientId', new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        // Populate sender and recipient details
        await Message.populate(conversations, [
            { path: 'lastMessage.senderId', select: 'firstName lastName email avatar' },
            { path: 'lastMessage.recipientId', select: 'firstName lastName email avatar' }
        ]);

        // Get total count
        const total = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: new mongoose.Types.ObjectId(userId) },
                        { recipientId: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $group: {
                    _id: '$conversationId'
                }
            },
            {
                $count: 'total'
            }
        ]);

        const totalCount = total[0]?.total || 0;

        return {
            conversations: conversations.map(conv => ({
                _id: conv._id,
                participants: [conv.lastMessage.senderId, conv.lastMessage.recipientId],
                lastMessage: {
                    content: conv.lastMessage.content,
                    createdAt: conv.lastMessage.createdAt,
                    senderId: conv.lastMessage.senderId._id
                },
                unreadCount: conv.unreadCount,
                updatedAt: conv.lastMessage.createdAt
            })),
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        };
    }

    /**
     * Get unread messages count
     */
    static async getUnreadCount(userId: string) {
        return await Message.countDocuments({
            recipientId: userId,
            isRead: false
        });
    }

    /**
     * Get message by ID
     */
    static async getMessageById(messageId: string, userId: string) {
        const message = await Message.findOne({
            _id: messageId,
            $or: [{ senderId: userId }, { recipientId: userId }]
        })
            .populate('senderId', 'firstName lastName email avatar')
            .populate('recipientId', 'firstName lastName email avatar')
            .lean();

        // Mark as read if recipient is viewing
        if (message && message.recipientId._id.toString() === userId && !message.isRead) {
            await Message.updateOne(
                { _id: messageId },
                { isRead: true, readAt: new Date() }
            );
        }

        return message;
    }

    /**
     * Send new message
     */
    static async sendMessage(data: any) {
        const { senderId, recipientId, subject, content, conversationId, attachments } = data;

        // Validate recipient exists
        const User = mongoose.model('User');
        const recipient = await User.findById(recipientId);

        if (!recipient) {
            throw new Error('Recipient not found. Please select a valid student.');
        }

        // Generate or use provided conversation ID
        const convId = conversationId || this.generateConversationId(senderId, recipientId);

        const message = new Message({
            senderId,
            recipientId,
            conversationId: convId,
            subject,
            content,
            attachments: attachments || [],
            isRead: false,
            isArchived: false
        });

        await message.save();

        await message.populate('senderId', 'firstName lastName email avatar roles');
        await message.populate('recipientId', 'firstName lastName email avatar roles');

        return message;
    }

    /**
     * Update message
     */
    static async updateMessage(messageId: string, userId: string, updates: any) {
        // Only allow updating own sent messages
        const message = await Message.findOneAndUpdate(
            {
                _id: messageId,
                senderId: userId,
                isRead: false // Can only edit unread messages
            },
            {
                ...updates,
                updatedAt: new Date()
            },
            { new: true }
        )
            .populate('senderId', 'firstName lastName email avatar')
            .populate('recipientId', 'firstName lastName email avatar');

        return message;
    }

    /**
     * Delete message
     */
    static async deleteMessage(messageId: string, userId: string) {
        await Message.deleteOne({
            _id: messageId,
            senderId: userId
        });
        return true;
    }

    /**
     * Mark message as read
     */
    static async markAsRead(messageId: string, userId: string) {
        const message = await Message.findOneAndUpdate(
            {
                _id: messageId,
                recipientId: userId
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        return message;
    }

    /**
     * Archive message
     */
    static async archiveMessage(messageId: string, userId: string) {
        const message = await Message.findOneAndUpdate(
            {
                _id: messageId,
                $or: [{ senderId: userId }, { recipientId: userId }]
            },
            {
                isArchived: true,
                archivedAt: new Date()
            },
            { new: true }
        );

        return message;
    }

    /**
     * Bulk mark messages as read
     */
    static async bulkMarkAsRead(messageIds: string[], userId: string) {
        const result = await Message.updateMany(
            {
                _id: { $in: messageIds },
                recipientId: userId
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        return {
            modifiedCount: result.modifiedCount,
            messageIds
        };
    }

    /**
     * Send typing indicator
     */
    static async sendTypingIndicator(conversationId: string, userId: string) {
        // This would typically use WebSocket/Socket.io in real implementation
        // For now, just return true
        return true;
    }
}
