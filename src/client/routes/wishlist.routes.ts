import express from 'express';
import { ClientWishlistController } from '../controllers/wishlist.controller';

const router = express.Router();

// GET /client/wishlist - Get user's wishlist
router.get('/', ClientWishlistController.getUserWishlist);

// POST /client/wishlist - Add course to wishlist
router.post('/', ClientWishlistController.addToWishlist);

// DELETE /client/wishlist/:wishlistId - Remove course from wishlist
router.delete('/:wishlistId', ClientWishlistController.removeFromWishlist);

// PUT /client/wishlist/:wishlistId - Update wishlist item
router.put('/:wishlistId', ClientWishlistController.updateWishlistItem);

// GET /client/wishlist/check/:courseId - Check if course is in wishlist
router.get('/check/:courseId', ClientWishlistController.isInWishlist);

// DELETE /client/wishlist/clear - Clear all wishlist items
router.delete('/clear', ClientWishlistController.clearWishlist);

// POST /client/wishlist/:wishlistId/move-to-cart - Move wishlist item to cart
router.post('/:wishlistId/move-to-cart', ClientWishlistController.moveToCart);

// GET /client/wishlist/stats - Get wishlist statistics
router.get('/stats', ClientWishlistController.getWishlistStats);

export default router;
