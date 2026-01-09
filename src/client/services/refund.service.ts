import { RefundRequest, Enrollment, Payment, Course, Bill } from '../../shared/models';
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

        enrollments.forEach((enrollment, index) => {
            const course = enrollment.courseId as any;
        });

        // Check if enrollment has completed payment
        const eligibleCourses = [];

        for (const enrollment of enrollments) {
            const course = enrollment.courseId as any;


            // Only eligible if has paid course (price > 0)
            if (course.price === 0) {
                console.log(`  ❌ Skipped: Free course (price = 0)`);
                continue;
            }

            // For paid courses, we assume payment is completed if user is enrolled
            // (In real system, enrollment only happens after successful payment)

            // Check if already has pending refund request
            const existingRefund = await RefundRequest.findOne({
                enrollmentId: enrollment._id,
                status: 'pending'
            });


            // Only show courses without pending refund
            if (!existingRefund) {
                const instructor = enrollment.instructorId as any;

                const eligibleCourse = {
                    enrollmentId: enrollment._id,
                    courseId: course._id,
                    courseTitle: course.title,
                    courseThumbnail: course.thumbnail,
                    amount: course.price, // Use course price as refund amount
                    enrolledAt: enrollment.enrolledAt,
                    progress: enrollment.progress,
                    teacherId: course.instructorId,
                    teacherName: instructor?.name || `${instructor?.firstName || ''} ${instructor?.lastName || ''}`.trim()
                };

                eligibleCourses.push(eligibleCourse);
            } else {

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

        // For paid courses, we assume payment is completed if user is enrolled
        // (In real system, enrollment only happens after successful payment)
        const course = enrollment.courseId as any;
        if (course.price === 0) {
            throw new Error('Free courses are not eligible for refund');
        }

        // Find the associated Bill for this enrollment
        // Bill should have matching studentId, courseId, status 'completed', and purpose 'course_purchase'
        const bill = await Bill.findOne({
            studentId: userId,
            courseId: enrollment.courseId,
            status: 'completed',
            purpose: 'course_purchase'
        }).sort({ createdAt: -1 }); // Get the most recent completed bill

        if (!bill) {
            // If no bill found, create a new bill for this refund (for backward compatibility)
            // This handles cases where enrollment exists but bill wasn't properly created
            console.warn(`No Bill found for enrollment ${data.enrollmentId}. Creating a new bill.`);
            const newBill = new Bill({
                studentId: userId,
                courseId: enrollment.courseId,
                amount: course.price,
                currency: 'VND',
                purpose: 'course_purchase',
                status: 'completed',
                paymentMethod: 'bank_transfer', // Default to bank_transfer if payment method unknown
                description: `Payment for course: ${course.title}`,
                paidAt: enrollment.enrolledAt || new Date()
            });
            await newBill.save();

            const refund = new RefundRequest({
                studentId: userId,
                teacherId: course.instructorId,
                courseId: enrollment.courseId,
                enrollmentId: data.enrollmentId,
                billId: newBill._id,
                amount: course.price,
                reason: data.reason,
                description: data.description,
                contactMethod: data.contactMethod,
                status: 'pending',
                requestedAt: new Date()
            });

            await refund.save();
            return refund;
        }

        // Check if bill is already refunded
        if (bill.status === 'refunded') {
            throw new Error('This course has already been refunded');
        }

        // Create refund request with the actual bill ID
        const refund = new RefundRequest({
            studentId: userId,
            teacherId: course.instructorId,
            courseId: enrollment.courseId,
            enrollmentId: data.enrollmentId,
            billId: bill._id, // Use actual bill ID
            amount: bill.amount || course.price, // Use bill amount or fallback to course price
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
            .populate('billId', 'amount transactionId createdAt')
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

