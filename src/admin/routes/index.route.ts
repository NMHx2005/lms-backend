import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import userRoutes from './user.routes';
import courseRoutes from './course.routes';
import sectionRoutes from './section.routes';
import lessonRoutes from './lesson.routes';
import assignmentRoutes from './assignment.routes';
import submissionRoutes from './submission.routes';
import announcementRoutes from './announcement.routes';
import aiEvaluationRoutes from './ai-evaluation.routes';
import reviewModerationRoutes from './review-moderation.routes';
import analyticsRoutes from './analytics.routes';
import systemRoutes from './system.routes';
import activityRoutes from './activity.routes';
import supportRoutes from './support.routes';
import adminAuthRoutes from './auth.routes';
import certificateRoutes from './certificate.routes';
import teacherManagementRoutes from './teacher-management.routes';
import commentModerationRoutes from './comment-moderation.routes';
import packageRoutes from './package.routes';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticate);
router.use(requireAdmin);

// Admin dashboard routes
router.use('/auth', adminAuthRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/sections', sectionRoutes);
router.use('/lessons', lessonRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/announcements', announcementRoutes);
router.use('/ai-evaluations', aiEvaluationRoutes);
router.use('/reviews', reviewModerationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/system', systemRoutes);
router.use('/support', supportRoutes);
router.use('/activity', activityRoutes);
router.use('/certificates', certificateRoutes);
router.use('/teacher-management', teacherManagementRoutes);
router.use('/comments', commentModerationRoutes);
router.use('/packages-management', packageRoutes);

// Admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Admin Dashboard',
      data: {
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        pendingApprovals: 0
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
