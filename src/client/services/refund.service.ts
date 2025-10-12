import { RefundRequest, Enrollment, Bill, Course } from '../../shared/models';
import { IRefundRequest } from '../../shared/models/core/RefundRequest';
import mongoose from 'mongoose';

export class ClientRefundService {
    /**
     * Get eligible courses for refund (enrolled with completed payment)
     */
    static async getEligibleCourses(userId: string) {
        // Get active enrollments
        const enrollments = await Enrollment.find({
            studentId: userId,
            isActive: true
        })
            .populate('courseId', 'title thumbnail price instructorId')
            .populate('instructorId', 'name firstName lastName email')
            .sort({ enrolledAt: -1 });

        // Check if enrollment has completed payment (has bill)
        const eligibleCourses = [];

        for (const enrollment of enrollments) {
            // Check if has completed bill for this course
            const bill = await Bill.findOne({
                studentId: userId,
                courseId: enrollment.courseId,
                status: 'completed'
            });

            // Only eligible if has paid bill
            if (!bill) continue;

            // Check if already has pending refund request
            const existingRefund = await RefundRequest.findOne({
                enrollmentId: enrollment._id,
                status: 'pending'
            });

            // Only show courses without pending refund
            if (!existingRefund) {
                const course = enrollment.courseId as any;
                const instructor = enrollment.instructorId as any;

                eligibleCourses.push({
                    enrollmentId: enrollment._id,
                    courseId: course._id,
                    courseTitle: course.title,
                    courseThumbnail: course.thumbnail,
                    amount: bill.amount, // Use actual paid amount from bill
                    enrolledAt: enrollment.enrolledAt,
                    progress: enrollment.progress,
                    teacherId: course.instructorId,
                    teacherName: instructor?.name || `${instructor?.firstName || ''} ${instructor?.lastName || ''}`.trim()
                });
            }
        }

        return eligibleCourses;
    }

    /**
     * Create refund request
     */
    static async createRefundRequest(userId: string, data: {
        enrollmentId: string;
        reason: string;
        description: string;
        contactMethod: {
            type: 'email' | 'phone' | 'both';
            email?: string;
            phone?: string;
        };
    }): Promise<IRefundRequest> {
        // Get enrollment details
        const enrollment = await Enrollment.findOne({
            _id: data.enrollmentId,
            studentId: userId,
            isActive: true
        }).populate('courseId', 'title instructorId price');

        if (!enrollment) {
            throw new Error('Enrollment not found or not eligible for refund');
        }

        // Check if already has pending refund
        const existingRefund = await RefundRequest.findOne({
            enrollmentId: data.enrollmentId,
            status: 'pending'
        });

        if (existingRefund) {
            throw new Error('A pending refund request already exists for this enrollment');
        }

        // Get bill
        const bill = await Bill.findOne({
            studentId: userId,
            courseId: enrollment.courseId,
            status: 'completed'
        }).sort({ paidAt: -1 });

        if (!bill) {
            throw new Error('Payment bill not found');
        }

        const course = enrollment.courseId as any;

        // Create refund request
        const refund = new RefundRequest({
            studentId: userId,
            teacherId: course.instructorId,
            courseId: enrollment.courseId,
            enrollmentId: data.enrollmentId,
            billId: bill._id,
            amount: course.price || bill.amount,
            reason: data.reason,
            description: data.description,
            contactMethod: data.contactMethod,
            status: 'pending',
            requestedAt: new Date()
        });

        await refund.save();
        return refund;
    }

    /**
     * Get user's refund requests
     */
    static async getRefundRequests(userId: string, filters?: {
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const query: any = { studentId: userId };
        if (filters?.status) {
            query.status = filters.status;
        }

        const [refunds, total] = await Promise.all([
            RefundRequest.find(query)
                .populate('courseId', 'title thumbnail')
                .populate('teacherId', 'name firstName lastName email')
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
     * Get refund request details
     */
    static async getRefundDetails(refundId: string, userId: string) {
        const refund = await RefundRequest.findOne({
            _id: refundId,
            studentId: userId
        })
            .populate('courseId', 'title thumbnail description')
            .populate('teacherId', 'name firstName lastName email avatar')
            .populate('billId', 'amount transactionId paidAt')
            .populate('processedBy', 'name firstName lastName');

        if (!refund) {
            throw new Error('Refund request not found');
        }

        return refund;
    }

    /**
     * Cancel refund request (student only)
     */
    static async cancelRefundRequest(refundId: string, userId: string) {
        const refund = await RefundRequest.findOne({
            _id: refundId,
            studentId: userId,
            status: 'pending'
        });

        if (!refund) {
            throw new Error('Refund request not found or cannot be cancelled');
        }

        await refund.cancel();
        return refund;
    }

    /**
     * Get teacher's refund requests (for their courses)
     */
    static async getTeacherRefundRequests(teacherId: string, filters?: {
        status?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const query: any = { teacherId };
        if (filters?.status) {
            query.status = filters.status;
        }

        const [refunds, total] = await Promise.all([
            RefundRequest.find(query)
                .populate('courseId', 'title thumbnail')
                .populate('studentId', 'name firstName lastName email avatar')
                .populate('enrollmentId', 'enrolledAt progress')
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
     * Approve refund (teacher only)
     */
    static async approveRefund(refundId: string, teacherId: string, data: {
        notes?: string;
        refundMethod?: string;
    }) {
        const refund = await RefundRequest.findOne({
            _id: refundId,
            teacherId,
            status: 'pending'
        });

        if (!refund) {
            throw new Error('Refund request not found or already processed');
        }

        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
        await refund.approve(teacherObjectId, data.notes, data.refundMethod);

        return refund;
    }

    /**
     * Reject refund (teacher only)
     */
    static async rejectRefund(refundId: string, teacherId: string, data: {
        reason: string;
        notes?: string;
    }) {
        const refund = await RefundRequest.findOne({
            _id: refundId,
            teacherId,
            status: 'pending'
        });

        if (!refund) {
            throw new Error('Refund request not found or already processed');
        }

        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
        await refund.reject(teacherObjectId, data.reason, data.notes);

        return refund;
    }
}

