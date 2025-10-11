import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import Course from '../../shared/models/core/Course';
import Enrollment from '../../shared/models/core/Enrollment';
import mongoose from 'mongoose';

/**
 * Get course analytics overview
 */
export const getCourseAnalyticsOverview = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // Verify user is a teacher
    if (!req.user.roles || !Array.isArray(req.user.roles) || !req.user.roles.includes('teacher')) {
        throw new AppError('Access denied. Teacher role required.', 403);
    }

    // Get all teacher's published courses
    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('title thumbnail totalStudents averageRating price');

    // Get enrollment data for each course
    const courseAnalytics = await Promise.all(
        courses.map(async (course) => {
            const enrollments = await Enrollment.find({ courseId: course._id });

            const completedCount = enrollments.filter(e => e.isCompleted === true).length;
            const completionRate = enrollments.length > 0
                ? (completedCount / enrollments.length) * 100
                : 0;

            // Calculate revenue: totalStudents * price
            const revenue = (course.totalStudents || 0) * (course.price || 0);

            return {
                _id: course._id,
                name: course.title,
                thumbnail: course.thumbnail || '/images/default-course.jpg',
                students: course.totalStudents || 0,
                rating: course.averageRating || 0,
                revenue: Math.round(revenue * 100) / 100, // Round to 2 decimals
                completionRate: Math.round(completionRate * 10) / 10,
                views: 0 // TODO: Add views tracking
            };
        })
    );

    res.json({
        success: true,
        data: courseAnalytics
    });
});

/**
 * Get course performance comparison
 */
export const getCoursePerformance = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    const performance = await Course.aggregate([
        { $match: { instructorId: teacherObjectId, status: 'published' } },
        {
            $lookup: {
                from: 'enrollments',
                localField: '_id',
                foreignField: 'courseId',
                as: 'enrollments'
            }
        },
        {
            $project: {
                title: 1,
                totalStudents: 1,
                averageRating: 1,
                completionRate: {
                    $cond: [
                        { $gt: [{ $size: '$enrollments' }, 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: '$enrollments',
                                                    cond: { $eq: ['$$this.isCompleted', true] }
                                                }
                                            }
                                        },
                                        { $size: '$enrollments' }
                                    ]
                                },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        },
        { $sort: { totalStudents: -1 } }
    ]);

    res.json({
        success: true,
        data: performance
    });
});

/**
 * Get course comparison data
 */
export const getCourseComparison = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    const comparison = await Course.aggregate([
        { $match: { instructorId: teacherObjectId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalEnrollments: { $sum: '$totalStudents' },
                avgRating: { $avg: '$averageRating' }
            }
        }
    ]);

    res.json({
        success: true,
        data: comparison
    });
});

/**
 * Get top performing courses
 */
export const getTopCourses = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const limit = parseInt(req.query.limit as string) || 10;

    const topCourses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    })
        .sort({ totalStudents: -1, averageRating: -1 })
        .limit(limit)
        .select('title thumbnail totalStudents averageRating');

    res.json({
        success: true,
        data: topCourses
    });
});

/**
 * Get revenue by course
 */
export const getCourseRevenue = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('title totalStudents price');

    const revenueData = courses.map(course => {
        const revenue = (course.totalStudents || 0) * (course.price || 0);
        return {
            courseId: course._id,
            courseName: course.title,
            revenue: Math.round(revenue * 100) / 100,
            enrollments: course.totalStudents || 0,
            pricePerStudent: course.price || 0
        };
    });

    // Calculate total revenue
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);

    res.json({
        success: true,
        data: {
            total: Math.round(totalRevenue * 100) / 100,
            byCourse: revenueData
        }
    });
});

/**
 * Get detailed course analytics by ID
 */
export const getCourseAnalyticsDetail = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const courseObjectId = new mongoose.Types.ObjectId(id);

    // Verify course belongs to teacher
    const course = await Course.findOne({
        _id: courseObjectId,
        instructorId: teacherObjectId
    });

    if (!course) {
        throw new AppError('Course not found or access denied', 404);
    }

    // Get enrollment data
    const enrollments = await Enrollment.find({ courseId: courseObjectId });
    const completedCount = enrollments.filter(e => e.isCompleted === true).length;
    const completionRate = enrollments.length > 0
        ? (completedCount / enrollments.length) * 100
        : 0;

    // Calculate revenue
    const revenue = (course.totalStudents || 0) * (course.price || 0);

    const courseData = {
        _id: course._id,
        name: course.title,
        thumbnail: course.thumbnail || '/images/default-course.jpg',
        students: course.totalStudents || 0,
        rating: course.averageRating || 0,
        revenue: Math.round(revenue * 100) / 100,
        completionRate: Math.round(completionRate * 10) / 10,
        views: 0 // TODO: Add views tracking
    };

    res.json({
        success: true,
        data: courseData
    });
});

