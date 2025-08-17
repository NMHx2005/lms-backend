import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../../admin/middleware/auth';
import { validateRequest } from '../middleware/validation';
import { authValidation } from '../validators/auth.validator';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateRequest(authValidation.register),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  validateRequest(authValidation.login),
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validateRequest(authValidation.changePassword),
  AuthController.changePassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password (admin only)
 * @access  Private (Admin)
 */
router.post(
  '/reset-password',
  authenticate,
  requireAdmin,
  validateRequest(authValidation.resetPassword),
  AuthController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

/**
 * @route   POST /api/auth/validate-token
 * @desc    Validate access token
 * @access  Public
 */
router.post('/validate-token', AuthController.validateToken);

export default router;
