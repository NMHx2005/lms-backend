import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import CommentController from '../controllers/comment.controller';

const router = Router();

// Public routes
router.get('/', CommentController.getComments);
router.get('/tree/:contentType/:contentId', CommentController.getCommentTree);
router.get('/:id', CommentController.getCommentById);
router.get('/stats', CommentController.getCommentStats);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/', CommentController.createComment as any);
router.put('/:id', CommentController.updateComment as any);
router.delete('/:id', CommentController.deleteComment as any);

// Engagement routes
router.post('/:id/like', CommentController.toggleLike as any);
router.post('/:id/dislike', CommentController.toggleDislike as any);
router.post('/:id/helpful', CommentController.markAsHelpful as any);
router.post('/:id/report', CommentController.reportComment as any);

export default router;
