import express from 'express';
import { LessonController } from '../controllers/lesson.controller';
import { adminLessonValidation } from '../validators/lesson.validator';
import { validateRequest } from '../../shared/middleware/validation';

const router = express.Router();

// Get lessons by section
router.get('/section/:sectionId', validateRequest(adminLessonValidation.sectionId), LessonController.getLessonsBySection);

// Get lessons by course
router.get('/course/:courseId', validateRequest(adminLessonValidation.courseId), LessonController.getLessonsByCourse);

// Get lesson statistics
router.get('/course/:courseId/stats', validateRequest(adminLessonValidation.courseId), LessonController.getLessonStats);

// Create a new lesson
router.post('/', validateRequest(adminLessonValidation.createLesson), LessonController.createLesson);

// Get lesson by ID
router.get('/:id', validateRequest(adminLessonValidation.lessonId), LessonController.getLessonById);

// Update lesson
router.put('/:id', validateRequest([...adminLessonValidation.lessonId, ...adminLessonValidation.updateLesson]), LessonController.updateLesson);

// Delete lesson
router.delete('/:id', validateRequest(adminLessonValidation.lessonId), LessonController.deleteLesson);

// Reorder lessons
router.patch('/section/:sectionId/reorder', validateRequest(adminLessonValidation.sectionId), LessonController.reorderLessons);

// Toggle lesson preview
router.patch('/:id/preview', validateRequest(adminLessonValidation.lessonId), LessonController.toggleLessonPreview);

// Toggle lesson required status
router.patch('/:id/required', validateRequest(adminLessonValidation.lessonId), LessonController.toggleLessonRequired);

// Add attachment to lesson
router.post('/:id/attachments', validateRequest(adminLessonValidation.lessonId), LessonController.addAttachment);

// Remove attachment from lesson
router.delete('/:id/attachments/:attachmentIndex', validateRequest(adminLessonValidation.lessonId), LessonController.removeAttachment);

// Bulk update lessons
router.patch('/section/:sectionId/bulk-update', validateRequest(adminLessonValidation.sectionId), LessonController.bulkUpdateLessons);

// Move lesson to different section
router.patch('/:id/move', validateRequest(adminLessonValidation.lessonId), LessonController.moveLesson);

export default router;
