import { Router } from 'express';
import { ClientCourseController } from '../controllers/course.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { clientCourseValidation } from '../validators/course.validator';
import { Enrollment, Course, User, UserActivityLog, Bill, LessonProgress } from '../../shared/models';

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
        let bill;

        // If course has price, create Bill with completed status immediately (like package subscription)
        if (course.price > 0) {
            // Get user payment information from profile
            const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Customer';
            const userEmail = user.email || '';
            const userPhone = user.phone || '';

            // Create Bill with completed status immediately (no checkout needed)
            bill = new Bill({
                studentId: req.user.id,
                courseId: id,
                amount: course.price,
                currency: 'VND',
                purpose: 'course_purchase',
                status: 'completed', // Completed immediately, like package subscription
                paymentMethod: paymentMethod as 'stripe' | 'paypal' | 'bank_transfer' | 'cash' | 'vnpay',
                description: `Payment for course: ${course.title}`,
                paidAt: new Date(),
                transactionId: `COURSE_${Date.now()}_${req.user.id}_${id}`,
                metadata: {
                    userInfo: {
                        fullName: userFullName,
                        email: userEmail,
                        phone: userPhone
                    },
                    courseTitle: course.title,
                    couponCode: couponCode || null,
                    noCheckout: true // Flag to indicate no separate checkout process
                }
            });
            await bill.save();

        }

        // Create enrollment (reactivate if exists, or create new)
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

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in course',
            data: {
                enrollment,
                bill: bill ? {
                    id: bill._id,
                    amount: bill.amount,
                    status: bill.status
                } : null
            }
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
