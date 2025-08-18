import express from 'express';
import { SectionController } from '../controllers/section.controller';
import { adminSectionValidation } from '../validators/section.validator';
import { validateRequest } from '../../shared/middleware/validation';

const router = express.Router();

// Get sections by course
router.get('/course/:courseId', validateRequest(adminSectionValidation.courseId), SectionController.getSectionsByCourse);

// Get section statistics
router.get('/course/:courseId/stats', validateRequest(adminSectionValidation.courseId), SectionController.getSectionStats);

// Create a new section
router.post('/', validateRequest(adminSectionValidation.createSection), SectionController.createSection);

// Get section by ID
router.get('/:id', validateRequest(adminSectionValidation.sectionId), SectionController.getSectionById);

// Update section
router.put('/:id', validateRequest([...adminSectionValidation.sectionId, ...adminSectionValidation.updateSection]), SectionController.updateSection);

// Delete section
router.delete('/:id', validateRequest(adminSectionValidation.sectionId), SectionController.deleteSection);

// Reorder sections
router.patch('/course/:courseId/reorder', validateRequest(adminSectionValidation.courseId), SectionController.reorderSections);

// Toggle section visibility
router.patch('/:id/visibility', validateRequest(adminSectionValidation.sectionId), SectionController.toggleSectionVisibility);

// Bulk update sections
router.patch('/course/:courseId/bulk-update', validateRequest(adminSectionValidation.courseId), SectionController.bulkUpdateSections);

export default router;
