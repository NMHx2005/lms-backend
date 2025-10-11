import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/client/categories
 * @desc Get all active categories
 * @access Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route GET /api/client/categories/domains
 * @desc Get category domains (names only) for dropdown
 * @access Public
 */
router.get('/domains', categoryController.getCategoryDomains);

/**
 * @route GET /api/client/categories/stats
 * @desc Get category stats
 * @access Private (Teacher)
 */
router.get('/stats', authenticate, categoryController.getCategoryStats);

export default router;

