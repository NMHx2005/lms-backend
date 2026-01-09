import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { TeacherPackageController } from '../controllers/teacher-package.controller';

const router = Router();

// Get available packages for teachers
router.get(
    '/available',
    authenticate,
    validateRequest([
        query('status').optional().isIn(['active', 'inactive', 'all']),
    ]),
    TeacherPackageController.getAvailablePackages
);

// Get teacher's current subscription
router.get(
    '/current',
    authenticate,
    TeacherPackageController.getCurrentSubscription
);

// Get teacher's active subscriptions (list)
router.get(
    '/current/list',
    authenticate,
    TeacherPackageController.getActiveSubscriptions
);

// Get teacher's subscription history
router.get(
    '/history',
    authenticate,
    validateRequest([
        query('status').optional().isIn(['active', 'cancelled', 'expired', 'all']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
    ]),
    TeacherPackageController.getSubscriptionHistory
);

// Subscribe to a package
router.post(
    '/subscribe',
    authenticate,
    validateRequest([
        body('packageId').isMongoId().withMessage('Package ID is required'),
        body('paymentMethod').optional().isIn(['credit_card', 'bank_transfer', 'wallet', 'vnpay']),
        body('couponCode').optional().isString().isLength({ min: 1, max: 50 }),
    ]),
    TeacherPackageController.subscribeToPackage
);

// Renew current subscription
router.post(
    '/renew',
    authenticate,
    validateRequest([
        body('paymentMethod').optional().isIn(['credit_card', 'bank_transfer', 'wallet', 'vnpay']),
        body('couponCode').optional().isString().isLength({ min: 1, max: 50 }),
    ]),
    TeacherPackageController.renewSubscription
);

// Cancel current subscription
router.post(
    '/cancel',
    authenticate,
    TeacherPackageController.cancelSubscription
);

// Cancel specific package subscription
router.post(
    '/cancel/:packageId',
    authenticate,
    validateRequest([
        param('packageId').isMongoId().withMessage('Invalid package ID'),
    ]),
    TeacherPackageController.cancelPackageSubscription
);

// Get package details
router.get(
    '/packages/:id',
    authenticate,
    validateRequest([
        param('id').isMongoId().withMessage('Invalid package ID'),
    ]),
    TeacherPackageController.getPackageDetails
);

// NOTE: VNPay callback has been moved to index.route.ts as public route
// This route is kept for reference but will not be matched (public route in index.route.ts takes precedence)
// VNPay callback for package subscription - MOVED TO PUBLIC ROUTES IN index.route.ts
// router.post('/vnpay/callback', TeacherPackageController.handleVNPayCallback);

export default router;