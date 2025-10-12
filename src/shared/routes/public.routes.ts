import express from 'express';
import { SystemSettingsService } from '../../admin/services/system-settings.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

/**
 * @route   GET /api/public/system-settings
 * @desc    Get public system settings (no authentication required)
 * @access  Public
 */
router.get('/system-settings', asyncHandler(async (req, res) => {
    const settings = await SystemSettingsService.getSettings();

    // Return only public-facing settings
    const publicSettings = {
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        siteLogo: settings.siteLogo,
        siteFavicon: settings.siteFavicon,
        siteTagline: settings.siteTagline,
        contactInfo: settings.contactInfo,
        socialMedia: settings.socialMedia,
        seo: {
            metaTitle: settings.seo.metaTitle,
            metaDescription: settings.seo.metaDescription,
            metaKeywords: settings.seo.metaKeywords,
            ogImage: settings.seo.ogImage
        },
        features: {
            enableRegistration: settings.features.enableRegistration,
            enableCourseEnrollment: settings.features.enableCourseEnrollment,
            enablePayments: settings.features.enablePayments,
            enableRatings: settings.features.enableRatings,
            enableCertificates: settings.features.enableCertificates,
            enableDiscussions: settings.features.enableDiscussions
        },
        legal: settings.legal
    };

    res.status(200).json({
        success: true,
        message: 'Public system settings retrieved successfully',
        data: publicSettings
    });
}));

export default router;

