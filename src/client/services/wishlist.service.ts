import { Wishlist, Course, User } from '../../shared/models';
import { Types } from 'mongoose';

export class ClientWishlistService {
    // Get user's wishlist with course details
    static async getUserWishlist(
        studentId: string,
        params: {
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: string;
            category?: string;
            search?: string;
        } = {}
    ) {
        try {
            const { page = 1, limit = 20, sortBy = 'addedAt', sortOrder = 'desc', category, search } = params;

            // Build aggregation pipeline
            const pipeline: any[] = [
                { $match: { studentId: new Types.ObjectId(studentId) } },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseId',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                { $unwind: '$course' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'course.instructorId',
                        foreignField: '_id',
                        as: 'instructor'
                    }
                },
                { $unwind: '$instructor' },
                {
                    $addFields: {
                        'course.instructor': '$instructor',
                        'course.isOnSale': {
                            $and: [
                                { $gt: ['$course.originalPrice', 0] },
                                { $lt: ['$course.price', '$course.originalPrice'] }
                            ]
                        },
                        'course.discountPercentage': {
                            $cond: {
                                if: { $gt: ['$course.originalPrice', 0] },
                                then: {
                                    $round: [
                                        {
                                            $multiply: [
                                                {
                                                    $divide: [
                                                        { $subtract: ['$course.originalPrice', '$course.price'] },
                                                        '$course.originalPrice'
                                                    ]
                                                },
                                                100
                                            ]
                                        },
                                        0
                                    ]
                                },
                                else: 0
                            }
                        }
                    }
                }
            ];

            // Add category filter
            if (category) {
                pipeline.push({
                    $match: { 'course.domain': category }
                });
            }

