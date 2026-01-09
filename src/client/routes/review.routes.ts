import express from 'express';
import { CourseReview } from '../../shared/models';
import { authenticate } from '../../shared/middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/client/ratings/course/:courseId
 * Get all reviews for a course (with teacher response)
 */
router.get('/course/:courseId', async (req: any, res) => {
    try {
        const { courseId } = req.params;
        const {
            page = 1,
            limit = 12,
            rating,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search = ''
        } = req.query;

        const query: any = {
            courseId: new mongoose.Types.ObjectId(courseId),
            status: 'published' // Only show published reviews
        };

        // Filter by rating if specified
        if (rating && Number(rating) > 0) {
            query.rating = Number(rating);
        }

        // Search in content if specified
        if (search && search.trim()) {
            query.$or = [
                { content: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort: any = {};
        if (sortBy === 'createdAt') {
            sort.createdAt = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'rating') {
            sort.rating = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'helpfulCount') {
            sort.helpfulCount = sortOrder === 'asc' ? 1 : -1;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [ratings, total] = await Promise.all([
            CourseReview.find(query)
                .populate('userId', 'firstName lastName avatar')
                .populate('teacherResponse.userId', 'firstName lastName')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            CourseReview.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                ratings: ratings.map(r => ({
                    _id: r._id,
                    studentId: r.userId,
                    rating: r.rating,
                    comment: r.content, // Map 'content' to 'comment' for frontend
                    title: r.title,
                    createdAt: r.createdAt,
                    helpfulCount: r.helpfulCount,
                    teacherResponse: r.teacherResponse ? {
                        _id: r.teacherResponse.userId, // For compatibility
                        response: r.teacherResponse.content,
                        createdAt: r.teacherResponse.respondedAt
                    } : undefined
                })),
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/client/ratings/stats/:courseId
 * Get review statistics for a course
 */
router.get('/stats/:courseId', async (req: any, res) => {
    try {
        const { courseId } = req.params;

        const [avgRatingResult, distribution, totalCount] = await Promise.all([
            CourseReview.aggregate([
                {
                    $match: {
                        courseId: new mongoose.Types.ObjectId(courseId),
                        status: 'published'
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                }
            ]),
            CourseReview.aggregate([
                {
                    $match: {
                        courseId: new mongoose.Types.ObjectId(courseId),
                        status: 'published'
                    }
                },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                }
            ]),
            CourseReview.countDocuments({
                courseId: new mongoose.Types.ObjectId(courseId),
                status: 'published'
            })
        ]);

        // Build rating distribution object
        const ratingDistribution: any = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(item => {
            if (item._id >= 1 && item._id <= 5) {
                ratingDistribution[item._id] = item.count;
            }
        });

        // Calculate response rate
        const responsedCount = await CourseReview.countDocuments({
            courseId: new mongoose.Types.ObjectId(courseId),
            status: 'published',
            'teacherResponse.content': { $exists: true, $ne: null }
        });

        const responseRate = totalCount > 0 ? Math.round((responsedCount / totalCount) * 100) : 0;

        // Recent reviews (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentReviews = await CourseReview.countDocuments({
            courseId: new mongoose.Types.ObjectId(courseId),
            status: 'published',
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.json({
            success: true,
            data: {
                totalReviews: avgRatingResult[0]?.totalReviews || 0,
                averageRating: avgRatingResult[0]?.averageRating || 0,
                ratingDistribution,
                responseRate,
                recentReviews
            }
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * POST /api/client/teacher-response/:ratingId
 * Create teacher response to a review
 */
router.post('/teacher-response/:ratingId', async (req: any, res) => {
    try {
        const { ratingId } = req.params;
        const { response } = req.body;

        if (!response || !response.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Response content is required'
            });
        }

        const review = await CourseReview.findById(ratingId).populate('courseId');
        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        // Check if user is the course instructor
        const courseId = review.courseId as any;
        if (courseId.instructorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Only the course instructor can respond to reviews'
            });
        }

        // Add teacher response
        review.teacherResponse = {
            userId: new mongoose.Types.ObjectId(req.user.id),
            content: response.trim(),
            respondedAt: new Date()
        };

        await review.save();

        res.json({
            success: true,
            message: 'Teacher response added successfully',
            data: {
                reviewId: review._id,
                teacherResponse: review.teacherResponse
            }
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * PUT /api/client/teacher-response/:responseId
 * Update teacher response
 */
router.put('/teacher-response/:responseId', async (req: any, res) => {
    try {
        const { responseId } = req.params;
        const { response } = req.body;

        if (!response || !response.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Response content is required'
            });
        }

        // Find review by teacher response userId
        const review = await CourseReview.findOne({
            'teacherResponse.userId': new mongoose.Types.ObjectId(responseId)
        }).populate('courseId');

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Response not found'
            });
        }

        // Check if user is the course instructor
        const courseId = review.courseId as any;
        if (courseId.instructorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Only the course instructor can update this response'
            });
        }

        // Update teacher response
        if (review.teacherResponse) {
            review.teacherResponse.content = response.trim();
            review.teacherResponse.respondedAt = new Date();
            await review.save();
        }

        res.json({
            success: true,
            message: 'Teacher response updated successfully',
            data: {
                reviewId: review._id,
                teacherResponse: review.teacherResponse
            }
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * DELETE /api/client/teacher-response/:responseId
 * Delete teacher response
 */
router.delete('/teacher-response/:responseId', async (req: any, res) => {
    try {
        const { responseId } = req.params;

        // Find review by teacher response userId
        const review = await CourseReview.findOne({
            'teacherResponse.userId': new mongoose.Types.ObjectId(responseId)
        }).populate('courseId');

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Response not found'
            });
        }

        // Check if user is the course instructor
        const courseId = review.courseId as any;
        if (courseId.instructorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Only the course instructor can delete this response'
            });
        }

        // Remove teacher response
        review.teacherResponse = undefined;
        await review.save();

        res.json({
            success: true,
            message: 'Teacher response deleted successfully'
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * POST /api/client/ratings/:id/helpful
 * Mark review as helpful
 */
router.post('/:id/helpful', async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const review = await CourseReview.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        await review.markHelpful(userId);

        res.json({
            success: true,
            message: 'Review marked as helpful',
            data: {
                reviewId: review._id,
                helpfulCount: review.helpfulCount
            }
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * POST /api/client/ratings/:id/report
 * Report a review
 */
router.post('/:id/report', async (req: any, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = new mongoose.Types.ObjectId(req.user.id);

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Report reason is required'
            });
        }

        const review = await CourseReview.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        await review.report(userId);

        res.json({
            success: true,
            message: 'Review reported successfully',
            data: {
                reviewId: review._id,
                reportCount: review.reportCount,
                status: review.status
            }
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

export default router;

