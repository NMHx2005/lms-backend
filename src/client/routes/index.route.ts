import express from 'express';
import { authenticate } from '../middleware/auth';
import courseRoutes from './course.routes';
import sectionRoutes from './section.routes';
import lessonRoutes from './lesson.routes';
import userRoutes from './user.routes';
import enrollmentRoutes from './enrollment.routes';
import assignmentRoutes from './assignment.routes';
import paymentRoutes from './payment.routes';
import clientAuthRoutes from './auth.routes';
import analyticsRoutes from './analytics.routes';

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
router.use('/payments', authenticate, paymentRoutes);
router.use('/analytics', authenticate, analyticsRoutes);

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
