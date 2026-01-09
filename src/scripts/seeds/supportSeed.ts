import { SupportTicket, FAQ } from '../../shared/models/core';

export const seedSupportData = async () => {
    try {
        // Seed FAQs
        const faqs = [
            {
                question: 'Làm thế nào để đăng ký tài khoản?',
                answer: 'Bạn có thể đăng ký tài khoản bằng cách click vào nút "Đăng ký" ở góc trên bên phải, sau đó điền đầy đủ thông tin cá nhân và xác nhận email.',
                category: 'account',
                isPublished: true,
                viewCount: 1250,
                helpfulCount: 89
            },
            {
                question: 'Có thể học offline không?',
                answer: 'Hiện tại tất cả khóa học đều được thiết kế để học online. Bạn có thể học mọi lúc, mọi nơi chỉ cần có kết nối internet.',
                category: 'course',
                isPublished: true,
                viewCount: 890,
                helpfulCount: 67
            },
            {
                question: 'Làm sao để hoàn tiền?',
                answer: 'Bạn có thể yêu cầu hoàn tiền trong vòng 30 ngày kể từ ngày mua khóa học. Liên hệ support team để được hướng dẫn chi tiết.',
                category: 'billing',
                isPublished: true,
                viewCount: 567,
                helpfulCount: 45
            },
            {
                question: 'Video không phát được phải làm sao?',
                answer: 'Vui lòng kiểm tra kết nối internet, thử refresh trang hoặc đổi trình duyệt. Nếu vẫn không được, hãy liên hệ support.',
                category: 'technical',
                isPublished: true,
                viewCount: 234,
                helpfulCount: 23
            },
            {
                question: 'Cách thay đổi mật khẩu?',
                answer: 'Vào Settings > Security > Change Password, nhập mật khẩu cũ và mật khẩu mới, sau đó xác nhận.',
                category: 'account',
                isPublished: false,
                viewCount: 0,
                helpfulCount: 0
            }
        ];

        await FAQ.insertMany(faqs);

        // Seed Support Tickets
        const tickets = [
            {
                ticketNumber: 'TKT-2025-0001',
                userId: 'user-1',
                userName: 'Nguyễn Văn A',
                userEmail: 'nguyenvana@email.com',
                subject: 'Không thể truy cập khóa học React',
                description: 'Tôi đã mua khóa học React nhưng không thể truy cập được. Hiện tại đang bị lỗi 404 khi click vào khóa học.',
                priority: 'high',
                status: 'open',
                category: 'course',
                responseCount: 0,
                tags: ['react', 'access', '404']
            },
            {
                ticketNumber: 'TKT-2025-0002',
                userId: 'user-2',
                userName: 'Trần Thị B',
                userEmail: 'tranthib@email.com',
                subject: 'Vấn đề về thanh toán',
                description: 'Tôi đã thanh toán bằng thẻ tín dụng nhưng hệ thống vẫn hiển thị chưa thanh toán. Cần hỗ trợ kiểm tra.',
                priority: 'urgent',
                status: 'in_progress',
                category: 'billing',
                assignedTo: 'admin-1',
                assignedToName: 'Admin User',
                lastResponseAt: new Date(),
                responseCount: 2,
                tags: ['payment', 'credit-card', 'billing'],
                notes: [
                    {
                        note: 'Đã kiểm tra giao dịch, đang xử lý',
                        isInternal: true,
                        addedBy: 'admin-1',
                        addedAt: new Date()
                    }
                ]
            },
            {
                ticketNumber: 'TKT-2025-0003',
                userId: 'user-3',
                userName: 'Lê Văn C',
                userEmail: 'levanc@email.com',
                subject: 'Quên mật khẩu tài khoản',
                description: 'Tôi không thể đăng nhập vào tài khoản vì quên mật khẩu. Đã thử reset password nhưng không nhận được email.',
                priority: 'medium',
                status: 'waiting_user',
                category: 'account',
                assignedTo: 'support-1',
                assignedToName: 'Support Agent',
                lastResponseAt: new Date(),
                responseCount: 1,
                tags: ['password', 'login', 'reset'],
                notes: [
                    {
                        note: 'Đã gửi email reset password mới',
                        isInternal: true,
                        addedBy: 'support-1',
                        addedAt: new Date()
                    }
                ]
            },
            {
                ticketNumber: 'TKT-2025-0004',
                userId: 'user-4',
                userName: 'Phạm Thị D',
                userEmail: 'phamthid@email.com',
                subject: 'Video không phát được',
                description: 'Khi xem video bài giảng, video bị giật lag và không thể phát được. Đã thử nhiều trình duyệt khác nhau.',
                priority: 'medium',
                status: 'resolved',
                category: 'technical',
                assignedTo: 'admin-1',
                assignedToName: 'Admin User',
                lastResponseAt: new Date(),
                responseCount: 3,
                tags: ['video', 'streaming', 'technical'],
                notes: [
                    {
                        note: 'Đã kiểm tra và khắc phục vấn đề streaming',
                        isInternal: true,
                        addedBy: 'admin-1',
                        addedAt: new Date()
                    }
                ]
            },
            {
                ticketNumber: 'TKT-2025-0005',
                userId: 'user-5',
                userName: 'Hoàng Văn E',
                userEmail: 'hoangvane@email.com',
                subject: 'Yêu cầu hoàn tiền khóa học',
                description: 'Tôi muốn hoàn tiền khóa học Python vì không phù hợp với nhu cầu học tập.',
                priority: 'high',
                status: 'in_progress',
                category: 'billing',
                assignedTo: 'admin-1',
                assignedToName: 'Admin User',
                responseCount: 1,
                tags: ['refund', 'python', 'billing']
            }
        ];

        await SupportTicket.insertMany(tickets);


    } catch (error) {

        throw error;
    }
};

export const clearSupportData = async () => {
    try {
        await FAQ.deleteMany({});
        await SupportTicket.deleteMany({});

    } catch (error) {

        throw error;
    }
};
