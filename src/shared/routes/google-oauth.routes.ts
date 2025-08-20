import { Router } from 'express';
import passport from 'passport';
import * as googleOAuthController from '../controllers/google-oauth.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for OAuth endpoints
const oauthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many OAuth attempts, please try again later',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

const strictOauthRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many OAuth attempts, please try again in 5 minutes',
    retryAfter: 300
  }
});

/**
 * @route   GET /api/auth/google/config
 * @desc    Get OAuth configuration status
 * @access  Public
 */
router.get('/config', googleOAuthController.getOAuthConfig);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 * @query   returnUrl - URL to redirect after authentication
 * @query   userType - Type of user (student, instructor, admin)
 */
router.get(
  '/',
  oauthRateLimit,
  [
    query('returnUrl')
      .optional()
      .isURL({ require_protocol: true })
      .withMessage('Return URL must be a valid URL'),
    query('userType')
      .optional()
      .isIn(['student', 'instructor', 'admin'])
      .withMessage('User type must be student, instructor, or admin'),
    validateRequest
  ],
  googleOAuthController.initiateGoogleAuth
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public (called by Google)
 */
router.get('/callback', strictOauthRateLimit, googleOAuthController.handleGoogleCallback);

/**
 * @route   GET /api/auth/google/error
 * @desc    Handle OAuth errors
 * @access  Public
 */
router.get('/error', googleOAuthController.handleOAuthError);

/**
 * @route   POST /api/auth/google/link
 * @desc    Link Google account to existing user
 * @access  Private (Authenticated users only)
 */
router.post(
  '/link',
  authenticate,
  oauthRateLimit,
  googleOAuthController.linkGoogleAccount
);

/**
 * @route   DELETE /api/auth/google/unlink
 * @desc    Unlink Google account from user
 * @access  Private (Authenticated users only)
 */
router.delete(
  '/unlink',
  authenticate,
  oauthRateLimit,
  googleOAuthController.unlinkGoogleAccount
);

/**
 * @route   GET /api/auth/google/status
 * @desc    Get Google account linking status
 * @access  Private (Authenticated users only)
 */
router.get(
  '/status',
  authenticate,
  googleOAuthController.getGoogleAccountStatus
);

/**
 * @route   POST /api/auth/google/refresh
 * @desc    Refresh Google profile data
 * @access  Private (Authenticated users only)
 */
router.post(
  '/refresh',
  authenticate,
  oauthRateLimit,
  googleOAuthController.refreshGoogleProfile
);

/**
 * @route   POST /api/auth/google/mobile
 * @desc    Handle mobile OAuth token exchange
 * @access  Public
 */
router.post(
  '/mobile',
  strictOauthRateLimit,
  [
    body('code')
      .notEmpty()
      .withMessage('Authorization code is required'),
    body('state')
      .optional()
      .isString()
      .withMessage('State must be a string'),
    validateRequest
  ],
  googleOAuthController.mobileTokenExchange
);

export default router;
