import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import Course from '../../shared/models/core/Course';
import Enrollment from '../../shared/models/core/Enrollment';
import User from '../../shared/models/core/User';
import mongoose from 'mongoose';

/**
 * Get student analytics overview
 */
export const getStudentOverview = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // Verify user is a teacher
    if (!req.user.roles || !Array.isArray(req.user.roles) || !req.user.roles.includes('teacher')) {
        throw new AppError('Access denied. Teacher role required.', 403);
    }

    // Get teacher's courses
    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('_id');

    const courseIds = courses.map(c => c._id);

    // Get all enrollments for teacher's courses
    const enrollments = await Enrollment.find({
        courseId: { $in: courseIds }
    });

    // Calculate metrics
    const totalStudents = new Set(enrollments.map(e => e.studentId.toString())).size;
    const activeStudents = enrollments.filter(e => e.isActive).length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    const averageProgress = enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
        : 0;

    // Calculate retention rate (students still active)
    const retentionRate = totalStudents > 0
        ? (activeStudents / totalStudents) * 100
        : 0;

    const overview = {
        totalStudents,
        activeStudents,
        completedCourses,
        averageProgress: Math.round(averageProgress * 10) / 10,
        retentionRate: Math.round(retentionRate * 10) / 10
    };

    res.json({
        success: true,
        data: overview
    });
});

/**
 * Get student demographics
 */
export const getStudentDemographics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // Get teacher's courses
    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('_id');

    const courseIds = courses.map(c => c._id);

    // Get unique student IDs
    const enrollments = await Enrollment.find({
        courseId: { $in: courseIds }
    }).distinct('studentId');

    // Get student details
    const students = await User.find({
        _id: { $in: enrollments }
    }).select('dateOfBirth country');

    // Calculate age groups
    const ageGroups: { [key: string]: number } = {
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45+': 0
    };

    const countries: { [key: string]: number } = {};

    students.forEach(student => {
        // Age calculation
        if (student.dateOfBirth) {
            const age = new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear();
            if (age >= 18 && age <= 24) ageGroups['18-24']++;
            else if (age >= 25 && age <= 34) ageGroups['25-34']++;
            else if (age >= 35 && age <= 44) ageGroups['35-44']++;
            else if (age >= 45) ageGroups['45+']++;
        }

        // Country
        if (student.country) {
            countries[student.country] = (countries[student.country] || 0) + 1;
        }
    });

    // Convert to array format with percentages
    const total = students.length || 1;

    const ageGroupsArray = Object.entries(ageGroups).map(([age, count]) => ({
        age,
        count,
        percentage: Math.round((count / total) * 100 * 10) / 10
    }));

    const countriesArray = Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({
            country,
            count,
            percentage: Math.round((count / total) * 100 * 10) / 10
        }));

    res.json({
        success: true,
        data: {
            ageGroups: ageGroupsArray,
            countries: countriesArray
        }
    });
});

/**
 * Get student progress data
 */
export const getStudentProgress = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // Get teacher's courses
    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('_id title');

    const courseIds = courses.map(c => c._id);

    // Get enrollments with progress
    const progressData = await Enrollment.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        {
            $group: {
                _id: '$courseId',
                averageProgress: { $avg: '$progress' },
                studentsStarted: { $sum: 1 },
                studentsCompleted: {
                    $sum: { $cond: ['$isCompleted', 1, 0] }
                }
            }
        },
        {
            $lookup: {
                from: 'courses',
                localField: '_id',
                foreignField: '_id',
                as: 'course'
            }
        },
        { $unwind: '$course' },
        {
            $project: {
                courseName: '$course.title',
                averageProgress: { $round: ['$averageProgress', 1] },
                studentsStarted: 1,
                studentsCompleted: 1,
                completionRate: {
                    $cond: [
                        { $gt: ['$studentsStarted', 0] },
                        { $round: [{ $multiply: [{ $divide: ['$studentsCompleted', '$studentsStarted'] }, 100] }, 1] },
                        0
                    ]
                }
            }
        },
        { $sort: { studentsStarted: -1 } }
    ]);

    res.json({
        success: true,
        data: progressData
    });
});

