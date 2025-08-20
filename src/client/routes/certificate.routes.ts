import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/client/certificates
 * @desc    Get user's certificates
 * @access  Student/Teacher
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['active', 'revoked', 'expired', 'replaced']).withMessage('Invalid status'),
    validateRequest
  ],
  certificateController.getMyCertificates
);

/**
 * @route   GET /api/client/certificates/statistics
 * @desc    Get user's certificate statistics
 * @access  Student/Teacher
 */
router.get('/statistics', certificateController.getMyCertificateStats);

/**
 * @route   GET /api/client/certificates/search
 * @desc    Search user's certificates
 * @access  Student/Teacher
 */
router.get(
  '/search',
  [
    query('q').optional().isString().withMessage('Search query must be a string'),
    query('type').optional().isIn(['completion', 'achievement', 'mastery', 'professional', 'expert']).withMessage('Invalid certificate type'),
    query('level').optional().isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond']).withMessage('Invalid level'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validateRequest
  ],
  certificateController.searchMyCertificates
);

/**
 * @route   POST /api/client/certificates/request
 * @desc    Request certificate generation
 * @access  Student
 */
router.post(
  '/request',
  [
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    validateRequest
  ],
  certificateController.requestCertificate
);

/**
 * @route   GET /api/client/certificates/:id
 * @desc    Get certificate by ID (user's own)
 * @access  Student/Teacher
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid certificate ID'),
    validateRequest
  ],
  certificateController.getCertificate
);

/**
 * @route   GET /api/client/certificates/:id/download
 * @desc    Download certificate PDF
 * @access  Student/Teacher
 */
router.get(
  '/:id/download',
  [
    param('id').isMongoId().withMessage('Invalid certificate ID'),
    validateRequest
  ],
  certificateController.downloadCertificate
);

/**
 * @route   GET /api/client/certificates/:id/sharing
 * @desc    Get certificate sharing URL
 * @access  Student/Teacher
 */
router.get(
  '/:id/sharing',
  [
    param('id').isMongoId().withMessage('Invalid certificate ID'),
    validateRequest
  ],
  certificateController.getSharingUrl
);

/**
 * @route   GET /api/client/courses/:courseId/certificate/eligibility
 * @desc    Check certificate eligibility for a course
 * @access  Student
 */
router.get(
  '/courses/:courseId/eligibility',
  [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    validateRequest
  ],
  certificateController.checkEligibility
);

export default router;