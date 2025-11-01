import { Router } from 'express';
import { ClientSectionController } from '../controllers/section.controller';
import { authenticate } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { clientSectionValidation } from '../validators/section.validator';

const router = Router();

// ========== PUBLIC ROUTES (No authentication required) ==========
// MUST be BEFORE authenticate middleware
// Get sections for preview (public - anyone can view course structure)
router.get('/course/:courseId/preview', validateRequest(clientSectionValidation.getSectionsByCourse), ClientSectionController.getSectionsForPreview);

// ========== PROTECTED ROUTES (Authentication required) ==========
// All section routes below require authentication (enrolled students and teachers)
router.use(authenticate);

// Get sections by course (for enrolled students and teachers)
router.get('/course/:courseId', validateRequest(clientSectionValidation.getSectionsByCourse), ClientSectionController.getSectionsByCourse);

// Teacher CRUD operations (must be before /:id to avoid route conflicts)
router.post('/', ClientSectionController.createSection);
router.put('/:id', ClientSectionController.updateSection);
router.delete('/:id', ClientSectionController.deleteSection);
router.patch('/course/:courseId/reorder', ClientSectionController.reorderSections);

// Get section by ID with progress
router.get('/:id', validateRequest(clientSectionValidation.getSectionById), ClientSectionController.getSectionById);

// Get section progress
router.get('/:id/progress', validateRequest(clientSectionValidation.getSectionProgress), ClientSectionController.getSectionProgress);

// Get next section (for navigation)
router.get('/:id/next', validateRequest(clientSectionValidation.getNextSection), ClientSectionController.getNextSection);

// Get previous section (for navigation)
router.get('/:id/previous', validateRequest(clientSectionValidation.getPreviousSection), ClientSectionController.getPreviousSection);

// Get section overview (summary)
router.get('/course/:courseId/overview', validateRequest(clientSectionValidation.getSectionOverview), ClientSectionController.getSectionOverview);

export default router;
