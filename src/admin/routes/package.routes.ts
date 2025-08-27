import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import * as packageController from '../controllers/package.controller';

const router = Router();

// Admin auth for all routes
router.use(authenticate);
router.use(requireAdmin);

// Packages CRUD
router.get(
  '/packages',
  [
    query('search').optional().isString().trim(),
    query('isActive').optional().isBoolean().toBoolean(),
    validateRequest,
  ],
  packageController.listPackages
);

router.post(
  '/packages',
  [
    body('name').isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('maxCourses').isInt({ min: 0 }),
    body('price').isFloat({ min: 0 }),
    body('billingCycle').isIn(['monthly', 'yearly']),
    body('features').optional().isArray(),
    body('isActive').optional().isBoolean(),
    validateRequest,
  ],
  packageController.createPackage
);

router.get(
  '/packages/:id',
  [param('id').isMongoId(), validateRequest],
  packageController.getPackage
);

router.put(
  '/packages/:id',
  [
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('maxCourses').optional().isInt({ min: 0 }),
    body('price').optional().isFloat({ min: 0 }),
    body('billingCycle').optional().isIn(['monthly', 'yearly']),
    body('features').optional().isArray(),
    body('isActive').optional().isBoolean(),
    validateRequest,
  ],
  packageController.updatePackage
);

router.delete(
  '/packages/:id',
  [param('id').isMongoId(), validateRequest],
  packageController.deletePackage
);

// Subscriptions management
router.get(
  '/subscriptions',
  [
    query('teacherId').optional().isMongoId(),
    query('status').optional().isIn(['active', 'cancelled', 'expired']),
    validateRequest,
  ],
  packageController.listSubscriptions
);

router.post(
  '/subscriptions',
  [
    body('teacherId').isMongoId(),
    body('packageId').isMongoId(),
    body('startAt').optional().isISO8601(),
    body('endAt').optional().isISO8601(),
    validateRequest,
  ],
  packageController.createSubscription
);

router.put(
  '/subscriptions/:id',
  [
    param('id').isMongoId(),
    body('action').isIn(['cancel', 'renew', 'expire']).withMessage('Invalid action'),
    body('endAt').optional().isISO8601(),
    validateRequest,
  ],
  packageController.updateSubscription
);

export default router;


