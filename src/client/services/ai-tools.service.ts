import { AIToolsUsage } from '../../shared/models/core/AIToolsUsage';
import mongoose from 'mongoose';

export class AIToolsService {
    /**
     * Get available AI tools
     */
    static async getAITools() {
        return {
            tools: [
                {
                    id: 'content-generator',
                    name: 'Content Generator',
                    description: 'Generate course content, lessons, and descriptions with AI',
                    icon: 'edit',
                    category: 'content',
                    available: true
                },
                {
                    id: 'quiz-generator',
                    name: 'Quiz Generator',
                    description: 'Create quizzes and assessments automatically',
                    icon: 'quiz',
                    category: 'assessment',
                    available: true
                },
                {
                    id: 'translator',
                    name: 'Translator',
                    description: 'Translate content to multiple languages',
                    icon: 'translate',
                    category: 'translation',
                    available: true
                },
                {
                    id: 'avatar-generator',
                    name: 'Avatar Generator',
                    description: 'Create professional avatars with AI',
                    icon: 'person',
                    category: 'media',
                    available: true
                },
                {
                    id: 'thumbnail-generator',
                    name: 'Thumbnail Generator',
                    description: 'Generate eye-catching course thumbnails',
                    icon: 'image',
                    category: 'media',
                    available: true
                },
                {
                    id: 'content-moderator',
                    name: 'Content Moderator',
                    description: 'Check content for inappropriate material',
                    icon: 'shield',
                    category: 'moderation',
                    available: true
                }
            ]
        };
    }