/**
 * Get enrollment trends for a course
 */
export const getCourseEnrollmentTrends = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const courseObjectId = new mongoose.Types.ObjectId(id);

    // Verify course belongs to teacher
    const course = await Course.findOne({
        _id: courseObjectId,
        instructorId: teacherObjectId
    });

    if (!course) {
        throw new AppError('Course not found or access denied', 404);
    }

    // Get enrollments grouped by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await Enrollment.aggregate([
        {
            $match: {
                courseId: courseObjectId,
                enrolledAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$enrolledAt' },
                    month: { $month: '$enrolledAt' }
                },
                students: { $sum: 1 },
                revenue: { $sum: 0 } // TODO: Add from bills
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
            $project: {
                month: {
                    $arrayElemAt: [
                        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        { $subtract: ['$_id.month', 1] }
                    ]
                },
                students: 1,
                revenue: 1
            }
        }
    ]);

    res.json({
        success: true,
        data: trends
    });
});

/**
 * Get completion rates for a course
 */
export const getCourseCompletionRates = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const courseObjectId = new mongoose.Types.ObjectId(id);

    // Verify course belongs to teacher
    const course = await Course.findOne({
        _id: courseObjectId,
        instructorId: teacherObjectId
    });

    if (!course) {
        throw new AppError('Course not found or access denied', 404);
    }

    const completionData = await Enrollment.aggregate([
        { $match: { courseId: courseObjectId } },
        {
            $group: {
                _id: {
                    isCompleted: '$isCompleted',
                    isActive: '$isActive'
                },
                count: { $sum: 1 }
            }
        }
    ]);

    res.json({
        success: true,
        data: completionData
    });
});

/**
 * Get engagement metrics for a course
 */
export const getCourseEngagementMetrics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const courseObjectId = new mongoose.Types.ObjectId(id);

    // Verify course belongs to teacher
    const course = await Course.findOne({
        _id: courseObjectId,
        instructorId: teacherObjectId
    });

    if (!course) {
        throw new AppError('Course not found or access denied', 404);
    }

    // Get engagement metrics
    const enrollments = await Enrollment.find({ courseId: courseObjectId });
    const avgProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / (enrollments.length || 1);

    const metrics = {
        totalEnrollments: enrollments.length,
        activeStudents: enrollments.filter(e => e.isActive === true).length,
        averageProgress: Math.round(avgProgress * 10) / 10,
        completionRate: enrollments.length > 0
            ? (enrollments.filter(e => e.isCompleted === true).length / enrollments.length) * 100
            : 0
    };

    res.json({
        success: true,
        data: metrics
    });
});

/**
 * Get revenue details for a course
 */
export const getCourseRevenueDetail = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const courseObjectId = new mongoose.Types.ObjectId(id);

    // Verify course belongs to teacher
    const course = await Course.findOne({
        _id: courseObjectId,
        instructorId: teacherObjectId
    }).select('title price totalStudents');

    if (!course) {
        throw new AppError('Course not found or access denied', 404);
    }

    // Calculate total revenue
    const totalRevenue = (course.totalStudents || 0) * (course.price || 0);

    // Get enrollments by month for monthly revenue breakdown
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Enrollment.aggregate([
        {
            $match: {
                courseId: courseObjectId,
                enrolledAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$enrolledAt' },
                    month: { $month: '$enrolledAt' }
                },
                students: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
            $project: {
                month: {
                    $arrayElemAt: [
                        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        { $subtract: ['$_id.month', 1] }
                    ]
                },
                students: 1,
                revenue: { $multiply: ['$students', course.price || 0] }
            }
        }
    ]);

    const revenueDetail = {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pricePerStudent: course.price || 0,
        totalStudents: course.totalStudents || 0,
        monthlyRevenue,
        averageMonthlyRevenue: monthlyRevenue.length > 0
            ? Math.round((totalRevenue / monthlyRevenue.length) * 100) / 100
            : 0
    };

    res.json({
        success: true,
        data: revenueDetail
    });
});

/**
 * Get student feedback for a course
 */
export const getCourseFeedback = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const courseObjectId = new mongoose.Types.ObjectId(id);

    // Verify course belongs to teacher
    const course = await Course.findOne({
        _id: courseObjectId,
        instructorId: teacherObjectId
    });

    if (!course) {
        throw new AppError('Course not found or access denied', 404);
    }

    // Get reviews (assuming Review model exists)
    // TODO: Implement with Review/Rating model when available
    const feedback = {
        averageRating: course.averageRating || 0,
        totalReviews: 0,
        ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        },
        recentReviews: []
    };

    res.json({
        success: true,
        data: feedback
    });
});

