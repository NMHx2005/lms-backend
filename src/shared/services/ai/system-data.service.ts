import { User as UserModel, AIToolsUsage, Course } from '../../models';

export interface SystemData {
    // Course Information
    courses: {
        total: number;
        published: number;
        draft: number;
        popular: any[];
        recent: any[];
        byDomain: Record<string, number>;
        byLevel: Record<string, number>;
        priceStats: {
            min: number;
            max: number;
            average: number;
            free: number;
        };
    };

    // User Statistics
    users: {
        total: number;
        students: number;
        teachers: number;
        admins: number;
        active: number;
    };

    // System Information
    system: {
        name: string;
        version: string;
        contact: {
            email: string;
            phone: string;
            address: string;
            website: string;
        };
        features: string[];
        policies: {
            refund: string;
            privacy: string;
            terms: string;
        };
    };

    // Learning Analytics
    analytics: {
        totalEnrollments: number;
        completionRate: number;
        averageRating: number;
        totalRevenue: number;
        topInstructors: any[];
    };

    // Support Information
    support: {
        faq: any[];
        helpTopics: string[];
        contactMethods: string[];
        businessHours: string;
    };
}

export class SystemDataService {
    /**
     * Get comprehensive system data for AI context
     */
    static async getSystemData(): Promise<SystemData> {
        try {

            // Load all data in parallel for better performance
            const [
                coursesData,
                usersData,
                systemInfo,
                analyticsData,
                supportData
            ] = await Promise.all([
                this.getCoursesData(),
                this.getUsersData(),
                this.getSystemInfo(),
                this.getAnalyticsData(),
                this.getSupportData()
            ]);

            const systemData: SystemData = {
                courses: coursesData,
                users: usersData,
                system: systemInfo,
                analytics: analyticsData,
                support: supportData
            };

            return systemData;
        } catch (error) {

            return this.getDefaultSystemData();
        }
    }

    /**
     * Get courses data
     */
    private static async getCoursesData(): Promise<SystemData['courses']> {
        try {
            // Get all courses using Course model directly
            const courses = await Course.find({ status: 'published' })
                .select('title domain level price averageRating totalStudents totalLessons')
                .limit(100)
                .lean();

            // Calculate statistics
            const domainStats: Record<string, number> = {};
            const levelStats: Record<string, number> = {};
            let totalPrice = 0;
            let freeCourses = 0;
            let minPrice = Infinity;
            let maxPrice = 0;

            courses.forEach((course: any) => {
                // Domain stats
                const domain = course.domain || 'Unknown';
                domainStats[domain] = (domainStats[domain] || 0) + 1;

                // Level stats
                const level = course.level || 'Unknown';
                levelStats[level] = (levelStats[level] || 0) + 1;

                // Price stats
                const price = course.price || 0;
                if (price === 0) {
                    freeCourses++;
                } else {
                    totalPrice += price;
                    minPrice = Math.min(minPrice, price);
                    maxPrice = Math.max(maxPrice, price);
                }
            });

            return {
                total: courses.length,
                published: courses.length, // Already filtered for published
                draft: 0, // Not loading draft courses
                popular: courses.slice(0, 10),
                recent: courses.slice(-5),
                byDomain: domainStats,
                byLevel: levelStats,
                priceStats: {
                    min: minPrice === Infinity ? 0 : minPrice,
                    max: maxPrice,
                    average: courses.length > 0 ? Math.round(totalPrice / courses.length) : 0,
                    free: freeCourses
                }
            };
        } catch (error) {

            return {
                total: 0,
                published: 0,
                draft: 0,
                popular: [],
                recent: [],
                byDomain: {},
                byLevel: {},
                priceStats: { min: 0, max: 0, average: 0, free: 0 }
            };
        }
    }

    /**
     * Get users data
     */
    private static async getUsersData(): Promise<SystemData['users']> {
        try {
            const totalUsers = await UserModel.countDocuments();
            const students = await UserModel.countDocuments({ 'roles': 'student' });
            const teachers = await UserModel.countDocuments({ 'roles': 'teacher' });
            const admins = await UserModel.countDocuments({ 'roles': 'admin' });
            const active = await UserModel.countDocuments({ isActive: true });

            return {
                total: totalUsers,
                students,
                teachers,
                admins,
                active
            };
        } catch (error) {

            return {
                total: 0,
                students: 0,
                teachers: 0,
                admins: 0,
                active: 0
            };
        }
    }

