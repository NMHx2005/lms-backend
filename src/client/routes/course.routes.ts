import { Router } from 'express';
import { ClientCourseController } from '../controllers/course.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { clientCourseValidation } from '../validators/course.validator';
import { Enrollment, Course, User, UserActivityLog } from '../../shared/models';

const router = Router();

// Public routes (no authentication required)
router.get('/', ClientCourseController.getPublishedCourses);
router.get('/categories', ClientCourseController.getCourseCategories);
router.get('/featured', ClientCourseController.getFeaturedCourses);
router.get('/popular', ClientCourseController.getPopularCourses);
router.get('/search', ClientCourseController.searchCourses);
router.get('/instructor/:instructorId', ClientCourseController.getCoursesByInstructor);
router.get('/:id', ClientCourseController.getCourseById);
router.get('/:id/related', ClientCourseController.getRelatedCourses);

// Protected routes (authentication required)
router.get('/:id/content', authenticate, ClientCourseController.getCourseContent);
router.get('/:id/progress', authenticate, ClientCourseController.getCourseProgress);
router.get('/:id/lessons/:lessonId', authenticate, ClientCourseController.getLessonContent);
router.get('/recommendations', authenticate, ClientCourseController.getCourseRecommendations);

// Course enrollment endpoint
router.post('/:id/enroll', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, couponCode, agreeToTerms } = req.body;

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
                error: 'Course not found or not available'
            });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            studentId: req.user.id,
            courseId: id
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                error: 'Already enrolled in this course'
            });
        }

        // Create enrollment
        const enrollment = new Enrollment({
            studentId: req.user.id,
            courseId: id,
            instructorId: course.instructorId,
            enrolledAt: new Date(),
            progress: 0,
            isActive: true,
            isCompleted: false
        });

        await enrollment.save();

        // activity log
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
            data: enrollment
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi đăng ký khóa học'
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
        console.error('Direct enrollment error:', error);
        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra khi đăng ký khóa học'
        });
    }
});

export default router;
