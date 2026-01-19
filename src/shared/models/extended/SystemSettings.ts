import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
    // Website Identity
    siteName: string;
    siteDescription: string;
    siteLogo: string;
    siteFavicon: string;
    siteTagline: string;

    // Contact Information
    contactInfo: {
        email: string;
        phone: string;
        address: string;
        city: string;
        country: string;
        zipCode: string;
    };

    // Social Media
    socialMedia: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
        youtube?: string;
        github?: string;
    };

    // SEO Settings
    seo: {
        metaTitle: string;
        metaDescription: string;
        metaKeywords: string[];
        ogImage: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
    };

    // System Features
    features: {
        enableRegistration: boolean;
        enableCourseEnrollment: boolean;
        enablePayments: boolean;
        enableRefunds: boolean;
        enableRatings: boolean;
        enableCertificates: boolean;
        enableDiscussions: boolean;
        enableAI: boolean;
    };

    // Email Settings
    email: {
        enabled: boolean;
        fromName: string;
        fromEmail: string;
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPassword?: string;
        enableSSL: boolean;
    };

    // Storage Settings
    storage: {
        provider: 'cloudinary' | 'aws-s3' | 'local';
        maxFileSize: number; // bytes
        allowedFileTypes: string[];
        cloudinaryCloudName?: string;
        cloudinaryApiKey?: string;
        cloudinaryApiSecret?: string;
    };

    // Payment Settings
    payment: {
        enabled: boolean;
        currency: string;
        vnpay: {
            enabled: boolean;
            tmnCode?: string;
            hashSecret?: string;
            url?: string;
        };
        momo: {
            enabled: boolean;
            partnerCode?: string;
            accessKey?: string;
            secretKey?: string;
        };
    };

    // System Maintenance
    maintenance: {
        enabled: boolean;
        message: string;
        allowedIPs: string[];
    };

    // Security Settings
    security: {
        enableTwoFactor: boolean;
        sessionTimeout: number; // minutes
        maxLoginAttempts: number;
        lockoutDuration: number; // minutes
        requireEmailVerification: boolean;
        passwordMinLength: number;
        passwordRequireSpecialChar: boolean;
    };

    // Performance Settings
    performance: {
        enableCaching: boolean;
        cacheExpiry: number; // seconds
        enableCompression: boolean;
        maxConcurrentUsers: number;
    };

    // Content Moderation
    moderation: {
        enableAutoModeration: boolean;
        requireCourseApproval: boolean;
        requireReviewApproval: boolean;
        profanityFilter: boolean;
    };

    // AI Settings
    ai: {
        enabled: boolean;
        provider: 'openai' | 'gemini';
        model?: string; // gemini-1.5-flash or gemini-2.5-flash
        autoApproval: {
            enabled: boolean;
            threshold: number; // 0-100
            minRequirements: {
                hasDescription: boolean;
                hasLearningObjectives: boolean;
                minLessons: number;
                minSections: number;
            };
        };
        rateLimit: {
            requestsPerDay: number;
            currentUsage: number;
            lastReset: Date;
        };
    };

    // Legal
    legal: {
        termsOfServiceUrl: string;
        privacyPolicyUrl: string;
        refundPolicyUrl: string;
        copyrightText: string;
    };

    createdAt: Date;
    updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
    {
        // Website Identity
        siteName: {
            type: String,
            required: true,
            default: 'Learning Management System'
        },
        siteDescription: {
            type: String,
            default: 'Online learning platform for everyone'
        },
        siteLogo: {
            type: String,
            default: '/logo.png'
        },
        siteFavicon: {
            type: String,
            default: '/favicon.ico'
        },
        siteTagline: {
            type: String,
            default: 'Learn anywhere, anytime'
        },

        // Contact Information
        contactInfo: {
            email: { type: String, default: 'contact@example.com' },
            phone: { type: String, default: '+84 123 456 789' },
            address: { type: String, default: '' },
            city: { type: String, default: '' },
            country: { type: String, default: 'Vietnam' },
            zipCode: { type: String, default: '' }
        },

        // Social Media
        socialMedia: {
            facebook: { type: String },
            twitter: { type: String },
            instagram: { type: String },
            linkedin: { type: String },
            youtube: { type: String },
            github: { type: String }
        },

        // SEO Settings
        seo: {
            metaTitle: { type: String, default: '' },
            metaDescription: { type: String, default: '' },
            metaKeywords: { type: [String], default: [] },
            ogImage: { type: String, default: '' },
            googleAnalyticsId: { type: String },
            facebookPixelId: { type: String }
        },

        // System Features
        features: {
            enableRegistration: { type: Boolean, default: true },
            enableCourseEnrollment: { type: Boolean, default: true },
            enablePayments: { type: Boolean, default: true },
            enableRefunds: { type: Boolean, default: true },
            enableRatings: { type: Boolean, default: true },
            enableCertificates: { type: Boolean, default: true },
            enableDiscussions: { type: Boolean, default: false },
            enableAI: { type: Boolean, default: false }
        },

        // Email Settings
        email: {
            enabled: { type: Boolean, default: true },
            fromName: { type: String, default: 'LMS Platform' },
            fromEmail: { type: String, default: 'noreply@example.com' },
            smtpHost: { type: String },
            smtpPort: { type: Number },
            smtpUser: { type: String },
            smtpPassword: { type: String },
            enableSSL: { type: Boolean, default: true }
        },

        // Storage Settings
        storage: {
            provider: {
                type: String,
                enum: ['cloudinary', 'aws-s3', 'local'],
                default: 'cloudinary'
            },
            maxFileSize: { type: Number, default: 10485760 }, // 10MB
            allowedFileTypes: {
                type: [String],
                default: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4']
            },
            cloudinaryCloudName: { type: String },
            cloudinaryApiKey: { type: String },
            cloudinaryApiSecret: { type: String }
        },

        // Payment Settings
        payment: {
            enabled: { type: Boolean, default: true },
            currency: { type: String, default: 'VND' },
            vnpay: {
                enabled: { type: Boolean, default: false },
                tmnCode: { type: String },
                hashSecret: { type: String },
                url: { type: String }
            },
            momo: {
                enabled: { type: Boolean, default: false },
                partnerCode: { type: String },
                accessKey: { type: String },
                secretKey: { type: String }
            }
        },

        // System Maintenance
        maintenance: {
            enabled: { type: Boolean, default: false },
            message: { type: String, default: 'System is under maintenance' },
            allowedIPs: { type: [String], default: [] }
        },

        // Security Settings
        security: {
            enableTwoFactor: { type: Boolean, default: false },
            sessionTimeout: { type: Number, default: 60 }, // minutes
            maxLoginAttempts: { type: Number, default: 5 },
            lockoutDuration: { type: Number, default: 30 }, // minutes
            requireEmailVerification: { type: Boolean, default: true },
            passwordMinLength: { type: Number, default: 8 },
            passwordRequireSpecialChar: { type: Boolean, default: true }
        },

        // Performance Settings
        performance: {
            enableCaching: { type: Boolean, default: true },
            cacheExpiry: { type: Number, default: 3600 }, // seconds
            enableCompression: { type: Boolean, default: true },
            maxConcurrentUsers: { type: Number, default: 1000 }
        },

        // Content Moderation
        moderation: {
            enableAutoModeration: { type: Boolean, default: false },
            requireCourseApproval: { type: Boolean, default: true },
            requireReviewApproval: { type: Boolean, default: false },
            profanityFilter: { type: Boolean, default: true }
        },

        // AI Settings
        ai: {
            enabled: { type: Boolean, default: false },
            provider: {
                type: String,
                enum: ['openai', 'gemini'],
                default: 'gemini'
            },
            model: {
                type: String,
                default: 'gemini-2.0-flash' // gemini-2.0-flash (replaces deprecated gemini-1.5-flash)
            },
            autoApproval: {
                enabled: { type: Boolean, default: false },
                threshold: { type: Number, default: 70, min: 0, max: 100 },
                minRequirements: {
                    hasDescription: { type: Boolean, default: true },
                    hasLearningObjectives: { type: Boolean, default: true },
                    minLessons: { type: Number, default: 3, min: 0 },
                    minSections: { type: Number, default: 1, min: 0 }
                }
            },
            rateLimit: {
                requestsPerDay: { type: Number, default: 1500 }, // Default for gemini-1.5-flash
                currentUsage: { type: Number, default: 0 },
                lastReset: { type: Date, default: Date.now }
            }
        },

        // Legal
        legal: {
            termsOfServiceUrl: { type: String, default: '/terms' },
            privacyPolicyUrl: { type: String, default: '/privacy' },
            refundPolicyUrl: { type: String, default: '/refund-policy' },
            copyrightText: { type: String, default: '© 2025 LMS Platform. All rights reserved.' }
        }
    },
    {
        timestamps: true,
        collection: 'systemsettings'
    }
);

// Singleton pattern - Only one document should exist
systemSettingsSchema.statics.getInstance = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Export the model
export default mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

