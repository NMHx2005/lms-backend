import express from 'express';
import { authenticate } from '../middleware/auth';
import courseRoutes from './course.routes';
import sectionRoutes from './section.routes';
import lessonRoutes from './lesson.routes';
import userRoutes from './user.routes';
import enrollmentRoutes from './enrollment.routes';
import assignmentRoutes from './assignment.routes';
import announcementRoutes from './announcement.routes';
import courseSubmissionRoutes from './course-submission.routes';
import reviewRoutes from './review.routes';
import paymentRoutes from './payment.routes';
import clientAuthRoutes from './auth.routes';
import courseRatingRoutes from './course-rating.routes';
import analyticsRoutes from './analytics.routes';
import certificateRoutes from './certificate.routes';
import teacherRatingRoutes from './teacher-rating.routes';
import teacherDashboardRoutes from './teacher-dashboard.routes';
import teacherPackageRoutes from './teacher-package.routes';
import wishlistRoutes from './wishlist.routes';
import studyGroupRoutes from './study-group.routes';
import messageRoutes from './message.routes';
import earningsRoutes from './earnings.routes';
import aiToolsRoutes from './ai-tools.routes';
import categoryRoutes from './category.routes';
import refundRoutes from './refund.routes';
import progressRoutes from './progress.routes';
import chatRoutes from './chat.routes';
import { StudyGroupController } from '../controllers/study-group.controller';

const router = express.Router();

// Public routes (no authentication required)
router.use('/courses', courseRoutes);
router.use('/categories', categoryRoutes);

// Public certificate verification (no auth)
import { ClientCertificateController } from '../controllers/certificate.controller';
router.get('/certificates/verify/:certificateId', ClientCertificateController.verifyCertificate);

// Protected routes (authentication required)
router.use('/auth', clientAuthRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/sections', authenticate, sectionRoutes);
router.use('/lessons', authenticate, lessonRoutes);
router.use('/enrollments', authenticate, enrollmentRoutes);
router.use('/assignments', authenticate, assignmentRoutes);
router.use('/announcements', authenticate, announcementRoutes);
router.use('/payments', authenticate, paymentRoutes);
router.use('/teacher-dashboard', teacherDashboardRoutes); // Must be BEFORE /analytics to avoid route conflict
router.use('/analytics', authenticate, analyticsRoutes);
router.use('/certificates', authenticate, certificateRoutes);
router.use('/teacher-ratings', teacherRatingRoutes);
router.use('/course-submissions', courseSubmissionRoutes);
router.use('/ratings', reviewRoutes); // Course reviews with teacher responses
router.use('/course-ratings', courseRatingRoutes); // Student course ratings/reviews
router.use('/teacher-packages', authenticate, teacherPackageRoutes);
router.use('/wishlist', authenticate, wishlistRoutes);
router.use('/refunds', authenticate, refundRoutes);
router.use('/messages', messageRoutes);
router.use('/earnings', earningsRoutes);
router.use('/ai-tools', aiToolsRoutes);
router.use('/progress', authenticate, progressRoutes);
router.use('/chat', authenticate, chatRoutes);

// Protected Study Group endpoints (must be before public routes to avoid conflicts)
router.use('/study-groups', authenticate, studyGroupRoutes);

// Public Study Group endpoints (no auth)
router.get('/study-groups/public', StudyGroupController.listPublic);
router.get('/study-groups/:groupId', StudyGroupController.detail);

// Client dashboard overview
router.get('/dashboard', authenticate, async (req: any, res) => {
  try {
    res.json({
      success: true,
      message: 'Client Dashboard',
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        userRoles: req.user.roles
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
