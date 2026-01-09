import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Announcement from '../../shared/models/communication/Announcement';
import User from '../../shared/models/core/User';

dotenv.config();

const announcementSeedData = [
    {
        title: 'Chào mừng đến với hệ thống LMS',
        content: 'Chúng tôi rất vui mừng chào đón bạn đến với hệ thống học tập trực tuyến của chúng tôi. Hãy khám phá các khóa học thú vị và bắt đầu hành trình học tập của bạn!',
        type: 'general',
        priority: 'normal',
        target: {
            type: 'all',
            value: undefined
        },
        isScheduled: false,
        status: 'published',
        publishedAt: new Date(),
        tags: ['welcome', 'general'],
        displayOptions: {
            showAsPopup: false,
            showOnDashboard: true,
            sendEmail: true,
            sendPush: false,
            requireAcknowledgment: false
        },
        analytics: {
            totalViews: 156,
            totalClicks: 23,
            totalAcknowledgments: 0
        }
    },
    {
        title: 'Cập nhật hệ thống - Bảo trì định kỳ',
        content: 'Hệ thống sẽ được bảo trì định kỳ vào ngày mai từ 2:00 - 4:00 sáng. Trong thời gian này, một số tính năng có thể không khả dụng. Chúng tôi xin lỗi vì sự bất tiện này.',
        type: 'maintenance',
        priority: 'high',
        target: {
            type: 'all',
            value: undefined
        },
        isScheduled: false,
        status: 'published',
        publishedAt: new Date(Date.now() - 86400000), // 1 day ago
        tags: ['maintenance', 'update', 'system'],
        displayOptions: {
            showAsPopup: true,
            showOnDashboard: true,
            sendEmail: true,
            sendPush: true,
            requireAcknowledgment: true
        },
        analytics: {
            totalViews: 89,
            totalClicks: 12,
            totalAcknowledgments: 45
        }
    },
    {
        title: 'Khóa học mới: React Native từ cơ bản đến nâng cao',
        content: 'Chúng tôi rất vui mừng thông báo về việc ra mắt khóa học React Native mới. Khóa học này sẽ giúp bạn phát triển ứng dụng mobile cross-platform một cách chuyên nghiệp.',
        type: 'course',
        priority: 'normal',
        target: {
            type: 'role',
            value: ['student']
        },
        isScheduled: false,
        status: 'published',
        publishedAt: new Date(Date.now() - 172800000), // 2 days ago
        tags: ['course', 'react-native', 'mobile-development'],
        displayOptions: {
            showAsPopup: false,
            showOnDashboard: true,
            sendEmail: true,
            sendPush: false,
            requireAcknowledgment: false
        },
        analytics: {
            totalViews: 234,
            totalClicks: 67,
            totalAcknowledgments: 0
        }
    }
];

export const seedAnnouncementData = async () => {
    try {

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');

        // Get admin user for createdBy
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            throw new Error('Không tìm thấy admin user để tạo announcements');
        }

        // Clear existing announcements
        await Announcement.deleteMany({});

        // Create announcements with admin as creator
        const announcementsWithCreator = announcementSeedData.map(announcement => ({
            ...announcement,
            createdBy: {
                userId: adminUser._id,
                name: adminUser.name || `${adminUser.firstName} ${adminUser.lastName}`,
                role: adminUser.role
            }
        }));

        const createdAnnouncements = await Announcement.insertMany(announcementsWithCreator);


        await mongoose.connection.close();
    } catch (error) {

        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    seedAnnouncementData()
        .then(() => {

            process.exit(0);
        })
        .catch((error) => {

            process.exit(1);
        });
}
