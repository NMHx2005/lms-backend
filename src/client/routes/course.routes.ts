import { Router } from 'express';
import { ClientCourseController } from '../controllers/course.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { clientCourseValidation } from '../validators/course.validator';
import { Enrollment, Course, User, UserActivityLog, Bill, LessonProgress, IBill } from '../../shared/models';

const router = Router();

// Teacher routes (for course management) - MUST be before /:id routes
router.get('/my-courses', authenticate, ClientCourseController.getTeacherCourses);
router.get('/my-courses/:id', authenticate, ClientCourseController.getTeacherCourseById);
router.get('/stats', authenticate, ClientCourseController.getTeacherCourseStats);
router.post('/', authenticate, ClientCourseController.createCourse);

// Public routes (no authentication required)
router.get('/', ClientCourseController.getPublishedCourses);
router.get('/categories', ClientCourseController.getCourseCategories);
router.get('/featured', ClientCourseController.getFeaturedCourses);
router.get('/popular', ClientCourseController.getPopularCourses);
router.get('/search', ClientCourseController.searchCourses);
router.get('/filter-options', ClientCourseController.getFilterOptions);
router.get('/popular-tags', ClientCourseController.getPopularTags);
router.get('/recommendations', authenticate, ClientCourseController.getCourseRecommendations);
router.get('/instructor/:instructorId', ClientCourseController.getCoursesByInstructor);

// Dynamic ID routes - MUST be after specific routes
// Note: Using optionalAuth to allow both authenticated users (can see own draft courses) and guests (can see published courses)
router.get('/:id', optionalAuth, ClientCourseController.getCourseById);
router.get('/:id/related', ClientCourseController.getRelatedCourses);
router.get('/:id/content', authenticate, ClientCourseController.getCourseContent);
router.get('/:id/progress', authenticate, ClientCourseController.getCourseProgress);
router.get('/:id/lessons/:lessonId', authenticate, ClientCourseController.getLessonContent);
router.put('/:id', authenticate, ClientCourseController.updateCourse);
router.delete('/:id', authenticate, ClientCourseController.deleteCourse);
router.patch('/:id/status', authenticate, ClientCourseController.updateCourseStatus);