    /**
     * Get usage statistics
     */
    static async getUsageStats(userId: string) {
        const [totalUsage, thisMonth, usageByTool, recent] = await Promise.all([
            AIToolsUsage.countDocuments({ userId }),
            AIToolsUsage.countDocuments({
                userId,
                createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }),
            AIToolsUsage.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                { $group: { _id: '$tool', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            AIToolsUsage.find({ userId }).sort({ createdAt: -1 }).limit(10).lean()
        ]);

        const totalCreditsUsed = await AIToolsUsage.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: '$creditsUsed' } } }
        ]);

        return {
            totalUsage,
            thisMonth,
            remainingCredits: 1000 - (totalCreditsUsed[0]?.total || 0), // Assuming 1000 credits limit
            usageByTool: usageByTool.map(u => ({ tool: u._id, count: u.count })),
            recentUsage: recent.map(r => ({
                date: r.createdAt,
                tool: r.tool,
                creditsUsed: r.creditsUsed
            }))
        };
    }

    /**
     * Generate content
     */
    static async generateContent(userId: string, data: any) {
        const creditsUsed = 10;

        const usage = new AIToolsUsage({
            userId,
            tool: 'Content Generator',
            category: 'content',
            action: 'generate_content',
            creditsUsed,
            inputData: { prompt: data.prompt, type: data.type },
            outputData: { content: `AI-generated content based on: ${data.prompt}` },
            metadata: { tokens: 150 },
            status: 'success'
        });

        await usage.save();

        return {
            generatedContent: `This is AI-generated content based on: ${data.prompt}`,
            tokens: 150,
            creditsUsed,
            suggestions: [
                'Add more examples',
                'Include practical exercises',
                'Consider adding visual aids'
            ]
        };
    }

    /**
     * Generate quiz
     */
    static async generateQuiz(userId: string, data: any) {
        const creditsUsed = data.questionCount * 2;

        const questions = [];
        for (let i = 0; i < data.questionCount; i++) {
            questions.push({
                id: `q${i + 1}`,
                question: `Question ${i + 1} about ${data.topic}`,
                type: 'multiple_choice',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A',
                explanation: 'This is the correct answer because...'
            });
        }

        const usage = new AIToolsUsage({
            userId,
            tool: 'Quiz Generator',
            category: 'assessment',
            action: 'generate_quiz',
            creditsUsed,
            inputData: data,
            outputData: { questions },
            status: 'success'
        });

        await usage.save();

        return {
            questions,
            topic: data.topic,
            difficulty: data.difficulty || 'medium',
            creditsUsed
        };
    }

    /**
     * Translate content
     */
    static async translate(userId: string, data: any) {
        const creditsUsed = Math.ceil(data.text.length / 100);

        const usage = new AIToolsUsage({
            userId,
            tool: 'Translator',
            category: 'translation',
            action: 'translate',
            creditsUsed,
            inputData: data,
            outputData: { translatedText: `[Translated to ${data.targetLanguage}] ${data.text}` },
            status: 'success'
        });

        await usage.save();

        return {
            translatedText: `[Translated to ${data.targetLanguage}] ${data.text}`,
            sourceLanguage: data.sourceLanguage || 'auto-detected',
            targetLanguage: data.targetLanguage,
            confidence: 0.95,
            creditsUsed
        };
    }

    /**
     * Summarize content
     */
    static async summarize(userId: string, data: any) {
        const creditsUsed = Math.ceil(data.text.length / 200);

        const usage = new AIToolsUsage({
            userId,
            tool: 'Summarizer',
            category: 'content',
            action: 'summarize',
            creditsUsed,
            inputData: data,
            outputData: { summary: `Summary of text` },
            status: 'success'
        });

        await usage.save();

        return {
            summary: `This is a ${data.length || 'medium'} summary of the provided text...`,
            keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
            format: data.format || 'paragraph',
            creditsUsed
        };
    }

    /**
     * Improve text
     */
    static async improveText(userId: string, data: any) {
        const creditsUsed = 5;

        const usage = new AIToolsUsage({
            userId,
            tool: 'Text Improver',
            category: 'content',
            action: 'improve_text',
            creditsUsed,
            inputData: data,
            outputData: { improvedText: `[Improved] ${data.text}` },
            status: 'success'
        });

        await usage.save();

        return {
            improvedText: `[Improved] ${data.text}`,
            suggestions: [
                { type: 'grammar', original: 'their', suggestion: 'there', explanation: 'Wrong usage of their/there' },
                { type: 'clarity', original: 'very good', suggestion: 'excellent', explanation: 'More precise word choice' }
            ],
            improvementScore: 8.5,
            creditsUsed
        };
    }

    // ========== AVATAR ==========

    /**
     * Generate avatar
     */
    static async generateAvatar(userId: string, data: any) {
        const creditsUsed = 20;

        const avatarUrl = '/generated-avatars/avatar_' + Date.now() + '.png';

        const usage = new AIToolsUsage({
            userId,
            tool: 'Avatar Generator',
            category: 'media',
            action: 'generate_avatar',
            creditsUsed,
            inputData: data,
            outputData: { url: avatarUrl },
            status: 'success'
        });

        await usage.save();

        return {
            _id: usage._id,
            url: avatarUrl,
            style: data.style || 'professional',
            description: data.description,
            createdAt: usage.createdAt,
            creditsUsed
        };
    }

    /**
     * Get avatar templates
     */
    static async getAvatarTemplates() {
        return {
            templates: [
                { id: 'temp1', name: 'Professional Male', preview: '/templates/avatar1.png', style: 'professional' },
                { id: 'temp2', name: 'Professional Female', preview: '/templates/avatar2.png', style: 'professional' },
                { id: 'temp3', name: 'Cartoon Style', preview: '/templates/avatar3.png', style: 'cartoon' }
            ]
        };
    }

    /**
     * Customize avatar
     */
    static async customizeAvatar(userId: string, data: any) {
        const creditsUsed = 15;

        const usage = new AIToolsUsage({
            userId,
            tool: 'Avatar Generator',
            category: 'media',
            action: 'customize_avatar',
            creditsUsed,
            inputData: data,
            outputData: { url: '/customized-avatars/avatar_custom.png' },
            status: 'success'
        });

        await usage.save();

        return {
            _id: usage._id,
            templateId: data.templateId,
            customizations: data.customizations,
            url: '/customized-avatars/avatar_custom.png',
            createdAt: usage.createdAt,
            creditsUsed
        };
    }

    /**
     * Get avatar history
     */
    static async getAvatarHistory(userId: string, filters: any) {
        const { page, limit } = filters;
        const skip = (page - 1) * limit;

        const query = {
            userId,
            tool: 'Avatar Generator'
        };

        const [history, total] = await Promise.all([
            AIToolsUsage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AIToolsUsage.countDocuments(query)
        ]);

        return {
            history: history.map(h => ({
                _id: h._id,
                url: h.outputData?.url || '/avatars/default.png',
                style: h.inputData?.style || 'professional',
                createdAt: h.createdAt,
                creditsUsed: h.creditsUsed
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
    }

    // ========== THUMBNAIL ==========

    /**
     * Generate thumbnail
     */
    static async generateThumbnail(userId: string, data: any) {
        const creditsUsed = 25;

        const thumbnailUrl = '/generated-thumbnails/thumbnail_' + Date.now() + '.png';

        const usage = new AIToolsUsage({
            userId,
            tool: 'Thumbnail Generator',
            category: 'media',
            action: 'generate_thumbnail',
            creditsUsed,
            inputData: data,
            outputData: { url: thumbnailUrl },
            status: 'success'
        });

        await usage.save();

        return {
            _id: usage._id,
            url: thumbnailUrl,
            courseTitle: data.courseTitle,
            style: data.style || 'modern',
            colorScheme: data.colorScheme,
            createdAt: usage.createdAt,
            creditsUsed
        };
    }

    /**
     * Get thumbnail templates
     */
    static async getThumbnailTemplates() {
        return {
            templates: [
                { id: 'thumb1', name: 'Modern Tech', preview: '/templates/thumb1.png', style: 'modern' },
                { id: 'thumb2', name: 'Minimalist', preview: '/templates/thumb2.png', style: 'minimalist' },
                { id: 'thumb3', name: 'Vibrant Colors', preview: '/templates/thumb3.png', style: 'vibrant' }
            ]
        };
    }

    /**
     * Customize thumbnail
     */
    static async customizeThumbnail(userId: string, data: any) {
        const creditsUsed = 20;

        const usage = new AIToolsUsage({
            userId,
            tool: 'Thumbnail Generator',
            category: 'media',
            action: 'customize_thumbnail',
            creditsUsed,
            inputData: data,
            outputData: { url: '/customized-thumbnails/thumb_custom.png' },
            status: 'success'
        });

        await usage.save();

        return {
            _id: usage._id,
            templateId: data.templateId,
            customizations: data.customizations,
            url: '/customized-thumbnails/thumb_custom.png',
            createdAt: usage.createdAt,
            creditsUsed
        };
    }

    /**
     * Get thumbnail history
     */
    static async getThumbnailHistory(userId: string, filters: any) {
        const { page, limit } = filters;
        const skip = (page - 1) * limit;

        const query = {
            userId,
            tool: 'Thumbnail Generator'
        };

        const [history, total] = await Promise.all([
            AIToolsUsage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AIToolsUsage.countDocuments(query)
        ]);

        return {
            history: history.map(h => ({
                _id: h._id,
                url: h.outputData?.url || '/thumbnails/default.png',
                courseTitle: h.inputData?.courseTitle || 'Untitled',
                style: h.inputData?.style || 'modern',
                createdAt: h.createdAt,
                creditsUsed: h.creditsUsed
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
    }

    // ========== MODERATION ==========

    /**
     * Check content
     */
    static async checkContent(userId: string, data: any) {
        const creditsUsed = 5;

        // Simple mock moderation - in real app, use actual AI moderation API
        const isSafe = !data.content.toLowerCase().includes('spam');

        const usage = new AIToolsUsage({
            userId,
            tool: 'Content Moderator',
            category: 'moderation',
            action: 'check_content',
            creditsUsed,
            inputData: data,
            outputData: {
                status: isSafe ? 'approved' : 'flagged',
                confidence: 0.95
            },
            status: 'success'
        });

        await usage.save();

        return {
            _id: usage._id,
            content: data.content,
            type: data.type,
            status: isSafe ? 'approved' : 'flagged',
            confidence: 0.95,
            flags: isSafe ? [] : ['spam'],
            suggestions: isSafe ? ['Content looks appropriate'] : ['Review content for spam'],
            creditsUsed,
            checkedAt: usage.createdAt
        };
    }

    /**
     * Get moderation history
     */
    static async getModerationHistory(userId: string, filters: any) {
        const { page, limit, status } = filters;
        const skip = (page - 1) * limit;

        const query: any = {
            userId,
            tool: 'Content Moderator'
        };

        if (status) {
            query['outputData.status'] = status;
        }

        const [history, total] = await Promise.all([
            AIToolsUsage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AIToolsUsage.countDocuments(query)
        ]);

        return {
            history: history.map(h => ({
                _id: h._id,
                content: h.inputData?.content || '',
                type: h.inputData?.type || 'text',
                status: h.outputData?.status || 'approved',
                confidence: h.outputData?.confidence || 0,
                checkedAt: h.createdAt
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
    }

    /**
     * Bulk check content
     */
    static async bulkCheckContent(userId: string, items: any[]) {
        const creditsPerItem = 5;
        const totalCredits = items.length * creditsPerItem;

        const results = items.map((item, index) => {
            const isSafe = !item.content.toLowerCase().includes('spam');
            return {
                id: `check_${index}`,
                content: item.content,
                status: isSafe ? 'approved' : 'flagged',
                confidence: 0.95,
                flags: isSafe ? [] : ['spam']
            };
        });

        const usage = new AIToolsUsage({
            userId,
            tool: 'Content Moderator',
            category: 'moderation',
            action: 'bulk_check',
            creditsUsed: totalCredits,
            inputData: { itemCount: items.length },
            outputData: { results },
            status: 'success'
        });

        await usage.save();

        return {
            results,
            totalChecked: items.length,
            creditsUsed: totalCredits
        };
    }

    /**
     * Get moderation stats
     */
    static async getModerationStats(userId: string) {
        const stats = await AIToolsUsage.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    tool: 'Content Moderator'
                }
            },
            {
                $group: {
                    _id: '$outputData.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = stats.reduce((sum, s) => sum + s.count, 0);
        const approved = stats.find(s => s._id === 'approved')?.count || 0;
        const flagged = stats.find(s => s._id === 'flagged')?.count || 0;
        const rejected = stats.find(s => s._id === 'rejected')?.count || 0;

        const totalCredits = await AIToolsUsage.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    tool: 'Content Moderator'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$creditsUsed' }
                }
            }
        ]);

        return {
            totalChecks: total,
            approved,
            flagged,
            rejected,
            averageConfidence: 0.94,
            creditsUsed: totalCredits[0]?.total || 0
        };
    }

    /**
     * Report content
     */
    static async reportContent(userId: string, data: any) {
        const usage = new AIToolsUsage({
            userId,
            tool: 'Content Moderator',
            category: 'moderation',
            action: 'report_content',
            creditsUsed: 0,
            inputData: data,
            status: 'success'
        });

        await usage.save();

        return {
            _id: usage._id,
            contentId: data.contentId,
            contentType: data.contentType,
            reason: data.reason,
            details: data.details,
            reportedBy: userId,
            status: 'pending',
            createdAt: usage.createdAt
        };
    }
}
