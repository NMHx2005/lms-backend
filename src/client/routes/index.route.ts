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
import courseRatingRoutes from './course-rating.routes';
import teacherResponseRoutes from './teacher-response.routes';
import paymentRoutes from './payment.routes';
import clientAuthRoutes from './auth.routes';
import analyticsRoutes from './analytics.routes';
import certificateRoutes from './certificate.routes';
import teacherRatingRoutes from './teacher-rating.routes';
import teacherDashboardRoutes from './teacher-dashboard.routes';

const router = express.Router();

// Public routes (no authentication required)
router.use('/courses', courseRoutes);

// Protected routes (authentication required)
router.use('/auth', clientAuthRoutes);
router.use('/user', authenticate, userRoutes);
router.use('/sections', authenticate, sectionRoutes);
router.use('/lessons', authenticate, lessonRoutes);
router.use('/enrollments', authenticate, enrollmentRoutes);
router.use('/assignments', authenticate, assignmentRoutes);
router.use('/announcements', authenticate, announcementRoutes);
router.use('/payments', authenticate, paymentRoutes);
router.use('/analytics', authenticate, analyticsRoutes);
router.use('/certificates', authenticate, certificateRoutes);
router.use('/teacher-ratings', teacherRatingRoutes);
router.use('/teacher-dashboard', teacherDashboardRoutes);
router.use('/course-submissions', courseSubmissionRoutes);
router.use('/ratings', courseRatingRoutes);
router.use('/teacher-responses', teacherResponseRoutes);

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
