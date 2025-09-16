import express from 'express';
import { AdminWishlistController } from '../controllers/wishlist.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Apply authentication and admin authorization middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// GET /admin/wishlist - Get all wishlists with pagination and filters
router.get('/', AdminWishlistController.getAllWishlists);

// GET /admin/wishlist/:wishlistId - Get wishlist by ID
router.get('/:wishlistId', AdminWishlistController.getWishlistById);

// DELETE /admin/wishlist/:wishlistId - Delete wishlist item
router.delete('/:wishlistId', AdminWishlistController.deleteWishlistItem);

// GET /admin/wishlist/stats - Get wishlist statistics
router.get('/stats', AdminWishlistController.getWishlistStats);

// GET /admin/wishlist/user/:studentId/stats - Get wishlist statistics by user
router.get('/user/:studentId/stats', AdminWishlistController.getUserWishlistStats);

// POST /admin/wishlist/bulk-delete - Bulk delete wishlist items
router.post('/bulk-delete', AdminWishlistController.bulkDeleteWishlistItems);

export default router;
