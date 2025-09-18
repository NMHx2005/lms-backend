import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import * as packageController from '../controllers/package.controller';

const router = Router();

// Admin auth for all routes
router.use(authenticate);
router.use(requireAdmin);

// Packages CRUD
router.get(
  '/packages',
  validateRequest([
    query('search').optional().isString().trim(),
    query('isActive').optional().isBoolean().toBoolean(),
  ]),
  packageController.listPackages
);

// Export packages CSV - MUST be before '/packages/:id'
router.get(
  '/packages/export',
  validateRequest([
    query('search').optional().isString().trim(),
    query('isActive').optional().isBoolean().toBoolean(),
  ]),
  packageController.exportPackagesCsv
);

router.post(
  '/packages',
  validateRequest([
    body('name').isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('maxCourses').isInt({ min: 0 }),
    body('price').isFloat({ min: 0 }),
    body('billingCycle').isIn(['monthly', 'yearly']),
    body('features').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ]),
  packageController.createPackage
);

router.get(
  '/packages/:id',
  validateRequest([param('id').isMongoId()]),
  packageController.getPackage
);

router.put(
  '/packages/:id',
  validateRequest([
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
    body('maxCourses').optional().isInt({ min: 0 }),
    body('price').optional().isFloat({ min: 0 }),
    body('billingCycle').optional().isIn(['monthly', 'yearly']),
    body('features').optional().isArray(),
    body('isActive').optional().isBoolean(),
  ]),
  packageController.updatePackage
);

router.delete(
  '/packages/:id',
  validateRequest([param('id').isMongoId()]),
  packageController.deletePackage
);

// Subscriptions management
router.get(
  '/subscriptions',
  validateRequest([
    query('teacherId').optional().isMongoId(),
    query('status').optional().isIn(['active', 'cancelled', 'expired']),
  ]),
  packageController.listSubscriptions
);

router.post(
  '/subscriptions',
  validateRequest([
    body('teacherId').isMongoId(),
    body('packageId').isMongoId(),
    body('startAt').optional().isISO8601(),
    body('endAt').optional().isISO8601(),
  ]),
  packageController.createSubscription
);

router.put(
  '/subscriptions/:id',
  validateRequest([
    param('id').isMongoId(),
    body('action').isIn(['cancel', 'renew', 'expire']).withMessage('Invalid action'),
    body('endAt').optional().isISO8601(),
  ]),
  packageController.updateSubscription
);

// Get teachers subscribed to a specific package
router.get(
  '/packages/:id/subscribers',
  validateRequest([
    param('id').isMongoId(),
    query('status').optional().isIn(['active', 'cancelled', 'expired', 'all']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  packageController.getPackageSubscribers
);

export default router;


