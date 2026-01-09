import { Router, RequestHandler } from 'express';
import { LinkController } from '../controllers/link.controller';
import { authenticate } from '../../shared/middleware/auth';
import { requireTeacher } from '../../shared/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Link preview (for all authenticated users)
router.post('/preview', LinkController.getLinkPreview as any);

// Link validation (for all authenticated users)
router.post('/validate', LinkController.validateLink as any);

// Track link click (for all authenticated users)
router.post('/track', LinkController.trackLinkClick as any);

// Get link analytics (for teachers only)
router.get('/analytics/:lessonId', requireTeacher, LinkController.getLinkAnalytics as any);

export default router;
