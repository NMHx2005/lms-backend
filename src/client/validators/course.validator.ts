import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const clientCourseValidation = {
  // Validation for getting published courses
  getPublishedCourses: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'title', 'price', 'totalStudents', 'averageRating', 'totalDuration']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters'),
    query('domain').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Domain must be between 1 and 50 characters'),
    query('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Level must be beginner, intermediate, or advanced'),
    query('instructorId').optional().isMongoId().withMessage('Invalid instructor ID'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
    query('isFree').optional().isBoolean().withMessage('isFree must be true or false'),
    query('isFeatured').optional().isBoolean().withMessage('isFeatured must be true or false'),
    query('language').optional().isString().trim().isLength({ min: 1, max: 20 }).withMessage('Language must be between 1 and 20 characters'),
    query('certificate').optional().isBoolean().withMessage('certificate must be true or false')
  ],

  // Validation for getting course by ID
  getCourseById: [
    param('id').isMongoId().withMessage('Invalid course ID')
  ],

  // Validation for getting course content
  getCourseContent: [
    param('id').isMongoId().withMessage('Invalid course ID')
  ],

  // Validation for searching courses
  searchCourses: [
    query('q').notEmpty().isString().trim().isLength({ min: 1, max: 100 }).withMessage('Search query is required and must be between 1 and 100 characters'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('domain').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Domain must be between 1 and 50 characters'),
    query('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Level must be beginner, intermediate, or advanced'),
    query('isFree').optional().isBoolean().withMessage('isFree must be true or false')
  ],

  // Validation for getting courses by instructor
  getCoursesByInstructor: [
    param('instructorId').isMongoId().withMessage('Invalid instructor ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  // Validation for getting related courses
  getRelatedCourses: [
    param('id').isMongoId().withMessage('Invalid course ID'),
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ],

  // Validation for getting course progress
  getCourseProgress: [
    param('id').isMongoId().withMessage('Invalid course ID')
  ],

  // Validation for getting course recommendations
  getCourseRecommendations: [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ],

  // Validation for getting lesson content
  getLessonContent: [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('lessonId').isMongoId().withMessage('Invalid lesson ID')
  ],

  // Validation for getting featured courses
  getFeaturedCourses: [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ],

  // Validation for getting popular courses
  getPopularCourses: [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ]
};
