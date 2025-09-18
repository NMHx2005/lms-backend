import express from 'express';
import { UserController } from '../controllers/user.controller';
import { adminUserValidation } from '../validators/user.validator';
import { validateRequest } from '../../shared/middleware/validation';
import { multerInstances } from '../../shared/middleware/multer';

const router = express.Router();

// Get all users with pagination and filters
router.get('/', validateRequest(adminUserValidation.queryParams), UserController.getUsers);

// Get user statistics
router.get('/stats', UserController.getUserStats);

// Search users
router.get('/search', UserController.searchUsers);

// Create a new user
router.post('/', validateRequest(adminUserValidation.createUser), UserController.createUser);

// Get user by ID
router.get('/:id', validateRequest(adminUserValidation.userId), UserController.getUserById);

// Update user
router.put('/:id', validateRequest([...adminUserValidation.userId, ...adminUserValidation.updateUser]), UserController.updateUser);

// Delete user
router.delete('/:id', validateRequest(adminUserValidation.userId), UserController.deleteUser);

// Activate user
router.patch('/:id/activate', validateRequest(adminUserValidation.userId), UserController.activateUser);

// Deactivate user
router.patch('/:id/deactivate', validateRequest(adminUserValidation.userId), UserController.deactivateUser);

// Bulk update user status
router.patch('/bulk-status', UserController.bulkUpdateUserStatus);

// Bulk update user roles
router.patch('/bulk-roles', UserController.bulkUpdateUserRoles);

// Update user avatar
router.post('/:id/avatar',
    multerInstances.profilePictures.single('profilePicture'),
    UserController.updateUserAvatar
);

export default router;
