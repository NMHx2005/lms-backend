import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  toggleCategoryStatus
} from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Apply authentication and admin role middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/categories - Get all categories
router.get('/', getCategories);

// GET /api/admin/categories/:id - Get category by ID
router.get('/:id', getCategoryById);

// POST /api/admin/categories - Create new category
router.post('/', createCategory);

// PUT /api/admin/categories/:id - Update category
router.put('/:id', updateCategory);

// DELETE /api/admin/categories/:id - Delete category
router.delete('/:id', deleteCategory);

// DELETE /api/admin/categories/bulk - Bulk delete categories
router.delete('/bulk', bulkDeleteCategories);

// PATCH /api/admin/categories/:id/toggle-status - Toggle category status
router.patch('/:id/toggle-status', toggleCategoryStatus);

export default router;
