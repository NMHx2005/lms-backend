import express from 'express';
import { authenticate } from '../../admin/middleware/auth';
import { multerInstances } from '../../shared/middleware/multer';
import ClientUserController from '../controllers/user.controller';
import { clientUserValidation } from '../validators/user.validator';
import { validateRequest } from '../../shared/middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Profile Management
router.get('/profile', ClientUserController.getProfile);
router.put('/profile', validateRequest(clientUserValidation.updateProfile), ClientUserController.updateProfile);
router.put('/avatar', multerInstances.singleImage.single('avatar'), ClientUserController.updateAvatar);

// Password Management
router.put('/password', validateRequest(clientUserValidation.changePassword), ClientUserController.changePassword);
router.post('/password/reset-request', validateRequest(clientUserValidation.requestPasswordReset), ClientUserController.requestPasswordReset);
router.post('/password/reset', validateRequest(clientUserValidation.resetPassword), ClientUserController.resetPassword);

// Email Verification
router.get('/verify-email/:token', ClientUserController.verifyEmail);
router.post('/verify-email/resend', ClientUserController.resendEmailVerification);

// Preferences and Settings
router.put('/preferences', validateRequest(clientUserValidation.updatePreferences), ClientUserController.updatePreferences);
router.put('/notifications', validateRequest(clientUserValidation.updateNotificationSettings), ClientUserController.updateNotificationSettings);
router.put('/social-links', validateRequest(clientUserValidation.updateSocialLinks), ClientUserController.updateSocialLinks);

// Learning Statistics and Activity
router.get('/stats', ClientUserController.getLearningStats);
router.get('/activity', validateRequest(clientUserValidation.getActivityLog), ClientUserController.getActivityLog);

// Subscription Information
router.get('/subscription', ClientUserController.getSubscriptionInfo);

// Account Management
router.delete('/account', validateRequest(clientUserValidation.deleteAccount), ClientUserController.deleteAccount);

export default router;
