import express from 'express';
import { AdminAuthController } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { adminAuthValidation } from '../validators/auth.validator';

const router = express.Router();

/**
 * @route   POST /api/admin/auth/users
 * @desc    Create a new user (admin only)
 * @access  Private (Admin)
 */
router.post(
  '/users',
  authenticate,
  requireAdmin,
  validateRequest(adminAuthValidation.createUser),
  AdminAuthController.createUser
);

/**
 * @route   GET /api/admin/auth/users
 * @desc    Get all users with pagination and filters (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/users',
  authenticate,
  requireAdmin,
  AdminAuthController.getUsers
);

/**
 * @route   GET /api/admin/auth/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/users/:id',
  authenticate,
  requireAdmin,
  AdminAuthController.getUserById
);

/**
 * @route   PUT /api/admin/auth/users/:id
 * @desc    Update user by ID (admin only)
 * @access  Private (Admin)
 */
router.put(
  '/users/:id',
  authenticate,
  requireAdmin,
  validateRequest(adminAuthValidation.updateUser),
  AdminAuthController.updateUser
);

/**
 * @route   DELETE /api/admin/auth/users/:id
 * @desc    Delete user by ID (admin only)
 * @access  Private (Admin)
 */
router.delete(
  '/users/:id',
  authenticate,
  requireAdmin,
  AdminAuthController.deleteUser
);

/**
 * @route   PATCH /api/admin/auth/users/:id/activate
 * @desc    Activate user (admin only)
 * @access  Private (Admin)
 */
router.patch(
  '/users/:id/activate',
  authenticate,
  requireAdmin,
  AdminAuthController.activateUser
);

/**
 * @route   PATCH /api/admin/auth/users/:id/deactivate
 * @desc    Deactivate user (admin only)
 * @access  Private (Admin)
 */
router.patch(
  '/users/:id/deactivate',
  authenticate,
  requireAdmin,
  AdminAuthController.deactivateUser
);

/**
 * @route   POST /api/admin/auth/users/bulk-update-roles
 * @desc    Bulk update user roles (admin only)
 * @access  Private (Admin)
 */
router.post(
  '/users/bulk-update-roles',
  authenticate,
  requireAdmin,
  validateRequest(adminAuthValidation.bulkUpdateRoles),
  AdminAuthController.bulkUpdateUserRoles
);

/**
 * @route   POST /api/admin/auth/users/bulk-update-status
 * @desc    Bulk update user status (admin only)
 * @access  Private (Admin)
 */
router.post(
  '/users/bulk-update-status',
  authenticate,
  requireAdmin,
  validateRequest(adminAuthValidation.bulkUpdateStatus),
  AdminAuthController.bulkUpdateUserStatus
);

/**
 * @route   GET /api/admin/auth/statistics
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/statistics',
  authenticate,
  requireAdmin,
  AdminAuthController.getUserStatistics
);

/**
 * @route   GET /api/admin/auth/roles
 * @desc    Get available roles (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/roles',
  authenticate,
  requireAdmin,
  AdminAuthController.getRoles
);

/**
 * @route   GET /api/admin/auth/permissions
 * @desc    Get available permissions (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/permissions',
  authenticate,
  requireAdmin,
  AdminAuthController.getPermissions
);

export default router;
