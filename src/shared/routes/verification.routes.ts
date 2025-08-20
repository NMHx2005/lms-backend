import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

/**
 * @route   GET /api/verify/:identifier
 * @desc    Verify certificate by ID or verification code (Public)
 * @access  Public
 */
router.get(
  '/:identifier',
  [
    param('identifier').isString().isLength({ min: 1 }).withMessage('Certificate identifier is required'),
    validateRequest
  ],
  verificationController.verifyCertificate
);

/**
 * @route   POST /api/verify/qr
 * @desc    Verify certificate from QR code data (Public)
 * @access  Public
 */
router.post(
  '/qr',
  [
    body('qrData').isString().isLength({ min: 1 }).withMessage('QR code data is required'),
    validateRequest
  ],
  verificationController.verifyFromQR
);

/**
 * @route   GET /api/verify/public/:identifier
 * @desc    Get public certificate view for sharing (Public)
 * @access  Public
 */
router.get(
  '/public/:identifier',
  [
    param('identifier').isString().isLength({ min: 1 }).withMessage('Certificate identifier is required'),
    validateRequest
  ],
  verificationController.getPublicCertificate
);

/**
 * @route   POST /api/verify/bulk
 * @desc    Bulk verify certificates (Public)
 * @access  Public
 */
router.post(
  '/bulk',
  [
    body('identifiers').isArray({ min: 1, max: 50 }).withMessage('Identifiers array is required (max 50)'),
    body('identifiers.*').isString().withMessage('Each identifier must be a string'),
    validateRequest
  ],
  verificationController.bulkVerify
);

/**
 * @route   GET /api/verify/stats/overview
 * @desc    Get verification statistics (Public)
 * @access  Public
 */
router.get('/stats/overview', verificationController.getVerificationStats);

/**
 * @route   GET /api/verify/reports/generate
 * @desc    Generate verification report (Public)
 * @access  Public
 */
router.get(
  '/reports/generate',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    validateRequest
  ],
  verificationController.generateVerificationReport
);

export default router;
