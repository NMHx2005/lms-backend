import { body, param, query } from 'express-validator';

export const adminLessonValidation = {
  // Basic parameter validation
  lessonId: [
    param('id').notEmpty().withMessage('Lesson ID is required')
  ],

  sectionId: [
    param('sectionId').notEmpty().withMessage('Section ID is required')
  ],

  courseId: [
    param('courseId').notEmpty().withMessage('Course ID is required')
  ],

  // Create lesson validation
  createLesson: [
    body('sectionId').notEmpty().withMessage('Section ID is required'),
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('type').notEmpty().withMessage('Type is required')
  ],

  // Update lesson validation
  updateLesson: [
    body('title').optional().notEmpty().withMessage('Title cannot be empty')
  ],

  // Reorder lessons validation
  reorderLessons: [
    body('lessonOrders').notEmpty().withMessage('Lesson orders are required')
  ],

  // Bulk update validation
  bulkUpdateLessons: [
    body('updates').notEmpty().withMessage('Updates are required')
  ],

  // Move lesson validation
  moveLesson: [
    body('newSectionId').notEmpty().withMessage('New section ID is required')
  ],

  // Add attachment validation
  addAttachment: [
    body('name').notEmpty().withMessage('Name is required'),
    body('url').notEmpty().withMessage('URL is required')
  ],

  // Query parameters validation
  queryParams: [
    query('type').optional().notEmpty().withMessage('Type cannot be empty')
  ]
};