    /**
     * Get system information
     */
    private static getSystemInfo(): SystemData['system'] {
        return {
            name: 'LMS Vietnam - Hệ thống học tập trực tuyến',
            version: '2.0.0',
            contact: {
                email: 'support@lmsvietnam.com',
                phone: '1900-1234',
                address: '123 Đường ABC, Quận 1, TP.HCM, Việt Nam',
                website: 'https://lmsvietnam.com'
            },
            features: [
                'Khóa học trực tuyến đa dạng',
                'Hệ thống đánh giá và chứng chỉ',
                'AI Assistant tư vấn khóa học',
                'Theo dõi tiến độ học tập',
                'Cộng đồng học viên',
                'Hỗ trợ 24/7',
                'Thanh toán an toàn',
                'Mobile-friendly'
            ],
            policies: {
                refund: 'Hoàn tiền trong vòng 7 ngày nếu chưa bắt đầu học',
                privacy: 'Bảo mật thông tin cá nhân theo tiêu chuẩn GDPR',
                terms: 'Điều khoản sử dụng rõ ràng, minh bạch'
            }
        };
    }

    /**
     * Get analytics data
     */
    private static async getAnalyticsData(): Promise<SystemData['analytics']> {
        try {
            // Get AI tools usage for analytics
            const aiUsage = await AIToolsUsage.find({}).limit(100);

            return {
                totalEnrollments: Math.floor(Math.random() * 1000) + 500, // Placeholder
                completionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
                averageRating: 4.2 + Math.random() * 0.8, // 4.2-5.0
                totalRevenue: Math.floor(Math.random() * 1000000) + 500000, // Placeholder
                topInstructors: [] // Will be populated from actual data
            };
        } catch (error) {

            return {
                totalEnrollments: 0,
                completionRate: 0,
                averageRating: 0,
                totalRevenue: 0,
                topInstructors: []
            };
        }
    }

    /**
     * Get support information
     */
    private static getSupportData(): SystemData['support'] {
        return {
            faq: [
                {
                    question: 'Làm thế nào để đăng ký khóa học?',
                    answer: 'Bạn có thể đăng ký bằng cách click vào nút "Đăng ký ngay" trên trang chi tiết khóa học'
                },
                {
                    question: 'Có thể học trên mobile không?',
                    answer: 'Có, hệ thống hỗ trợ đầy đủ trên mobile và tablet'
                },
                {
                    question: 'Làm sao để nhận chứng chỉ?',
                    answer: 'Chứng chỉ sẽ được cấp tự động khi bạn hoàn thành 100% khóa học'
                },
                {
                    question: 'Có thể hoàn tiền không?',
                    answer: 'Có thể hoàn tiền trong vòng 7 ngày nếu chưa bắt đầu học'
                }
            ],
            helpTopics: [
                'Đăng ký tài khoản',
                'Thanh toán khóa học',
                'Sử dụng hệ thống học tập',
                'Nhận chứng chỉ',
                'Liên hệ hỗ trợ',
                'Báo cáo lỗi',
                'Yêu cầu hoàn tiền',
                'Cập nhật thông tin'
            ],
            contactMethods: [
                'Email: support@lmsvietnam.com',
                'Hotline: 1900-1234',
                'Chat trực tuyến 24/7',
                'Facebook: @lmsvietnam',
                'Zalo: 0901234567'
            ],
            businessHours: 'Thứ 2 - Thứ 6: 8:00 - 18:00, Thứ 7 - CN: 9:00 - 17:00'
        };
    }

    /**
     * Get default system data if loading fails
     */
    private static getDefaultSystemData(): SystemData {
        return {
            courses: {
                total: 0,
                published: 0,
                draft: 0,
                popular: [],
                recent: [],
                byDomain: {},
                byLevel: {},
                priceStats: { min: 0, max: 0, average: 0, free: 0 }
            },
            users: {
                total: 0,
                students: 0,
                teachers: 0,
                admins: 0,
                active: 0
            },
            system: {
                name: 'LMS Vietnam',
                version: '2.0.0',
                contact: {
                    email: 'support@lmsvietnam.com',
                    phone: '1900-1234',
                    address: 'TP.HCM, Việt Nam',
                    website: 'https://lmsvietnam.com'
                },
                features: ['Khóa học trực tuyến', 'AI Assistant', 'Chứng chỉ'],
                policies: {
                    refund: 'Hoàn tiền trong 7 ngày',
                    privacy: 'Bảo mật GDPR',
                    terms: 'Điều khoản minh bạch'
                }
            },
            analytics: {
                totalEnrollments: 0,
                completionRate: 0,
                averageRating: 0,
                totalRevenue: 0,
                topInstructors: []
            },
            support: {
                faq: [],
                helpTopics: ['Hỗ trợ cơ bản'],
                contactMethods: ['Email: support@lmsvietnam.com'],
                businessHours: '8:00 - 18:00'
            }
        };
    }
}

export default SystemDataService;
