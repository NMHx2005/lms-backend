import { Request, Response } from 'express';
import { ClientWishlistService } from '../services/wishlist.service';

export class ClientWishlistController {
    // Get user's wishlist
    static async getUserWishlist(req: Request, res: Response) {
        try {
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const {
                page = 1,
                limit = 20,
                sortBy = 'addedAt',
                sortOrder = 'desc',
                category,
                search
            } = req.query;

            const result = await ClientWishlistService.getUserWishlist(studentId, {
                page: Number(page),
                limit: Number(limit),
                sortBy: sortBy as string,
                sortOrder: sortOrder as string,
                category: category as string,
                search: search as string
            });

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Add course to wishlist
    static async addToWishlist(req: Request, res: Response) {
        try {
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const { courseId, notes } = req.body;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required'
                });
            }

            const result = await ClientWishlistService.addToWishlist(studentId, courseId, notes);

            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Remove course from wishlist
    static async removeFromWishlist(req: Request, res: Response) {
        try {
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const { wishlistId } = req.params;

            if (!wishlistId) {
                return res.status(400).json({
                    success: false,
                    message: 'Wishlist ID is required'
                });
            }

            const result = await ClientWishlistService.removeFromWishlist(studentId, wishlistId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Update wishlist item
    static async updateWishlistItem(req: Request, res: Response) {
        try {
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const { wishlistId } = req.params;
            const { notes } = req.body;

            if (!wishlistId) {
                return res.status(400).json({
                    success: false,
                    message: 'Wishlist ID is required'
                });
            }

            const result = await ClientWishlistService.updateWishlistItem(studentId, wishlistId, { notes });

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Check if course is in wishlist
    static async isInWishlist(req: Request, res: Response) {
        try {
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const { courseId } = req.params;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required'
                });
            }

            const result = await ClientWishlistService.isInWishlist(studentId, courseId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Clear all wishlist items
    static async clearWishlist(req: Request, res: Response) {
        try {
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const result = await ClientWishlistService.clearWishlist(studentId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Move wishlist item to cart
    static async moveToCart(req: Request, res: Response) {
        try {
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const { wishlistId } = req.params;

            if (!wishlistId) {
                return res.status(400).json({
                    success: false,
                    message: 'Wishlist ID is required'
                });
            }

            const result = await ClientWishlistService.moveToCart(studentId, wishlistId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

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
            const studentId = (req.user as any)?.id;
            if (!studentId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - User not authenticated'
                });
            }

            const result = await ClientWishlistService.getWishlistStats(studentId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