/**
 * Get student retention rate
 */
export const getStudentRetention = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // Get teacher's courses
    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('_id');

    const courseIds = courses.map(c => c._id);

    // Get retention data by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const retentionData = await Enrollment.aggregate([
        {
            $match: {
                courseId: { $in: courseIds },
                enrolledAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$enrolledAt' },
                    month: { $month: '$enrolledAt' }
                },
                enrolled: { $sum: 1 },
                active: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                },
                completed: {
                    $sum: { $cond: ['$isCompleted', 1, 0] }
                }
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
                enrolled: 1,
                active: 1,
                completed: 1,
                retentionRate: {
                    $cond: [
                        { $gt: ['$enrolled', 0] },
                        { $round: [{ $multiply: [{ $divide: ['$active', '$enrolled'] }, 100] }, 1] },
                        0
                    ]
                }
            }
        }
    ]);

    res.json({
        success: true,
        data: retentionData
    });
});

/**
 * Get student satisfaction metrics
 */
export const getStudentSatisfaction = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // Get teacher's courses with ratings
    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('_id title averageRating totalRatings');

    const satisfactionData = courses.map(course => ({
        courseId: course._id,
        courseName: course.title,
        averageRating: course.averageRating || 0,
        totalRatings: course.totalRatings || 0,
        satisfactionLevel: course.averageRating >= 4.5 ? 'Excellent'
            : course.averageRating >= 4 ? 'Good'
                : course.averageRating >= 3 ? 'Average'
                    : 'Needs Improvement'
    }));

    // Calculate overall satisfaction
    const overallRating = courses.length > 0
        ? courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.length
        : 0;

    const totalRatings = courses.reduce((sum, c) => sum + (c.totalRatings || 0), 0);

    res.json({
        success: true,
        data: {
            overall: {
                averageRating: Math.round(overallRating * 10) / 10,
                totalRatings
            },
            byCourse: satisfactionData
        }
    });
});

/**
 * Get student activity metrics
 */
export const getStudentActivity = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const teacherId = req.user.id;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const { timeRange = '7days' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
        case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
        case '90days':
            startDate.setDate(endDate.getDate() - 90);
            break;
        default:
            startDate.setDate(endDate.getDate() - 7);
    }

    // Get teacher's courses
    const courses = await Course.find({
        instructorId: teacherObjectId,
        status: 'published'
    }).select('_id');

    const courseIds = courses.map(c => c._id);

    // Get recent activity
    const activityData = await Enrollment.find({
        courseId: { $in: courseIds },
        lastActivityAt: { $gte: startDate, $lte: endDate }
    })
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'title')
        .sort({ lastActivityAt: -1 })
        .limit(50);

    const formattedActivity = activityData.map(enrollment => ({
        studentId: enrollment.studentId._id,
        studentName: `${(enrollment.studentId as any).firstName} ${(enrollment.studentId as any).lastName}`,
        courseId: enrollment.courseId._id,
        courseName: (enrollment.courseId as any).title,
        progress: enrollment.progress,
        lastActivity: enrollment.lastActivityAt,
        isCompleted: enrollment.isCompleted,
        totalTimeSpent: enrollment.totalTimeSpent
    }));

    // Calculate daily activity
    const dailyActivity = await Enrollment.aggregate([
        {
            $match: {
                courseId: { $in: courseIds },
                lastActivityAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$lastActivityAt' },
                    month: { $month: '$lastActivityAt' },
                    day: { $dayOfMonth: '$lastActivityAt' }
                },
                activeStudents: { $addToSet: '$studentId' }
            }
        },
        {
            $project: {
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day'
                    }
                },
                activeStudents: { $size: '$activeStudents' }
            }
        },
        { $sort: { date: 1 } }
    ]);

    res.json({
        success: true,
        data: {
            recentActivity: formattedActivity,
            dailyActivity
        }
    });
});

