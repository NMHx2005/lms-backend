import { RefundRequest } from '../../shared/models';

export class AdminRefundService {
    /**
     * Get all refund requests (admin view only - read-only)
     */
    static async getAllRefundRequests(filters?: {
        status?: string;
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const query: any = {};

        if (filters?.status) {
            query.status = filters.status;
        }

        // Search by course title or student name
        if (filters?.search) {
            // This would require text search or aggregation
            // For now, skip search functionality
        }

        const [refunds, total] = await Promise.all([
            RefundRequest.find(query)
                .populate('courseId', 'title thumbnail')
                .populate('studentId', 'name firstName lastName email')
                .populate('teacherId', 'name firstName lastName email')
                .populate('processedBy', 'name firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            RefundRequest.countDocuments(query)
        ]);

        return {
            refunds,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get refund request details (admin view only)
     */
    static async getRefundDetails(refundId: string) {
        const refund = await RefundRequest.findById(refundId)
            .populate('courseId', 'title thumbnail description price')
            .populate('studentId', 'name firstName lastName email avatar')
            .populate('teacherId', 'name firstName lastName email avatar')
            .populate('enrollmentId', 'enrolledAt progress isActive')
            .populate('billId', 'amount transactionId paidAt paymentMethod')
            .populate('processedBy', 'name firstName lastName');

        if (!refund) {
            throw new Error('Refund request not found');
        }

        return refund;
    }

    /**
     * Get refund statistics (admin analytics)
     */
    static async getRefundStats() {
        const [
            totalRefunds,
            pendingRefunds,
            approvedRefunds,
            rejectedRefunds,
            cancelledRefunds,
            totalRefundedAmount
        ] = await Promise.all([
            RefundRequest.countDocuments(),
            RefundRequest.countDocuments({ status: 'pending' }),
            RefundRequest.countDocuments({ status: 'approved' }),
            RefundRequest.countDocuments({ status: 'rejected' }),
            RefundRequest.countDocuments({ status: 'cancelled' }),
            RefundRequest.aggregate([
                { $match: { status: 'approved' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const refundedAmount = totalRefundedAmount[0]?.total || 0;

        return {
            totalRefunds,
            pendingRefunds,
            approvedRefunds,
            rejectedRefunds,
            cancelledRefunds,
            totalRefundedAmount: refundedAmount,
            averageRefundAmount: approvedRefunds > 0 ? refundedAmount / approvedRefunds : 0
        };
    }

    /**
     * Add admin note to refund request (view-only, no approval power)
     */
    static async addAdminNote(refundId: string, adminId: string, note: string) {
        const refund = await RefundRequest.findById(refundId);

        if (!refund) {
            throw new Error('Refund request not found');
        }

        refund.adminNotes = note;
        await refund.save();

        return refund;
    }
}

