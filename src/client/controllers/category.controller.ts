import { Request, Response } from 'express';
import { Category } from '../../shared/models';

/**
 * Get all active categories for client/teacher
 * @route GET /api/client/categories
 */
export const getCategories = async (req: Request, res: Response) => {
    try {
        // Get only active categories, sorted by name
        const categories = await Category.find({ isActive: true })
            .select('name description courseCount')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh mục',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get category domains (names only) for dropdown
 * @route GET /api/client/categories/domains
 */
export const getCategoryDomains = async (req: Request, res: Response) => {
    try {
        // Get only active category names
        const categories = await Category.find({ isActive: true })
            .select('name')
            .sort({ name: 1 });

        const domains = categories.map(cat => cat.name);

        res.json({
            success: true,
            data: domains
        });
    } catch (error) {
        console.error('Error fetching category domains:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh mục',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get category stats for teacher dashboard
 * @route GET /api/client/categories/stats
 */
export const getCategoryStats = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find({ isActive: true })
            .select('name courseCount')
            .sort({ courseCount: -1 });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching category stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê danh mục',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

