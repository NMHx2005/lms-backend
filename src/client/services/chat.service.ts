import { ChatHistory, IChatHistory, IChatMessage } from '../../shared/models';
import GeminiService, { ChatContext } from '../../shared/services/ai/gemini.service';
import { SystemDataService } from '../../shared/services/ai/system-data.service';
import { ClientCourseService } from './course.service';

export class ChatService {
    private geminiService: GeminiService;

    constructor() {
        this.geminiService = new GeminiService();
    }

    /**
     * Send message and get AI response
     */
    async sendMessage(
        userId: string,
        message: string,
        context: ChatContext
    ): Promise<{ response: string; sessionId: string }> {
        try {
            // Get or create active session
            let session = await this.getActiveSession(userId);
            if (!session) {
                session = await this.createNewSession(userId, context);
            }

            // Add user message to session
            const userMessage: IChatMessage = {
                role: 'user',
                content: message,
                timestamp: new Date(),
                context: {
                    courseId: context.courseId,
                    page: context.currentPage
                }
            };

            await (session as any).addMessage(userMessage);

            // Get AI response
            const response = await this.generateAIResponse(message, context);

            // Add AI response to session
            const aiMessage: IChatMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                context: {
                    courseId: context.courseId,
                    page: context.currentPage
                }
            };

            await (session as any).addMessage(aiMessage);

            return {
                response,
                sessionId: session.sessionId
            };
        } catch (error) {

            throw new Error('Failed to process message');
        }
    }

    /**
     * Get active chat session for user
     */
    async getActiveSession(userId: string): Promise<IChatHistory | null> {
        return await (ChatHistory as any).findActiveSession(userId);
    }

    /**
     * Create new chat session
     */
    async createNewSession(userId: string, context: ChatContext): Promise<IChatHistory> {
        return await (ChatHistory as any).createNewSession(userId, context);
    }

    /**
     * Get chat history for user
     */
    async getChatHistory(userId: string, limit: number = 20): Promise<IChatHistory[]> {
        return await (ChatHistory as any).getUserChatHistory(userId, limit);
    }

    /**
     * End current session
     */
    async endSession(userId: string): Promise<void> {
        const session = await this.getActiveSession(userId);
        if (session) {
            await (session as any).endSession();
        }
    }

    /**
     * Generate AI response based on context
     */
    private async generateAIResponse(message: string, context: ChatContext): Promise<string> {
        try {
            // Enrich context with course data if needed
            const enrichedContext = await this.enrichContext(context);

            // Generate response using Gemini
            return await this.geminiService.generateCourseRecommendation(message, enrichedContext);
        } catch (error) {

            return 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.';
        }
    }

    /**
     * Enrich context with additional data from database
     */
    private async enrichContext(context: ChatContext): Promise<ChatContext> {
        try {

            // If we have courseId, get detailed course information
            if (context.courseId) {
                try {
                    const courseData = await ClientCourseService.getCourseById(context.courseId);
                    if (courseData) {
                        context.courseInfo = courseData;

                    }
                } catch (error: any) {

                }
            }

            // Always load available courses for recommendations
            try {
                // Use static method correctly
                const coursesResponse = await (ClientCourseService as any).getCourses({
                    page: 1,
                    limit: 50, // Get more courses for better recommendations
                    status: 'published'
                });

                if (coursesResponse && coursesResponse.data && coursesResponse.data.courses) {
                    context.availableCourses = coursesResponse.data.courses;

                    // Add course statistics
                    context.courseStats = {
                        totalCourses: coursesResponse.data.total,
                        domains: [...new Set(coursesResponse.data.courses.map((c: any) => c.domain))] as string[],
                        levels: [...new Set(coursesResponse.data.courses.map((c: any) => c.level))] as string[],
                        priceRange: {
                            min: Math.min(...coursesResponse.data.courses.map((c: any) => c.price || 0)),
                            max: Math.max(...coursesResponse.data.courses.map((c: any) => c.price || 0))
                        }
                    };
                }
            } catch (error: any) {

            }

            // Load popular courses for home page
            if (context.currentPage === 'home') {
                try {
                    const popularCourses = await (ClientCourseService as any).getPopularCourses();
                    if (popularCourses && Array.isArray(popularCourses)) {
                        context.popularCourses = popularCourses.slice(0, 10);

                    }
                } catch (error: any) {

                }
            }

            // Load categories/domains - simplified for now
            try {
                // For now, use hardcoded domains to avoid import issues
                context.availableDomains = ['Programming', 'Design', 'Business', 'Marketing', 'Data Science'];

            } catch (error: any) {

            }

            // Load comprehensive system data
            try {

                const systemData = await SystemDataService.getSystemData();
                context.systemData = systemData;

            } catch (error: any) {

            }

            return context;
        } catch (error) {

            return context;
        }
    }

    /**
     * Test AI connection
     */
    async testAIConnection(): Promise<boolean> {
        try {
            return await this.geminiService.testConnection();
        } catch (error) {

            return false;
        }
    }

    /**
     * Get chat statistics for user
     */
    async getChatStats(userId: string): Promise<{
        totalMessages: number;
        totalSessions: number;
        lastActivity: Date | null;
    }> {
        try {
            const sessions = await this.getChatHistory(userId, 100);

            const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
            const totalSessions = sessions.length;
            const lastActivity = sessions.length > 0 ? sessions[0].updatedAt : null;

            return {
                totalMessages,
                totalSessions,
                lastActivity
            };
        } catch (error) {

            return {
                totalMessages: 0,
                totalSessions: 0,
                lastActivity: null
            };
        }
    }
}

export default ChatService;
