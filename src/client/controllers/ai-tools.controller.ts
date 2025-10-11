import { Request, Response } from 'express';
import { AIToolsService } from '../services/ai-tools.service';

export class AIToolsController {
    /**
     * Get available AI tools
     */
    static async getAITools(req: Request, res: Response) {
        try {
            const tools = await AIToolsService.getAITools();

            res.json({
                success: true,
                data: tools
            });
        } catch (error) {
            console.error('Error getting AI tools:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get usage stats
     */
    static async getUsageStats(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const stats = await AIToolsService.getUsageStats(teacherId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting usage stats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Generate content
     */
    static async generateContent(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { prompt, type, language, tone, length } = req.body;

            const content = await AIToolsService.generateContent(teacherId, {
                prompt,
                type,
                language,
                tone,
                length
            });

            res.json({
                success: true,
                data: content
            });
        } catch (error: any) {
            console.error('Error generating content:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Generate quiz
     */
    static async generateQuiz(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { topic, questionCount, difficulty, questionTypes } = req.body;

            const quiz = await AIToolsService.generateQuiz(teacherId, {
                topic,
                questionCount,
                difficulty,
                questionTypes
            });

            res.json({
                success: true,
                data: quiz
            });
        } catch (error) {
            console.error('Error generating quiz:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Translate content
     */
    static async translate(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { text, targetLanguage, sourceLanguage } = req.body;

            const translation = await AIToolsService.translate(teacherId, {
                text,
                targetLanguage,
                sourceLanguage
            });

            res.json({
                success: true,
                data: translation
            });
        } catch (error) {
            console.error('Error translating:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Summarize content
     */
    static async summarize(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { text, length, format } = req.body;

            const summary = await AIToolsService.summarize(teacherId, {
                text,
                length,
                format
            });

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error summarizing:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Improve text
     */
    static async improveText(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { text, improvementType } = req.body;

            const improved = await AIToolsService.improveText(teacherId, {
                text,
                improvementType
            });

            res.json({
                success: true,
                data: improved
            });
        } catch (error) {
            console.error('Error improving text:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // ========== AVATAR ==========

    /**
     * Generate avatar
     */
    static async generateAvatar(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { description, style, gender, ageRange } = req.body;

            const avatar = await AIToolsService.generateAvatar(teacherId, {
                description,
                style,
                gender,
                ageRange
            });

            res.json({
                success: true,
                data: avatar
            });
        } catch (error) {
            console.error('Error generating avatar:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get avatar templates
     */
    static async getAvatarTemplates(req: Request, res: Response) {
        try {
            const templates = await AIToolsService.getAvatarTemplates();

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('Error getting templates:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Customize avatar
     */
    static async customizeAvatar(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { templateId, customizations } = req.body;

            const avatar = await AIToolsService.customizeAvatar(teacherId, {
                templateId,
                customizations
            });

            res.json({
                success: true,
                data: avatar
            });
        } catch (error) {
            console.error('Error customizing avatar:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Upload avatar
     */
    static async uploadAvatar(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            // Handle file upload logic here

            res.json({
                success: true,
                message: 'Avatar uploaded successfully'
            });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get avatar history
     */
    static async getAvatarHistory(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { page = 1, limit = 20 } = req.query;

            const result = await AIToolsService.getAvatarHistory(teacherId, {
                page: Number(page),
                limit: Number(limit)
            });

            res.json({
                success: true,
                data: result.history,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error getting avatar history:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // ========== THUMBNAIL ==========

    /**
     * Generate thumbnail
     */
    static async generateThumbnail(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { courseTitle, description, style, colorScheme, includeText } = req.body;

            const thumbnail = await AIToolsService.generateThumbnail(teacherId, {
                courseTitle,
                description,
                style,
                colorScheme,
                includeText
            });

            res.json({
                success: true,
                data: thumbnail
            });
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get thumbnail templates
     */
    static async getThumbnailTemplates(req: Request, res: Response) {
        try {
            const templates = await AIToolsService.getThumbnailTemplates();

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('Error getting templates:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Customize thumbnail
     */
    static async customizeThumbnail(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { templateId, customizations } = req.body;

            const thumbnail = await AIToolsService.customizeThumbnail(teacherId, {
                templateId,
                customizations
            });

            res.json({
                success: true,
                data: thumbnail
            });
        } catch (error) {
            console.error('Error customizing thumbnail:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Upload thumbnail
     */
    static async uploadThumbnail(req: Request, res: Response) {
        try {
            // Handle file upload logic here
            res.json({
                success: true,
                message: 'Thumbnail uploaded successfully'
            });
        } catch (error) {
            console.error('Error uploading thumbnail:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get thumbnail history
     */
    static async getThumbnailHistory(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { page = 1, limit = 20 } = req.query;

            const result = await AIToolsService.getThumbnailHistory(teacherId, {
                page: Number(page),
                limit: Number(limit)
            });

            res.json({
                success: true,
                data: result.history,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error getting thumbnail history:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // ========== MODERATION ==========

    /**
     * Check content
     */
    static async checkContent(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { content, type, strictness } = req.body;

            const result = await AIToolsService.checkContent(teacherId, {
                content,
                type,
                strictness
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error checking content:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get moderation history
     */
    static async getModerationHistory(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { page = 1, limit = 20, status } = req.query;

            const result = await AIToolsService.getModerationHistory(teacherId, {
                page: Number(page),
                limit: Number(limit),
                status: status as string
            });

            res.json({
                success: true,
                data: result.history,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error getting moderation history:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Bulk check content
     */
    static async bulkCheckContent(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { items } = req.body;

            const results = await AIToolsService.bulkCheckContent(teacherId, items);

            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            console.error('Error bulk checking content:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get moderation stats
     */
    static async getModerationStats(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const stats = await AIToolsService.getModerationStats(teacherId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting moderation stats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Report content
     */
    static async reportContent(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { contentId, contentType, reason, details } = req.body;

            const report = await AIToolsService.reportContent(teacherId, {
                contentId,
                contentType,
                reason,
                details
            });

            res.json({
                success: true,
                message: 'Content reported successfully',
                data: report
            });
        } catch (error) {
            console.error('Error reporting content:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

export default AIToolsController;

