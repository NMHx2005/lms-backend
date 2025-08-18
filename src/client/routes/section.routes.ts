import { Router } from 'express';
import { ClientSectionController } from '../controllers/section.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { clientSectionValidation } from '../validators/section.validator';

const router = Router();

// All section routes require authentication (enrolled students only)
router.use(authenticate);

// Get sections by course (for enrolled students)
router.get('/course/:courseId', validateRequest(clientSectionValidation.courseId), ClientSectionController.getSectionsByCourse);

// Get section by ID with progress
router.get('/:id', validateRequest(clientSectionValidation.sectionId), ClientSectionController.getSectionById);

// Get section progress
router.get('/:id/progress', validateRequest(clientSectionValidation.sectionId), ClientSectionController.getSectionProgress);

// Get next section (for navigation)
router.get('/:id/next', validateRequest(clientSectionValidation.sectionId), ClientSectionController.getNextSection);

// Get previous section (for navigation)
router.get('/:id/previous', validateRequest(clientSectionValidation.sectionId), ClientSectionController.getPreviousSection);

// Get section overview (summary)
router.get('/course/:courseId/overview', validateRequest(clientSectionValidation.courseId), ClientSectionController.getSectionOverview);

export default router;