// Course enrollment endpoint - Similar to package subscription, create Bill and Enrollment together
router.post('/:id/enroll', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod = 'bank_transfer', couponCode, agreeToTerms } = req.body;

        if (!agreeToTerms) {
            return res.status(400).json({
                success: false,
                error: 'Bạn phải đồng ý với điều khoản để đăng ký khóa học'
            });
        }

        // Get user details for payment information
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if course exists and is published
        const course = await Course.findOne({
            _id: id,
            isPublished: true,
            isApproved: true
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found or not available'
            });
        }

        // Check if already enrolled (only active enrollments)
        const existingEnrollment = await Enrollment.findOne({
            studentId: req.user.id,
            courseId: id,
            isActive: true
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                error: 'Already enrolled in this course'
            });
        }

        // Check if there's an inactive enrollment (refunded/cancelled)
        const inactiveEnrollment = await Enrollment.findOne({
            studentId: req.user.id,
            courseId: id,
            isActive: false
        });

        let enrollment;
        let bill: IBill | null = null;

        // If course has price, MUST use VNPAY payment (giống teacher package - không tự động tạo enrollment)
        if (course.price > 0) {
            // Always use VNPAY for paid courses (giống teacher package)
            // Generate unique order ID for VNPay
            const vnpayOrderId = `VNPAY_${Date.now()}_${req.user.id}_${id}`;

            // Get user payment information from profile
            const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Customer';
            const userEmail = user.email || '';
            const userPhone = user.phone || '';

            // Create Bill with pending status for VNPay payment (giống teacher package)
            bill = new Bill({
                studentId: req.user.id,
                courseId: id,
                amount: course.price,
                currency: 'VND',
                purpose: 'course_purchase',
                status: 'pending', // Pending until VNPAY payment succeeds
                paymentMethod: 'vnpay',
                description: `Payment for course: ${course.title}`,
                metadata: {
                    vnpayOrderId,
                    userInfo: {
                        fullName: userFullName,
                        email: userEmail,
                        phone: userPhone
                    },
                    courseTitle: course.title,
                    couponCode: couponCode || null
                }
            });
            await bill.save();

            // Generate VNPay payment URL using shared service
            // Return URL should point to backend handler (like teacher package), which will then redirect to frontend
            // IMPORTANT: Use request host to ensure correct URL (localhost in dev, production in prod)
            const protocol = req.protocol || (req.secure ? 'https' : 'http');
            const host = req.get('host') || 'localhost:5000';
            const backendUrl = `${protocol}://${host}`;

            // For IPN, use environment variable if set (for production), otherwise use request host
            const ipnUrl = process.env.VNPAY_IPN_URL ||
                (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/client/payments/vnpay/ipn` :
                    `${backendUrl}/api/client/payments/vnpay/ipn`);

            const returnUrl = `${backendUrl}/api/client/payments/vnpay/return`;

            console.log('VNPay URLs configured:', {
                backendUrl,
                returnUrl,
                ipnUrl,
                requestHost: req.get('host'),
                requestProtocol: req.protocol,
                nodeEnv: process.env.NODE_ENV,
                envBackendUrl: process.env.BACKEND_URL
            });

            // Get client IP address
            const getClientIp = (req: any): string => {
                return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                    req.headers['x-real-ip'] ||
                    req.connection?.remoteAddress ||
                    req.socket?.remoteAddress ||
                    req.ip ||
                    '127.0.0.1';
            };
            const clientIp = getClientIp(req);

            const { buildVnpayPaymentUrl } = require('../../shared/services/payments/vnpay.service');
            const paymentUrl = buildVnpayPaymentUrl({
                orderId: vnpayOrderId,
                amount: course.price,
                orderInfo: `Thanh toan khoa hoc: ${course.title}`,
                ipAddr: clientIp,
                returnUrl: returnUrl,
                ipnUrl: ipnUrl,
                email: userEmail,
                name: userFullName,
                expireMinutes: 15
            });

            console.log('Course payment URL created:', {
                orderId: vnpayOrderId,
                paymentUrl,
                amount: course.price,
                returnUrl
            });

            // Return payment URL for frontend to redirect (giống teacher package)
            return res.json({
                success: true,
                message: 'VNPay payment initiated successfully',
                data: {
                    paymentUrl,
                    billId: bill._id,
                    orderId: vnpayOrderId,
                    amount: course.price,
                    paymentMethod: 'vnpay',
                    status: 'pending'
                }
            });
        }

        // Only create enrollment for FREE courses (paid courses will create enrollment after VNPAY payment succeeds via IPN)
        // Create enrollment (reactivate if exists, or create new) - ONLY for free courses
        if (inactiveEnrollment) {
            // Reactivate the old enrollment instead of creating a new one
            inactiveEnrollment.isActive = true;
            inactiveEnrollment.enrolledAt = new Date();
            inactiveEnrollment.progress = 0;
            inactiveEnrollment.isCompleted = false;
            inactiveEnrollment.completedAt = undefined;
            inactiveEnrollment.certificateIssued = false;
            inactiveEnrollment.certificateUrl = undefined;
            inactiveEnrollment.currentLesson = undefined;
            inactiveEnrollment.currentSection = undefined;
            inactiveEnrollment.totalTimeSpent = 0;
            enrollment = await inactiveEnrollment.save();

            // Delete all LessonProgress records for this enrollment to reset progress
            await LessonProgress.deleteMany({
                studentId: req.user.id,
                courseId: id
            });

        } else {
            // Create new enrollment
            enrollment = new Enrollment({
                studentId: req.user.id,
                courseId: id,
                instructorId: course.instructorId,
                enrolledAt: new Date(),
                progress: 0,
                isActive: true,
                isCompleted: false
            });
            await enrollment.save();

        }

        // Activity log
        UserActivityLog.create({
            userId: req.user.id,
            action: 'course_enroll',
            resource: 'enrollment',
            resourceId: enrollment._id,
            courseId: id
        });

        // Update course enrollment count
        await Course.findByIdAndUpdate(id, {
            $inc: { totalStudents: 1 },
            $push: { enrolledStudents: req.user.id }
        });

        // Update user stats
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'stats.totalCoursesEnrolled': 1 }
        });

        // Prepare response data
        // Note: For free courses, bill is always null (paid courses return early with VNPAY URL)
        const responseData: {
            enrollment: any;
            bill: { id: any; amount: number; status: string } | null;
        } = {
            enrollment,
            bill: null // Free courses don't have bills
        };

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in course',
            data: responseData
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Có lỗi xảy ra khi đăng ký khóa học'
        });
    }
});

// Direct enrollment (for contact teacher method)
router.post('/:id/enroll-direct', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, agreeToTerms } = req.body;

        if (!agreeToTerms) {
            return res.status(400).json({
                success: false,
                error: 'Bạn phải đồng ý với điều khoản để đăng ký khóa học'
            });
        }

        // Check if course exists and is published
        const course = await Course.findOne({
            _id: id,
            isPublished: true,
            isApproved: true
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Khóa học không tồn tại hoặc chưa được phê duyệt'
            });
        }

        // Check if user is already enrolled
        const existingEnrollment = await Enrollment.findOne({
            studentId: req.user.id,
            courseId: id
        });

        if (existingEnrollment) {
            // Return success instead of error when already enrolled
            return res.json({
                success: true,
                message: 'Bạn đã đăng ký khóa học này rồi!',
                data: {
                    alreadyEnrolled: true,
                    enrollmentId: existingEnrollment._id,
                    enrolledAt: existingEnrollment.enrolledAt
                }
            });
        }

        // Create enrollment with pending payment status
        const enrollment = new Enrollment({
            studentId: req.user.id,
            courseId: id,
            instructorId: course.instructorId,
            enrolledAt: new Date(),
            progress: 0,
            isActive: true,
            isCompleted: false,
            paymentMethod: paymentMethod || 'contact_teacher',
            paymentStatus: 'pending',
            notes: paymentMethod === 'contact_teacher' ? 'Liên hệ giáo viên để thanh toán' : undefined
        });

        await enrollment.save();

        // Update course enrollment count
        await Course.findByIdAndUpdate(id, {
            $inc: { totalStudents: 1 }
        });

        // Update user stats
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'stats.totalCoursesEnrolled': 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký khóa học thành công! Vui lòng liên hệ giáo viên để hoàn tất thanh toán.',
            data: enrollment
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi đăng ký khóa học'
        });
    }
});

export default router;
