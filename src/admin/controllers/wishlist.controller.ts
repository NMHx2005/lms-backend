import { Request, Response } from 'express';
import { AdminWishlistService } from '../services/wishlist.service';

export class AdminWishlistController {
    // Get all wishlists with pagination and filters
    static async getAllWishlists(req: Request, res: Response) {
        try {
            const {
                page = 1,
                limit = 20,
                sortBy = 'addedAt',
                sortOrder = 'desc',
                studentId,
                courseId,
                search
            } = req.query;

            const result = await AdminWishlistService.getAllWishlists({
                page: Number(page),
                limit: Number(limit),
                sortBy: sortBy as string,
                sortOrder: sortOrder as string,
                studentId: studentId as string,
                courseId: courseId as string,
                search: search as string
            });

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in getAllWishlists controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Get wishlist by ID
    static async getWishlistById(req: Request, res: Response) {
        try {
            const { wishlistId } = req.params;

            if (!wishlistId) {
                return res.status(400).json({
                    success: false,
                    message: 'Wishlist ID is required'
                });
            }

            const result = await AdminWishlistService.getWishlistById(wishlistId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(404).json(result);
            }
        } catch (error) {
            console.error('Error in getWishlistById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Delete wishlist item
    static async deleteWishlistItem(req: Request, res: Response) {
        try {
            const { wishlistId } = req.params;

            if (!wishlistId) {
                return res.status(400).json({
                    success: false,
                    message: 'Wishlist ID is required'
                });
            }

            const result = await AdminWishlistService.deleteWishlistItem(wishlistId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(404).json(result);
            }
        } catch (error) {
            console.error('Error in deleteWishlistItem controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Get wishlist statistics
    static async getWishlistStats(req: Request, res: Response) {
        try {
            const result = await AdminWishlistService.getWishlistStats();

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in getWishlistStats controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Get wishlist statistics by user
    static async getUserWishlistStats(req: Request, res: Response) {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID is required'
                });
            }

            const result = await AdminWishlistService.getUserWishlistStats(studentId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in getUserWishlistStats controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Bulk delete wishlist items
    static async bulkDeleteWishlistItems(req: Request, res: Response) {
        try {
            const { wishlistIds } = req.body;

            if (!wishlistIds || !Array.isArray(wishlistIds) || wishlistIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Wishlist IDs array is required'
                });
            }

            const result = await AdminWishlistService.bulkDeleteWishlistItems(wishlistIds);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in bulkDeleteWishlistItems controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