            // Add search filter
            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'course.title': { $regex: search, $options: 'i' } },
                            { 'course.description': { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            // Add sorting
            const sortField = sortBy === 'addedAt' ? 'addedAt' : `course.${sortBy}`;
            pipeline.push({
                $sort: { [sortField]: sortOrder === 'asc' ? 1 : -1 }
            });

            // Add pagination
            const skip = (page - 1) * limit;
            pipeline.push(
                { $skip: skip },
                { $limit: limit }
            );

            // Execute aggregation
            const wishlistItems = await Wishlist.aggregate(pipeline);

            // Get total count for pagination
            const countPipeline: any[] = [
                { $match: { studentId: new Types.ObjectId(studentId) } },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseId',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                { $unwind: '$course' }
            ];

            if (category) {
                countPipeline.push({
                    $match: { 'course.domain': category }
                });
            }

            if (search) {
                countPipeline.push({
                    $match: {
                        $or: [
                            { 'course.title': { $regex: search, $options: 'i' } },
                            { 'course.description': { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            countPipeline.push({ $count: 'total' });
            const countResult = await Wishlist.aggregate(countPipeline);
            const total = countResult.length > 0 ? countResult[0].total : 0;

            // Transform data to match frontend interface
            const transformedItems = wishlistItems.map(item => ({
                _id: item._id.toString(),
                courseId: item.courseId.toString(),
                title: item.course.title,
                thumbnail: item.course.thumbnail || '/images/default-course.jpg',
                instructor: item.instructor.name,
                price: item.course.price || 0,
                originalPrice: item.course.originalPrice || item.course.price || 0,
                rating: item.course.rating || 0,
                totalStudents: item.course.enrolledStudents?.length || 0,
                duration: item.course.duration || 0,
                level: item.course.level || 'beginner',
                category: item.course.domain || 'General',
                addedAt: item.addedAt.toISOString(),
                isOnSale: item.course.isOnSale || false,
                discountPercentage: item.course.discountPercentage || 0,
                notes: item.notes
            }));

            return {
                success: true,
                data: transformedItems,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error getting user wishlist:', error);
            return {
                success: false,
                message: 'Failed to get wishlist',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Add course to wishlist
    static async addToWishlist(studentId: string, courseId: string, notes?: string) {
        try {
            // Check if course exists
            const course = await Course.findById(courseId);
            if (!course) {
                return {
                    success: false,
                    message: 'Course not found'
                };
            }

            // Check if already in wishlist
            const existingItem = await Wishlist.findOne({ studentId, courseId });
            if (existingItem) {
                return {
                    success: false,
                    message: 'Course already in wishlist'
                };
            }

            // Create wishlist item
            const wishlistItem = new Wishlist({
                studentId,
                courseId,
                notes
            });

            await wishlistItem.save();

            return {
                success: true,
                message: 'Course added to wishlist successfully',
                data: wishlistItem
            };
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            return {
                success: false,
                message: 'Failed to add course to wishlist',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Remove course from wishlist
    static async removeFromWishlist(studentId: string, wishlistId: string) {
        try {
            const result = await Wishlist.findOneAndDelete({
                _id: wishlistId,
                studentId
            });

            if (!result) {
                return {
                    success: false,
                    message: 'Wishlist item not found or unauthorized'
                };
            }

            return {
                success: true,
                message: 'Course removed from wishlist successfully'
            };
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return {
                success: false,
                message: 'Failed to remove course from wishlist',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Update wishlist item
    static async updateWishlistItem(studentId: string, wishlistId: string, updates: { notes?: string }) {
        try {
            const result = await Wishlist.findOneAndUpdate(
                {
                    _id: wishlistId,
                    studentId
                },
                { $set: updates },
                { new: true }
            );

            if (!result) {
                return {
                    success: false,
                    message: 'Wishlist item not found or unauthorized'
                };
            }

            return {
                success: true,
                message: 'Wishlist item updated successfully',
                data: result
            };
        } catch (error) {
            console.error('Error updating wishlist item:', error);
            return {
                success: false,
                message: 'Failed to update wishlist item',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Check if course is in wishlist
    static async isInWishlist(studentId: string, courseId: string) {
        try {
            const wishlistItem = await Wishlist.findOne({ studentId, courseId });

            return {
                success: true,
                data: {
                    isInWishlist: !!wishlistItem,
                    wishlistId: wishlistItem?._id?.toString()
                }
            };
        } catch (error) {
            console.error('Error checking wishlist status:', error);
            return {
                success: false,
                message: 'Failed to check wishlist status',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Clear all wishlist items
    static async clearWishlist(studentId: string) {
        try {
            const result = await Wishlist.deleteMany({ studentId });

            return {
                success: true,
                message: `Cleared ${result.deletedCount} items from wishlist`
            };
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            return {
                success: false,
                message: 'Failed to clear wishlist',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Move wishlist item to cart (placeholder - implement cart logic)
    static async moveToCart(studentId: string, wishlistId: string) {
        try {
            // Get wishlist item
            const wishlistItem = await Wishlist.findById(wishlistId);
            if (!wishlistItem || wishlistItem.studentId.toString() !== studentId) {
                return {
                    success: false,
                    message: 'Wishlist item not found or unauthorized'
                };
            }

            // TODO: Implement cart logic here
            // For now, just remove from wishlist
            await Wishlist.findByIdAndDelete(wishlistId);

            return {
                success: true,
                message: 'Course moved to cart successfully'
            };
        } catch (error) {
            console.error('Error moving to cart:', error);
            return {
                success: false,
                message: 'Failed to move course to cart',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Get wishlist statistics
    static async getWishlistStats(studentId: string) {
        try {
            const pipeline = [
                { $match: { studentId: new Types.ObjectId(studentId) } },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseId',
                        foreignField: '_id',
                        as: 'course'
                    }
                },
                { $unwind: '$course' },
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        totalValue: { $sum: '$course.price' },
                        onSaleCount: {
                            $sum: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $gt: ['$course.originalPrice', 0] },
                                            { $lt: ['$course.price', '$course.originalPrice'] }
                                        ]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            }
                        },
                        categories: { $addToSet: '$course.domain' }
                    }
                }
            ];

            const result = await Wishlist.aggregate(pipeline);

            if (result.length === 0) {
                return {
                    success: true,
                    data: {
                        totalItems: 0,
                        totalValue: 0,
                        onSaleCount: 0,
                        categories: []
                    }
                };
            }

            const stats = result[0];
            return {
                success: true,
                data: {
                    totalItems: stats.totalItems,
                    totalValue: stats.totalValue,
                    onSaleCount: stats.onSaleCount,
                    categories: stats.categories.filter(Boolean)
                }
            };
        } catch (error) {
            console.error('Error getting wishlist stats:', error);
            return {
                success: false,
                message: 'Failed to get wishlist statistics',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
