import SystemSettings, { ISystemSettings } from '../../shared/models/extended/SystemSettings';

export class SystemSettingsService {
    /**
     * Get system settings (singleton)
     */
    static async getSettings(): Promise<ISystemSettings> {
        try {
            const settings = await (SystemSettings as any).getInstance();
            return settings;
        } catch (error) {
            console.error('Error getting system settings:', error);
            throw error;
        }
    }

    /**
     * Update system settings
     */
    static async updateSettings(updates: Partial<ISystemSettings>): Promise<ISystemSettings> {
        try {
            const settings = await (SystemSettings as any).getInstance();

            console.log('📝 Updating settings with:', updates);

            // Update fields
            Object.keys(updates).forEach(key => {
                if (updates[key as keyof ISystemSettings] !== undefined) {
                    (settings as any)[key] = updates[key as keyof ISystemSettings];
                }
            });

            await settings.save();
            console.log('✅ System settings updated successfully');
            console.log('📊 Updated settings:', {
                siteName: settings.siteName,
                siteLogo: settings.siteLogo,
                siteFavicon: settings.siteFavicon
            });

            return settings;
        } catch (error) {
            console.error('Error updating system settings:', error);
            throw error;
        }
    }

    /**
     * Reset to default settings
     */
    static async resetToDefaults(): Promise<ISystemSettings> {
        try {
            await SystemSettings.deleteMany({});
            const settings = await (SystemSettings as any).getInstance();
            console.log('✅ System settings reset to defaults');
            return settings;
        } catch (error) {
            console.error('Error resetting system settings:', error);
            throw error;
        }
    }

    /**
     * Get public settings (for client-side access)
     */
    static async getPublicSettings() {
        try {
            const settings = await (SystemSettings as any).getInstance();

            // Return only public fields
            return {
                siteName: settings.siteName,
                siteDescription: settings.siteDescription,
                siteLogo: settings.siteLogo,
                siteFavicon: settings.siteFavicon,
                siteTagline: settings.siteTagline,
                contactInfo: {
                    email: settings.contactInfo.email,
                    phone: settings.contactInfo.phone,
                    address: settings.contactInfo.address,
                    city: settings.contactInfo.city,
                    country: settings.contactInfo.country
                },
                socialMedia: settings.socialMedia,
                features: {
                    enableRegistration: settings.features.enableRegistration,
                    enableCourseEnrollment: settings.features.enableCourseEnrollment,
                    enablePayments: settings.features.enablePayments,
                    enableRatings: settings.features.enableRatings,
                    enableCertificates: settings.features.enableCertificates
                },
                legal: settings.legal
            };
        } catch (error) {
            console.error('Error getting public settings:', error);
            throw error;
        }
    }
}

