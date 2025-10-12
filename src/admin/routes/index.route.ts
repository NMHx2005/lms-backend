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
import performanceRoutes from './performance.routes';
import adminAuthRoutes from './auth.routes';
import certificateRoutes from './certificate.routes';
import teacherManagementRoutes from './teacher-management.routes';
import commentModerationRoutes from './comment-moderation.routes';
import packageRoutes from './package.routes';
import wishlistRoutes from './wishlist.routes';
import billsRoutes from './bills.routes';
import categoryRoutes from './category.routes';
import backupRoutes from './backup.routes';
import refundRoutes from './refund.routes';
import systemSettingsRoutes from './system-settings.routes';
import { AnalyticsService } from '../services/analytics.service';

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
router.use('/wishlist', wishlistRoutes);
router.use('/bills', billsRoutes);
router.use('/categories', categoryRoutes);
router.use('/refunds', refundRoutes);
router.use('/system-settings', systemSettingsRoutes);
router.use('/support', supportRoutes);
router.use('/', performanceRoutes);
router.use('/', backupRoutes);

// Admin dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await AnalyticsService.getDashboardAnalytics();

    res.json({
      success: true,
      data: {
        totalUsers: dashboardData.totalUsers,
        totalCourses: dashboardData.totalCourses,
        totalEnrollments: dashboardData.totalEnrollments,
        totalRevenue: dashboardData.totalRevenue,
        pendingCourses: dashboardData.pendingCourses,
        pendingRefunds: 0, // TODO: Implement pending refunds count
        activeUsers: dashboardData.activeUsers,
        newUsersToday: 0, // TODO: Implement new users today count
        systemHealth: 'healthy',
        lastBackup: new Date().toISOString(),
        serverUptime: '99.9%'
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
