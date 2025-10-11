import { Router } from 'express';
import AIToolsController from '../controllers/ai-tools.controller';
import { authenticate, requireTeacher } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication and teacher role middleware to all routes
router.use(authenticate);
router.use(requireTeacher);

/**
 * @route   GET /api/client/ai-tools
 * @desc    Get available AI tools
 * @access  Teacher
 */
router.get('/', AIToolsController.getAITools);

/**
 * @route   GET /api/client/ai-tools/usage
 * @desc    Get AI tools usage statistics
 * @access  Teacher
 */
router.get('/usage', AIToolsController.getUsageStats);

/**
 * @route   POST /api/client/ai-tools/generate-content
 * @desc    Generate content with AI
 * @access  Teacher
 */
router.post(
    '/generate-content',
    [
        body('prompt').isString().trim().isLength({ min: 10, max: 1000 }).withMessage('Prompt must be 10-1000 characters'),
        body('type').isIn(['lesson', 'description', 'outline', 'summary']).withMessage('Invalid content type'),
        body('language').optional().isString().trim(),
        body('tone').optional().isIn(['professional', 'casual', 'academic', 'friendly']),
        body('length').optional().isIn(['short', 'medium', 'long']),
        validateRequest
    ],
    AIToolsController.generateContent
);

/**
 * @route   POST /api/client/ai-tools/generate-quiz
 * @desc    Generate quiz questions with AI
 * @access  Teacher
 */
router.post(
    '/generate-quiz',
    [
        body('topic').isString().trim().isLength({ min: 5, max: 200 }).withMessage('Topic must be 5-200 characters'),
        body('questionCount').isInt({ min: 1, max: 50 }).withMessage('Question count must be 1-50'),
        body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
        body('questionTypes').optional().isArray().withMessage('Question types must be an array'),
        validateRequest
    ],
    AIToolsController.generateQuiz
);

/**
 * @route   POST /api/client/ai-tools/translate
 * @desc    Translate content
 * @access  Teacher
 */
router.post(
    '/translate',
    [
        body('text').isString().trim().isLength({ min: 1, max: 5000 }).withMessage('Text must be 1-5000 characters'),
        body('targetLanguage').isString().trim().isLength({ min: 2, max: 10 }).withMessage('Valid target language required'),
        body('sourceLanguage').optional().isString().trim(),
        validateRequest
    ],
    AIToolsController.translate
);

/**
 * @route   POST /api/client/ai-tools/summarize
 * @desc    Summarize content
 * @access  Teacher
 */
router.post(
    '/summarize',
    [
        body('text').isString().trim().isLength({ min: 100, max: 10000 }).withMessage('Text must be 100-10000 characters'),
        body('length').optional().isIn(['short', 'medium', 'detailed']),
        body('format').optional().isIn(['paragraph', 'bullets', 'numbered']),
        validateRequest
    ],
    AIToolsController.summarize
);

/**
 * @route   POST /api/client/ai-tools/improve-text
 * @desc    Improve text with AI suggestions
 * @access  Teacher
 */
router.post(
    '/improve-text',
    [
        body('text').isString().trim().isLength({ min: 10, max: 5000 }),
        body('improvementType').optional().isIn(['grammar', 'clarity', 'engagement', 'all']),
        validateRequest
    ],
    AIToolsController.improveText
);

// ========== AVATAR TOOL ==========

/**
 * @route   POST /api/client/ai-tools/avatar/generate
 * @desc    Generate avatar with AI
 * @access  Teacher
 */
router.post(
    '/avatar/generate',
    [
        body('description').isString().trim().isLength({ min: 10, max: 500 }),
        body('style').optional().isIn(['professional', 'cartoon', 'realistic', 'artistic']),
        body('gender').optional().isIn(['male', 'female', 'neutral']),
        body('ageRange').optional().isIn(['young', 'middle', 'senior']),
        validateRequest
    ],
    AIToolsController.generateAvatar
);

/**
 * @route   GET /api/client/ai-tools/avatar/templates
 * @desc    Get avatar templates
 * @access  Teacher
 */
router.get('/avatar/templates', AIToolsController.getAvatarTemplates);

/**
 * @route   POST /api/client/ai-tools/avatar/customize
 * @desc    Customize avatar
 * @access  Teacher
 */
router.post(
    '/avatar/customize',
    [
        body('templateId').isString().trim(),
        body('customizations').isObject(),
        validateRequest
    ],
    AIToolsController.customizeAvatar
);

