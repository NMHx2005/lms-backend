import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/admin/certificates
 * @desc    Get all certificates with filtering and pagination
 * @access  Admin
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'revoked', 'expired', 'replaced']).withMessage('Invalid status'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('courseId').optional().isMongoId().withMessage('Invalid course ID'),
    query('studentId').optional().isMongoId().withMessage('Invalid student ID'),
    validateRequest
  ],
  certificateController.getAllCertificates
);

/**
 * @route   GET /api/admin/certificates/statistics
 * @desc    Get certificate statistics
 * @access  Admin
 */
router.get('/statistics', certificateController.getCertificateStatistics);

/**
 * @route   GET /api/admin/certificates/export
 * @desc    Export certificates to CSV
 * @access  Admin
 */
router.get(
  '/export',
  [
    query('status').optional().isIn(['active', 'revoked', 'expired', 'replaced']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validateRequest
  ],
  certificateController.exportCertificates
);

/**
 * @route   POST /api/admin/certificates/generate
 * @desc    Generate certificate manually
 * @access  Admin
 */
router.post(
  '/generate',
  [
    body('studentId').isMongoId().withMessage('Valid student ID is required'),
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('templateId').optional().isMongoId().withMessage('Invalid template ID'),
    validateRequest
  ],
  certificateController.generateCertificate
);

/**
 * @route   POST /api/admin/certificates/auto-generate
 * @desc    Auto-generate certificates for completed courses
 * @access  Admin
 */
router.post('/auto-generate', certificateController.autoGenerateCertificates);

/**
 * @route   GET /api/admin/certificates/:id
 * @desc    Get certificate by ID
 * @access  Admin
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
 * @route   POST /api/admin/certificates/:id/revoke
 * @desc    Revoke certificate
 * @access  Admin
 */
router.post(
  '/:id/revoke',
  [
    param('id').isString().withMessage('Certificate ID is required'),
    body('reason').isString().isLength({ min: 10 }).withMessage('Revocation reason must be at least 10 characters'),
    validateRequest
  ],
  certificateController.revokeCertificate
);

/**
 * @route   POST /api/admin/certificates/bulk/revoke
 * @desc    Bulk revoke certificates
 * @access  Admin
 */
router.post(
  '/bulk/revoke',
  [
    body('certificateIds').isArray({ min: 1 }).withMessage('Certificate IDs array is required'),
    body('certificateIds.*').isString().withMessage('Each certificate ID must be a string'),
    body('reason').isString().isLength({ min: 10 }).withMessage('Revocation reason must be at least 10 characters'),
    validateRequest
  ],
  certificateController.bulkRevokeCertificates
);

export default router;
