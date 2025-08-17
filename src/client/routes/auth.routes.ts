import express from 'express';
import { ClientAuthController } from '../controllers/auth.controller';
import { authenticate, requireStudent, requireTeacher } from '../middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { clientAuthValidation } from '../validators/auth.validator';

const router = express.Router();

/**
 * @route   GET /api/client/auth/dashboard
 * @desc    Get client dashboard data
 * @access  Private
 */
router.get(
  '/dashboard',
  authenticate,
  ClientAuthController.getDashboardData
);

/**
 * @route   PUT /api/client/auth/profile
 * @desc    Update client profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  validateRequest(clientAuthValidation.updateProfile),
  ClientAuthController.updateProfile
);

/**
 * @route   GET /api/client/auth/enrolled-courses
 * @desc    Get user's enrolled courses
 * @access  Private
 */
router.get(
  '/enrolled-courses',
  authenticate,
  ClientAuthController.getEnrolledCourses
);

/**
 * @route   GET /api/client/auth/courses/:courseId/progress
 * @desc    Get user's course progress
 * @access  Private
 */
router.get(
  '/courses/:courseId/progress',
  authenticate,
  ClientAuthController.getCourseProgress
);

/**
 * @route   GET /api/client/auth/statistics
 * @desc    Get user's learning statistics
 * @access  Private
 */
router.get(
  '/statistics',
  authenticate,
  ClientAuthController.getLearningStatistics
);

/**
 * @route   GET /api/client/auth/activity
 * @desc    Get user's recent activity
 * @access  Private
 */
router.get(
  '/activity',
  authenticate,
  ClientAuthController.getRecentActivity
);

/**
 * @route   GET /api/client/auth/certificates
 * @desc    Get user's certificates
 * @access  Private
 */
router.get(
  '/certificates',
  authenticate,
  ClientAuthController.getCertificates
);

/**
 * @route   GET /api/client/auth/achievements
 * @desc    Get user's achievements
 * @access  Private
 */
router.get(
  '/achievements',
  authenticate,
  ClientAuthController.getAchievements
);

/**
 * @route   GET /api/client/auth/schedule
 * @desc    Get user's study schedule
 * @access  Private
 */
router.get(
  '/schedule',
  authenticate,
  ClientAuthController.getStudySchedule
);

/**
 * @route   GET /api/client/auth/goals
 * @desc    Get user's learning goals
 * @access  Private
 */
router.get(
  '/goals',
  authenticate,
  ClientAuthController.getLearningGoals
);

/**
 * @route   GET /api/client/auth/profile
 * @desc    Get client profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  ClientAuthController.getProfile
);

export default router;
