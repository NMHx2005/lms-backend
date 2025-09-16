import { Wishlist, Course, User } from '../../shared/models';
import { Types } from 'mongoose';

export class AdminWishlistService {
    // Get all wishlists with pagination and filters
    static async getAllWishlists(params: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
        studentId?: string;
        courseId?: string;
        search?: string;
    } = {}) {
        try {
            const { page = 1, limit = 20, sortBy = 'addedAt', sortOrder = 'desc', studentId, courseId, search } = params;

            // Build aggregation pipeline
            const pipeline: any[] = [
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
                        localField: 'studentId',
                        foreignField: '_id',
                        as: 'student'
                    }
                },
                { $unwind: '$student' },
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

            // Add filters
            if (studentId) {
                pipeline.unshift({ $match: { studentId: new Types.ObjectId(studentId) } });
            }

            if (courseId) {
                pipeline.unshift({ $match: { courseId: new Types.ObjectId(courseId) } });
            }

            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'course.title': { $regex: search, $options: 'i' } },
                            { 'course.description': { $regex: search, $options: 'i' } },
                            { 'student.name': { $regex: search, $options: 'i' } },
                            { 'student.email': { $regex: search, $options: 'i' } }
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
                        localField: 'studentId',
                        foreignField: '_id',
                        as: 'student'
                    }
                },
                { $unwind: '$student' }
            ];

            if (studentId) {
                countPipeline.unshift({ $match: { studentId: new Types.ObjectId(studentId) } });
            }

            if (courseId) {
                countPipeline.unshift({ $match: { courseId: new Types.ObjectId(courseId) } });
            }

            if (search) {
                countPipeline.push({
                    $match: {
                        $or: [
                            { 'course.title': { $regex: search, $options: 'i' } },
                            { 'course.description': { $regex: search, $options: 'i' } },
                            { 'student.name': { $regex: search, $options: 'i' } },
                            { 'student.email': { $regex: search, $options: 'i' } }
                        ]
                    }
                });
            }

            countPipeline.push({ $count: 'total' });
            const countResult = await Wishlist.aggregate(countPipeline);
            const total = countResult.length > 0 ? countResult[0].total : 0;

            // Transform data
            const transformedItems = wishlistItems.map(item => ({
                _id: item._id.toString(),
                studentId: item.studentId.toString(),
                courseId: item.courseId.toString(),
                studentName: item.student.name,
                studentEmail: item.student.email,
                courseTitle: item.course.title,
                courseThumbnail: item.course.thumbnail || '/images/default-course.jpg',
                instructorName: item.instructor.name,
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
            console.error('Error getting all wishlists:', error);
            return {
                success: false,
                message: 'Failed to get wishlists',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Get wishlist by ID
    static async getWishlistById(wishlistId: string) {
        try {
            const wishlistItem = await Wishlist.findById(wishlistId)
                .populate('studentId', 'name email')
                .populate('courseId', 'title thumbnail price originalPrice rating level domain duration');

            if (!wishlistItem) {
                return {
                    success: false,
                    message: 'Wishlist item not found'
                };
            }

            return {
                success: true,
                data: wishlistItem
            };
        } catch (error) {
            console.error('Error getting wishlist by ID:', error);
            return {
                success: false,
                message: 'Failed to get wishlist item',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Delete wishlist item
    static async deleteWishlistItem(wishlistId: string) {
        try {
            const result = await Wishlist.findByIdAndDelete(wishlistId);

            if (!result) {
                return {
                    success: false,
                    message: 'Wishlist item not found'
                };
            }

            return {
                success: true,
                message: 'Wishlist item deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting wishlist item:', error);
            return {
                success: false,
                message: 'Failed to delete wishlist item',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Get wishlist statistics
    static async getWishlistStats() {
        try {
            const pipeline = [
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
                        categories: { $addToSet: '$course.domain' },
                        uniqueStudents: { $addToSet: '$studentId' },
                        uniqueCourses: { $addToSet: '$courseId' }
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
                        categories: [],
                        uniqueStudents: 0,
                        uniqueCourses: 0
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
                    categories: stats.categories.filter(Boolean),
                    uniqueStudents: stats.uniqueStudents.length,
                    uniqueCourses: stats.uniqueCourses.length
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

    // Get wishlist statistics by user
    static async getUserWishlistStats(studentId: string) {
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
            console.error('Error getting user wishlist stats:', error);
            return {
                success: false,
                message: 'Failed to get user wishlist statistics',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Bulk delete wishlist items
    static async bulkDeleteWishlistItems(wishlistIds: string[]) {
        try {
            const result = await Wishlist.deleteMany({ _id: { $in: wishlistIds } });

            return {
                success: true,
                message: `Deleted ${result.deletedCount} wishlist items successfully`
            };
        } catch (error) {
            console.error('Error bulk deleting wishlist items:', error);
            return {
                success: false,
                message: 'Failed to bulk delete wishlist items',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
