import { Request, Response } from 'express';
import { SupportTicket, FAQ } from '../../shared/models/core';

// ========== SUPPORT TICKET OPERATIONS ==========

export const getSupportTickets = async (req: Request, res: Response) => {
    try {
        const {
            search,
            status,
            priority,
            category,
            assignedTo,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filters: any = {};

        if (search) {
            filters.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } },
                { ticketNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            filters.status = status;
        }

        if (priority && priority !== 'all') {
            filters.priority = priority;
        }

        if (category && category !== 'all') {
            filters.category = category;
        }

        if (assignedTo) {
            if (assignedTo === 'unassigned') {
                filters.assignedTo = { $exists: false };
            } else {
                filters.assignedTo = assignedTo;
            }
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Execute query
        const [tickets, total] = await Promise.all([
            SupportTicket.find(filters)
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            SupportTicket.countDocuments(filters)
        ]);

        res.json({
            success: true,
            data: {
                data: tickets,
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error('Error getting support tickets:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi lấy danh sách tickets',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const getSupportTicketById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Ticket không tồn tại',
                    code: 'TICKET_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error: any) {
        console.error('Error getting support ticket by id:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi lấy chi tiết ticket',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const assignTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { assignedTo, note } = req.body;

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Ticket không tồn tại',
                    code: 'TICKET_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        // Update assignment
        ticket.assignedTo = assignedTo;
        ticket.assignedToName = 'Admin User'; // This should come from user service

        // Add note if provided
        if (note) {
            ticket.notes.push({
                note,
                isInternal: true,
                addedBy: (req.user as any)?._id || 'system',
                addedAt: new Date()
            });
        }

        await ticket.save();

        res.json({
            success: true,
            data: ticket
        });
    } catch (error: any) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi phân công ticket',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Ticket không tồn tại',
                    code: 'TICKET_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        // Update status
        ticket.status = status;
        if (status === 'resolved' || status === 'closed') {
            ticket.lastResponseAt = new Date();
        }

        // Add note if provided
        if (note) {
            ticket.notes.push({
                note,
                isInternal: true,
                addedBy: (req.user as any)?._id || 'system',
                addedAt: new Date()
            });
        }

        await ticket.save();

        res.json({
            success: true,
            data: ticket
        });
    } catch (error: any) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi cập nhật trạng thái ticket',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const addTicketNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { note, isInternal = true } = req.body;

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Ticket không tồn tại',
                    code: 'TICKET_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        // Add note
        ticket.notes.push({
            note,
            isInternal,
            addedBy: (req.user as any)?._id || 'system',
            addedAt: new Date()
        });

        ticket.responseCount += 1;
        ticket.lastResponseAt = new Date();

        await ticket.save();

        res.json({
            success: true,
            data: { message: 'Thêm ghi chú thành công' }
        });
    } catch (error: any) {
        console.error('Error adding ticket note:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi thêm ghi chú',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

// ========== SUPPORT STAFF OPERATIONS ==========

export const getSupportStaff = async (req: Request, res: Response) => {
    try {
        // Mock data for now - this should come from user service with role filtering
        const staff = [
            {
                _id: 'admin-1',
                name: 'Admin User',
                email: 'admin@lms.com',
                role: 'admin',
                isActive: true,
                ticketCount: 0,
                averageResponseTime: 0
            },
            {
                _id: 'support-1',
                name: 'Support Agent',
                email: 'support@lms.com',
                role: 'support_agent',
                isActive: true,
                ticketCount: 0,
                averageResponseTime: 0
            }
        ];

        res.json({
            success: true,
            data: staff
        });
    } catch (error: any) {
        console.error('Error getting support staff:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi lấy danh sách nhân viên hỗ trợ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

// ========== SUPPORT STATISTICS ==========

export const getSupportStats = async (req: Request, res: Response) => {
    try {
        const [
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            closedTickets,
            ticketsByCategory,
            ticketsByPriority
        ] = await Promise.all([
            SupportTicket.countDocuments(),
            SupportTicket.countDocuments({ status: 'open' }),
            SupportTicket.countDocuments({ status: 'in_progress' }),
            SupportTicket.countDocuments({ status: 'resolved' }),
            SupportTicket.countDocuments({ status: 'closed' }),
            SupportTicket.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            SupportTicket.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        const stats = {
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            closedTickets,
            averageResponseTime: 0, // Calculate based on business logic
            averageResolutionTime: 0, // Calculate based on business logic
            ticketsByCategory: ticketsByCategory.map(item => ({
                category: item._id,
                count: item.count
            })),
            ticketsByPriority: ticketsByPriority.map(item => ({
                priority: item._id,
                count: item.count
            }))
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Error getting support stats:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi lấy thống kê hỗ trợ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

// ========== FAQ OPERATIONS ==========

export const getFAQs = async (req: Request, res: Response) => {
    try {
        const faqs = await FAQ.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: faqs
        });
    } catch (error: any) {
        console.error('Error getting FAQs:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi lấy danh sách FAQ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const getFAQById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'FAQ không tồn tại',
                    code: 'FAQ_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        res.json({
            success: true,
            data: faq
        });
    } catch (error: any) {
        console.error('Error getting FAQ by id:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi lấy chi tiết FAQ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const createFAQ = async (req: Request, res: Response) => {
    try {
        const { question, answer, category, isPublished = false } = req.body;

        const faq = new FAQ({
            question,
            answer,
            category,
            isPublished
        });

        await faq.save();

        res.status(201).json({
            success: true,
            data: faq
        });
    } catch (error: any) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi tạo FAQ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const updateFAQ = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const faq = await FAQ.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'FAQ không tồn tại',
                    code: 'FAQ_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        res.json({
            success: true,
            data: faq
        });
    } catch (error: any) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi cập nhật FAQ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const deleteFAQ = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findByIdAndDelete(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'FAQ không tồn tại',
                    code: 'FAQ_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        res.json({
            success: true,
            data: { message: 'Xóa FAQ thành công' }
        });
    } catch (error: any) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi xóa FAQ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};

export const toggleFAQStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'FAQ không tồn tại',
                    code: 'FAQ_NOT_FOUND',
                    statusCode: 404,
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }

        faq.isPublished = !faq.isPublished;
        await faq.save();

        res.json({
            success: true,
            data: faq
        });
    } catch (error: any) {
        console.error('Error toggling FAQ status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Lỗi khi cập nhật trạng thái FAQ',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                timestamp: new Date().toISOString(),
                path: req.path,
                requestId: req.headers['x-request-id'] || 'unknown'
            }
        });
    }
};
