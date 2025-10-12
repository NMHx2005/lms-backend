import express from 'express';
import { SystemSettingsController } from '../controllers/system-settings.controller';
import { multerInstances } from '../../shared/middleware/multer';

const router = express.Router();

/**
 * @route   GET /api/admin/system-settings
 * @desc    Get system settings
 * @access  Admin
 */
router.get('/', SystemSettingsController.getSettings);

/**
 * @route   PUT /api/admin/system-settings
 * @desc    Update system settings
 * @access  Admin
 */
router.put('/', SystemSettingsController.updateSettings);

/**
 * @route   POST /api/admin/system-settings/reset
 * @desc    Reset settings to defaults
 * @access  Admin
 */
router.post('/reset', SystemSettingsController.resetSettings);

/**
 * @route   POST /api/admin/system-settings/logo
 * @desc    Upload site logo
 * @access  Admin
 */
router.post(
    '/logo',
    multerInstances.singleImage.single('logo'),
    SystemSettingsController.uploadLogo
);

/**
 * @route   POST /api/admin/system-settings/favicon
 * @desc    Upload site favicon
 * @access  Admin
 */
router.post(
    '/favicon',
    multerInstances.singleImage.single('favicon'),
    SystemSettingsController.uploadFavicon
);

export default router;

