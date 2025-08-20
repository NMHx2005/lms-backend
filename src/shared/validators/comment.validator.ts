import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';

export const createCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment content must be between 1 and 2000 characters'),
  
  body('contentType')
    .isIn(['course', 'lesson', 'discussion', 'assignment'])
    .withMessage('Invalid content type'),
  
  body('contentId')
    .isMongoId()
    .withMessage('Invalid content ID'),
  
  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID'),
  
  validateRequest
];

export const updateCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment content must be between 1 and 2000 characters'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Edit reason must be less than 500 characters'),
  
  validateRequest
];

export const getCommentsValidation = [
  query('contentType')
    .optional()
    .isIn(['course', 'lesson', 'discussion', 'assignment'])
    .withMessage('Invalid content type'),
  
  query('contentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid content ID'),
  
  query('authorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),
  
  query('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID'),
  
  query('rootId')
    .optional()
    .isMongoId()
    .withMessage('Invalid root comment ID'),
  
  query('moderationStatus')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'flagged'])
    .withMessage('Invalid moderation status'),
  
  query('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'likes', 'helpfulVotes', 'totalVotes'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validateRequest
];

export const getCommentTreeValidation = [
  param('contentType')
    .isIn(['course', 'lesson', 'discussion', 'assignment'])
    .withMessage('Invalid content type'),
  
  param('contentId')
    .isMongoId()
    .withMessage('Invalid content ID'),
  
  query('maxDepth')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max depth must be between 1 and 10'),
  
  validateRequest
];

export const getCommentByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  validateRequest
];

export const deleteCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  validateRequest
];

export const toggleLikeValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  validateRequest
];

export const toggleDislikeValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  validateRequest
];

export const reportCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  body('reason')
    .isIn(['spam', 'inappropriate', 'harassment', 'other'])
    .withMessage('Invalid report reason'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  validateRequest
];

export const markAsHelpfulValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  validateRequest
];

export const getCommentStatsValidation = [
  query('contentType')
    .optional()
    .isIn(['course', 'lesson', 'discussion', 'assignment'])
    .withMessage('Invalid content type'),
  
  query('contentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid content ID'),
  
  validateRequest
];
