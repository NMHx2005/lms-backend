import { Response } from 'express';
import { SystemSettingsService } from '../services/system-settings.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import { CloudinaryService } from '../../shared/services/cloudinaryService';

export class SystemSettingsController {
    /**
     * Get system settings
     * GET /api/admin/system-settings
     */
    static getSettings = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
        const settings = await SystemSettingsService.getSettings();

        res.status(200).json({
            success: true,
            message: 'System settings retrieved successfully',
            data: settings
        });
    });

    /**
     * Update system settings
     * PUT /api/admin/system-settings
     */
    static updateSettings = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
        const updates = req.body;

        const settings = await SystemSettingsService.updateSettings(updates);

        res.status(200).json({
            success: true,
            message: 'System settings updated successfully',
            data: settings
        });
    });

    /**
     * Reset to default settings
     * POST /api/admin/system-settings/reset
     */
    static resetSettings = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
        const settings = await SystemSettingsService.resetToDefaults();

        res.status(200).json({
            success: true,
            message: 'System settings reset to defaults successfully',
            data: settings
        });
    });

    /**
     * Upload logo
     * POST /api/admin/system-settings/logo
     */
    static uploadLogo = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
        const file = req.file;

        console.log('📤 Upload logo request received');
        console.log('File:', file);

        if (!file) {
            throw new AppError('No file uploaded', 400);
        }

        // Upload to Cloudinary
        const result = await CloudinaryService.uploadFile(file, {
            folder: 'system/logo',
            resourceType: 'image'
        });

        const logoUrl = result.secureUrl;

        console.log('🔗 Logo uploaded to Cloudinary:', logoUrl);

        // Update settings with new logo
        const settings = await SystemSettingsService.updateSettings({
            siteLogo: logoUrl
        } as any);

        console.log('✅ Logo updated in settings');

        res.status(200).json({
            success: true,
            message: 'Logo uploaded successfully',
            data: {
                logoUrl,
                settings
            }
        });
    });

    /**
     * Upload favicon
     * POST /api/admin/system-settings/favicon
     */
    static uploadFavicon = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
        const file = req.file;

        console.log('📤 Upload favicon request received');
        console.log('File:', file);

        if (!file) {
            throw new AppError('No file uploaded', 400);
        }

        // Upload to Cloudinary
        const result = await CloudinaryService.uploadFile(file, {
            folder: 'system/favicon',
            resourceType: 'image'
        });

        const faviconUrl = result.secureUrl;

        console.log('🔗 Favicon uploaded to Cloudinary:', faviconUrl);

        // Update settings with new favicon
        const settings = await SystemSettingsService.updateSettings({
            siteFavicon: faviconUrl
        } as any);

        console.log('✅ Favicon updated in settings');

        res.status(200).json({
            success: true,
            message: 'Favicon uploaded successfully',
            data: {
                faviconUrl,
                settings
            }
        });
    });
}

