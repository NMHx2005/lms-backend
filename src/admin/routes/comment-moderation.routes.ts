import { Router } from 'express';
import { authenticate, requireAdmin } from '../../shared/middleware/auth';
import CommentModerationController from '../controllers/comment-moderation.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Moderation queue
router.get('/moderation', CommentModerationController.getModerationQueue);
router.get('/moderation-stats', CommentModerationController.getModerationStats);

// Individual comment moderation
router.post('/:id/moderate', CommentModerationController.moderateComment as any);
router.get('/:id/reports', CommentModerationController.getCommentReports as any);
router.put('/:id/reports/:reportId/resolve', CommentModerationController.resolveReport as any);
router.get('/:id/audit', CommentModerationController.getCommentAudit as any);

// Bulk moderation
router.post('/bulk-moderate', CommentModerationController.bulkModerateComments as any);

export default router;
