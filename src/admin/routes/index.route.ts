import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import userRoutes from './user.routes';
import courseRoutes from './course.routes';
import sectionRoutes from './section.routes';
import lessonRoutes from './lesson.routes';
import assignmentRoutes from './assignment.routes';
import submissionRoutes from './submission.routes';
import analyticsRoutes from './analytics.routes';
import systemRoutes from './system.routes';
import activityRoutes from './activity.routes';
import supportRoutes from './support.routes';
import adminAuthRoutes from './auth.routes';

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
router.use('/analytics', analyticsRoutes);
router.use('/system', systemRoutes);
router.use('/support', supportRoutes);
router.use('/activity', activityRoutes);

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
