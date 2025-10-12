import { Request, Response } from 'express';
import { AdminRefundService } from '../services/refund.service';

export class AdminRefundController {
    /**
     * Get all refund requests (admin view only - read-only)
     */
    static async getAllRefundRequests(req: Request, res: Response) {
        try {
            const { status, page, limit, search } = req.query;

            const result = await AdminRefundService.getAllRefundRequests({
                status: status as string,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                search: search as string
            });

            res.json({
                success: true,
                data: result.refunds,
                pagination: result.pagination
            });
        } catch (error: any) {
            console.error('Get all refund requests error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch refund requests'
            });
        }
    }

    /**
     * Get refund request details (admin view)
     */
    static async getRefundDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const refund = await AdminRefundService.getRefundDetails(id);

            res.json({
                success: true,
                data: refund
            });
        } catch (error: any) {
            console.error('Get refund details error:', error);
            res.status(error.message.includes('not found') ? 404 : 500).json({
                success: false,
                error: error.message || 'Failed to fetch refund details'
            });
        }
    }

    /**
     * Get refund statistics
     */
    static async getRefundStats(req: Request, res: Response) {
        try {
            const stats = await AdminRefundService.getRefundStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            console.error('Get refund stats error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch refund statistics'
            });
        }
    }

    /**
     * Add admin note (view-only, no approval power)
     */
    static async addAdminNote(req: Request, res: Response) {
        try {
            const adminId = (req as any).user?.id || (req as any).user?._id;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const { id } = req.params;
            const { note } = req.body;

            if (!note) {
                return res.status(400).json({
                    success: false,
                    error: 'Note is required'
                });
            }

            const refund = await AdminRefundService.addAdminNote(id, adminId, note);

            res.json({
                success: true,
                message: 'Admin note added successfully',
                data: refund
            });
        } catch (error: any) {
            console.error('Add admin note error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to add admin note'
            });
        }
    }
}