/**
 * @route   POST /api/client/ai-tools/avatar/upload
 * @desc    Upload custom avatar
 * @access  Teacher
 */
router.post('/avatar/upload', AIToolsController.uploadAvatar);

/**
 * @route   GET /api/client/ai-tools/avatar/history
 * @desc    Get avatar generation history
 * @access  Teacher
 */
router.get(
    '/avatar/history',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 }),
        validateRequest
    ],
    AIToolsController.getAvatarHistory
);

// ========== THUMBNAIL TOOL ==========

/**
 * @route   POST /api/client/ai-tools/thumbnail/generate
 * @desc    Generate thumbnail with AI
 * @access  Teacher
 */
router.post(
    '/thumbnail/generate',
    [
        body('courseTitle').isString().trim().isLength({ min: 5, max: 200 }),
        body('description').optional().isString().trim(),
        body('style').optional().isIn(['modern', 'minimalist', 'vibrant', 'professional']),
        body('colorScheme').optional().isString().trim(),
        body('includeText').optional().isBoolean(),
        validateRequest
    ],
    AIToolsController.generateThumbnail
);

/**
 * @route   GET /api/client/ai-tools/thumbnail/templates
 * @desc    Get thumbnail templates
 * @access  Teacher
 */
router.get('/thumbnail/templates', AIToolsController.getThumbnailTemplates);

/**
 * @route   POST /api/client/ai-tools/thumbnail/customize
 * @desc    Customize thumbnail
 * @access  Teacher
 */
router.post(
    '/thumbnail/customize',
    [
        body('templateId').isString().trim(),
        body('customizations').isObject(),
        body('customizations.title').optional().isString().trim(),
        body('customizations.subtitle').optional().isString().trim(),
        body('customizations.backgroundColor').optional().isString().trim(),
        validateRequest
    ],
    AIToolsController.customizeThumbnail
);

/**
 * @route   POST /api/client/ai-tools/thumbnail/upload
 * @desc    Upload custom thumbnail
 * @access  Teacher
 */
router.post('/thumbnail/upload', AIToolsController.uploadThumbnail);

/**
 * @route   GET /api/client/ai-tools/thumbnail/history
 * @desc    Get thumbnail generation history
 * @access  Teacher
 */
router.get(
    '/thumbnail/history',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 50 }),
        validateRequest
    ],
    AIToolsController.getThumbnailHistory
);

// ========== MODERATION TOOL ==========

/**
 * @route   POST /api/client/ai-tools/moderation/check
 * @desc    Check content with AI moderation
 * @access  Teacher
 */
router.post(
    '/moderation/check',
    [
        body('content').isString().trim().isLength({ min: 1, max: 10000 }),
        body('type').isIn(['text', 'title', 'description', 'comment']),
        body('strictness').optional().isIn(['low', 'medium', 'high']),
        validateRequest
    ],
    AIToolsController.checkContent
);

/**
 * @route   GET /api/client/ai-tools/moderation/history
 * @desc    Get moderation history
 * @access  Teacher
 */
router.get(
    '/moderation/history',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['approved', 'flagged', 'rejected']),
        validateRequest
    ],
    AIToolsController.getModerationHistory
);

/**
 * @route   POST /api/client/ai-tools/moderation/bulk-check
 * @desc    Bulk check multiple content items
 * @access  Teacher
 */
router.post(
    '/moderation/bulk-check',
    [
        body('items').isArray({ min: 1, max: 50 }).withMessage('Items array must contain 1-50 items'),
        body('items.*.content').isString().trim(),
        body('items.*.type').isString().trim(),
        validateRequest
    ],
    AIToolsController.bulkCheckContent
);

/**
 * @route   GET /api/client/ai-tools/moderation/stats
 * @desc    Get moderation statistics
 * @access  Teacher
 */
router.get('/moderation/stats', AIToolsController.getModerationStats);

/**
 * @route   POST /api/client/ai-tools/moderation/report
 * @desc    Report content for manual review
 * @access  Teacher
 */
router.post(
    '/moderation/report',
    [
        body('contentId').isString().trim(),
        body('contentType').isString().trim(),
        body('reason').isString().trim().isLength({ min: 10, max: 500 }),
        body('details').optional().isString().trim(),
        validateRequest
    ],
    AIToolsController.reportContent
);

export default router;

