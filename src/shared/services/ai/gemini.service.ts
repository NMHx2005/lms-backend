import { GoogleGenAI } from '@google/genai';

export interface ChatContext {
    currentPage?: string;
    courseId?: string;
    courseInfo?: any;
    availableCourses?: any[];
    popularCourses?: any[];
    availableDomains?: string[];
    courseStats?: {
        totalCourses: number;
        domains: string[];
        levels: string[];
        priceRange: {
            min: number;
            max: number;
        };
    };
    systemData?: {
        courses: any;
        users: any;
        system: any;
        analytics: any;
        support: any;
    };
    userPreferences?: any;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: ChatContext;
}

export class GeminiService {
    private genAI: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }

        // Initialize with new Google GenAI SDK
        this.genAI = new GoogleGenAI({
            apiKey: apiKey
        });
    }

    /**
     * Generate content using new Google GenAI SDK
     */
    private async generateContent(prompt: string): Promise<string> {
        try {
            const response = await this.genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    thinkingConfig: {
                        thinkingBudget: 0, // Disable thinking for faster response
                    },
                }
            });

            return response.text || 'Không có phản hồi';
        } catch (error: any) {

            throw error;
        }
    }

    /**
     * Generate course recommendation based on user message and context
     */
    async generateCourseRecommendation(
        userMessage: string,
        context: ChatContext
    ): Promise<string> {
        try {
            const currentPage = context.currentPage;

            // Get system prompt with full context data
            let systemPrompt = this.getSystemPrompt(currentPage, context);

            const fullPrompt = `${systemPrompt}

🤔 HỌC VIÊN HỎI: "${userMessage}"

Hãy trả lời bằng tiếng Việt, thân thiện và hữu ích. Sử dụng dữ liệu thực tế từ database để đưa ra lời khuyên chính xác.`;

            return await this.generateContent(fullPrompt);
        } catch (error) {

            return 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.';
        }
    }

    /**
     * Get system prompt based on context with real database data
     */
    private getSystemPrompt(currentPage?: string, context: ChatContext = {}): string {
        const {
            availableCourses = [],
            popularCourses = [],
            courseInfo,
            courseStats,
            availableDomains = [],
            systemData
        } = context;

        // Build comprehensive system information
        let systemInfo = '';
        if (systemData) {
            systemInfo = `
🏢 THÔNG TIN HỆ THỐNG:
- Tên: ${systemData.system.name}
- Phiên bản: ${systemData.system.version}
- Website: ${systemData.system.website}
- Email hỗ trợ: ${systemData.system.contact.email}
- Hotline: ${systemData.system.contact.phone}
- Địa chỉ: ${systemData.system.contact.address}

👥 THỐNG KÊ NGƯỜI DÙNG:
- Tổng người dùng: ${systemData.users.total}
- Học viên: ${systemData.users.students}
- Giảng viên: ${systemData.users.teachers}
- Admin: ${systemData.users.admins}
- Đang hoạt động: ${systemData.users.active}

📊 THỐNG KÊ HỌC TẬP:
- Tổng đăng ký: ${systemData.analytics.totalEnrollments}
- Tỷ lệ hoàn thành: ${systemData.analytics.completionRate}%
- Đánh giá trung bình: ${systemData.analytics.averageRating}/5
- Doanh thu: ${systemData.analytics.totalRevenue.toLocaleString()} VND

🎯 TÍNH NĂNG HỆ THỐNG:
${systemData.system.features.map((f: any) => `- ${f}`).join('\n')}

📞 THÔNG TIN LIÊN HỆ & HỖ TRỢ:
${systemData.support.contactMethods.map((method: any) => `- ${method}`).join('\n')}
- Giờ làm việc: ${systemData.support.businessHours}

❓ CÂU HỎI THƯỜNG GẶP:
${systemData.support.faq.map((faq: any) => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

📋 CHÍNH SÁCH:
- Hoàn tiền: ${systemData.system.policies.refund}
- Bảo mật: ${systemData.system.policies.privacy}
- Điều khoản: ${systemData.system.policies.terms}
`;
        }

        const basePrompt = `Bạn là AI Assistant thông minh của ${systemData?.system.name || 'LMS Vietnam'}.
${systemInfo}

🎯 QUY TẮC TRẢ LỜI:
1. **NGẮN GỌN**: Mỗi câu trả lời tối đa 3-4 câu, không quá 100 từ
2. **CÓ CẤU TRÚC**: Sử dụng bullet points, emoji, xuống dòng để dễ đọc
3. **THÂN THIỆN**: Luôn chào hỏi và kết thúc bằng 😊 hoặc 👍
4. **CHÍNH XÁC**: Chỉ dùng dữ liệu thực tế từ database
5. **HỮU ÍCH**: Tập trung vào thông tin user cần, không lan man

💡 VÍ DỤ TRẢ LỜI TỐT:
"Chào bạn! 👋

• Có khóa học Java phù hợp với bạn
• Giá: 20,000 VND  
• Cấp độ: Beginner
• Đánh giá: 5/5 ⭐

Bạn có muốn xem chi tiết không? 😊"`;

        // Add database statistics
        let statsInfo = '';
        if (courseStats && systemData) {
            statsInfo = `

📊 THỐNG KÊ KHÓA HỌC CHI TIẾT:
- Tổng khóa học: ${systemData.courses.total} (${systemData.courses.published} đã xuất bản, ${systemData.courses.draft} bản nháp)
- Lĩnh vực phổ biến: ${Object.entries(systemData.courses.byDomain).map(([domain, count]) => `${domain} (${count})`).join(', ')}
- Cấp độ: ${Object.entries(systemData.courses.byLevel).map(([level, count]) => `${level} (${count})`).join(', ')}
- Thống kê giá: 
  • Miễn phí: ${systemData.courses.priceStats.free} khóa
  • Giá trung bình: ${systemData.courses.priceStats.average.toLocaleString()} VND
  • Khoảng giá: ${systemData.courses.priceStats.min.toLocaleString()} - ${systemData.courses.priceStats.max.toLocaleString()} VND`;
        } else if (courseStats) {
            statsInfo = `

📊 THỐNG KÊ KHÓA HỌC CƠ BẢN:
- Tổng khóa học: ${courseStats.totalCourses}
- Lĩnh vực có sẵn: ${courseStats.domains.join(', ')}
- Các cấp độ: ${courseStats.levels.join(', ')}
- Khoảng giá: ${courseStats.priceRange.min.toLocaleString()} - ${courseStats.priceRange.max.toLocaleString()} VND`;
        }

        switch (currentPage) {
            case 'home':
                const homeCourses = popularCourses.length > 0 ? popularCourses : availableCourses.slice(0, 10);
                return `${basePrompt}
${statsInfo}

🏠 TRANG CHỦ - KHÓA HỌC NỔI BẬT:
${homeCourses.slice(0, 2).map((course, index) =>
                    `**${course.title}**
• Giá: ${course.price === 0 ? 'Miễn phí' : course.price.toLocaleString() + ' VND'}
• Đánh giá: ${course.averageRating || 0}/5⭐
• ${course.level} level`
                ).join('\n\n')}

Tư vấn ngắn gọn, hỏi sở thích để đề xuất phù hợp.`;

            case 'courses':
                return `${basePrompt}
${statsInfo}

📚 TRANG KHÓA HỌC - ${availableCourses.length} KHÓA HỌC:
${availableCourses.slice(0, 5).map((course, index) =>
                    `**${course.title}**
• ${course.domain} • ${course.level} • ${course.averageRating || 0}/5⭐ • ${course.price === 0 ? 'Miễn phí' : course.price.toLocaleString() + ' VND'}`
                ).join('\n\n')}

Giúp tìm khóa học phù hợp, hướng dẫn filter ngắn gọn.`;

            case 'course-detail':
                if (courseInfo) {
                    return `${basePrompt}
${statsInfo}

🎯 KHÓA HỌC: **${courseInfo.title}**
• Giá: ${courseInfo.price === 0 ? 'Miễn phí' : courseInfo.price.toLocaleString() + ' VND'}
• Đánh giá: ${courseInfo.averageRating || 0}/5⭐ (${courseInfo.totalRatings || 0} đánh giá)
• ${courseInfo.totalStudents || 0} học viên • ${courseInfo.totalLessons || 0} bài học
• ${courseInfo.level} level • ${courseInfo.domain}

Tư vấn ngắn gọn về khóa học, phù hợp với ai, lợi ích chính.`;

                }
                break;

            default:
                return `${basePrompt}
${statsInfo}

🤖 TRỢ LÝ AI:
• Tư vấn khóa học phù hợp
• Hỗ trợ thông tin hệ thống  
• Hướng dẫn ngắn gọn

Trả lời ngắn gọn, thân thiện, hữu ích.`;
        }

        return basePrompt;
    }

    /**
     * Generate general response for any question
     */
    async generateGeneralResponse(userMessage: string): Promise<string> {
        try {
            const prompt = `Bạn là AI Assistant của hệ thống LMS.
Trả lời câu hỏi: "${userMessage}"

Luôn trả lời bằng tiếng Việt, ngắn gọn và hữu ích.
Nếu không biết câu trả lời, hãy nói "Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng liên hệ hỗ trợ."`;

            return await this.generateContent(prompt);
        } catch (error) {

            return 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.';
        }
    }

    /**
     * Test connection to Gemini API
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.generateContent('Hello');
            return !!response && response.length > 0;
        } catch (error) {

            return false;
        }
    }
}

export default GeminiService;
