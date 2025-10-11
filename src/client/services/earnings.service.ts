import { Transaction } from '../../shared/models/core/Transaction';
import { Withdrawal } from '../../shared/models/core/Withdrawal';
import { Bill, Course, User, Enrollment } from '../../shared/models/core';
import mongoose from 'mongoose';

export class EarningsService {
    /**
     * Get earnings overview
     */
    static async getOverview(teacherId: string) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        // First check if there are any transactions
        const hasTransactions = await Transaction.exists({ teacherId: teacherObjectId });

        // If no transactions, calculate from courses
        if (!hasTransactions) {
            return await this.getOverviewFromCourses(teacherId);
        }

        const [totalEarnings, pendingEarnings, totalWithdrawn, currentMonth, lastMonth] = await Promise.all([
            // Total earnings (completed sales)
            Transaction.aggregate([
                {
                    $match: {
                        teacherId: new mongoose.Types.ObjectId(teacherId),
                        type: 'sale',
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netAmount' }
                    }
                }
            ]),
            // Pending earnings
            Transaction.aggregate([
                {
                    $match: {
                        teacherId: new mongoose.Types.ObjectId(teacherId),
                        type: 'sale',
                        status: 'pending'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netAmount' }
                    }
                }
            ]),
            // Total withdrawn
            Transaction.aggregate([
                {
                    $match: {
                        teacherId: new mongoose.Types.ObjectId(teacherId),
                        type: 'withdrawal',
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netAmount' }
                    }
                }
            ]),
            // Current month earnings
            this.getCurrentMonthEarnings(teacherId),
            // Last month earnings
            this.getLastMonthEarnings(teacherId)
        ]);

        const total = totalEarnings[0]?.total || 0;
        const pending = pendingEarnings[0]?.total || 0;
        const withdrawn = totalWithdrawn[0]?.total || 0;

        // Calculate growth rate
        const growthRate = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

        return {
            totalEarnings: Math.round(total * 100) / 100,
            availableBalance: Math.round((total - withdrawn) * 100) / 100,
            pendingEarnings: Math.round(pending * 100) / 100,
            totalWithdrawn: Math.round(withdrawn * 100) / 100,
            currentMonthEarnings: Math.round(currentMonth * 100) / 100,
            lastMonthEarnings: Math.round(lastMonth * 100) / 100,
            growthRate: Math.round(growthRate * 10) / 10
        };
    }

    /**
     * Get current balance
     */
    static async getBalance(teacherId: string) {
        const overview = await this.getOverview(teacherId);
        return {
            availableBalance: overview.availableBalance,
            pendingEarnings: overview.pendingEarnings,
            totalWithdrawn: overview.totalWithdrawn
        };
    }

    /**
     * Get earnings history
     */
    static async getHistory(teacherId: string, filters: any) {
        const { page = 1, limit = 20, startDate, endDate, courseId } = filters;
        const skip = (page - 1) * limit;

        const query: any = {
            teacherId: new mongoose.Types.ObjectId(teacherId),
            type: 'sale'
        };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (courseId) {
            query.courseId = new mongoose.Types.ObjectId(courseId);
        }

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('courseId', 'title')
                .populate('studentId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(query)
        ]);

        return {
            history: transactions.map(t => ({
                id: t._id,
                courseTitle: (t.courseId as any)?.title || 'Unknown Course',
                studentName: t.studentId ? `${(t.studentId as any).firstName} ${(t.studentId as any).lastName}` : 'Unknown Student',
                amount: t.netAmount,
                type: t.type,
                status: t.status,
                createdAt: t.createdAt
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get pending earnings
     */
    static async getPendingEarnings(teacherId: string) {
        const transactions = await Transaction.find({
            teacherId: new mongoose.Types.ObjectId(teacherId),
            type: 'sale',
            status: 'pending'
        }).populate('courseId', 'title').populate('studentId', 'firstName lastName');

        return transactions.map(t => ({
            id: t._id,
            courseTitle: (t.courseId as any)?.title || 'Unknown Course',
            studentName: t.studentId ? `${(t.studentId as any).firstName} ${(t.studentId as any).lastName}` : 'Unknown Student',
            amount: t.netAmount,
            createdAt: t.createdAt
        }));
    }

    /**
     * Request withdrawal
     */
    static async requestWithdrawal(teacherId: string, withdrawalData: any) {
        const { amount, method, accountDetails, notes } = withdrawalData;

        // Check if user has sufficient balance
        const balance = await this.getBalance(teacherId);
        if (balance.availableBalance < amount) {
            throw new Error('Insufficient balance');
        }

        const withdrawal = new Transaction({
            teacherId: new mongoose.Types.ObjectId(teacherId),
            type: 'withdrawal',
            amount,
            netAmount: amount,
            status: 'pending',
            paymentMethod: method,
            description: `Withdrawal request - ${method}`,
            metadata: {
                accountDetails,
                notes
            }
        });

        await withdrawal.save();
        return withdrawal;
    }

    /**
     * Get withdrawals
     */
    static async getWithdrawals(teacherId: string, filters: any) {
        const { page = 1, limit = 20, status } = filters;
        const skip = (page - 1) * limit;

        const query: any = {
            teacherId: new mongoose.Types.ObjectId(teacherId),
            type: 'withdrawal'
        };

        if (status) {
            query.status = status;
        }

        const [withdrawals, total] = await Promise.all([
            Transaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(query)
        ]);

        return {
            withdrawals: withdrawals.map(w => ({
                id: w._id,
                amount: w.netAmount,
                status: w.status,
                method: w.paymentMethod,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get withdrawal by ID
     */
    static async getWithdrawalById(id: string, teacherId: string) {
        const withdrawal = await Transaction.findOne({
            _id: id,
            teacherId: new mongoose.Types.ObjectId(teacherId),
            type: 'withdrawal'
        });

        if (!withdrawal) return null;

        return {
            id: withdrawal._id,
            amount: withdrawal.netAmount,
            status: withdrawal.status,
            method: withdrawal.paymentMethod,
            createdAt: withdrawal.createdAt,
            updatedAt: withdrawal.updatedAt,
            metadata: withdrawal.metadata
        };
    }

    /**
     * Get earnings stats
     */
    static async getStats(teacherId: string, period: string) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
        let dateFilter = {};

        const now = new Date();
        switch (period) {
            case 'daily':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                dateFilter = { createdAt: { $gte: today } };
                break;
            case 'weekly':
                const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekStart } };
                break;
            case 'monthly':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { createdAt: { $gte: monthStart } };
                break;
            case 'yearly':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                dateFilter = { createdAt: { $gte: yearStart } };
                break;
        }

        const [totalEarnings, totalSales, averageOrderValue] = await Promise.all([
            Transaction.aggregate([
                {
                    $match: {
                        teacherId: teacherObjectId,
                        type: 'sale',
                        status: 'completed',
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netAmount' }
                    }
                }
            ]),
            Transaction.countDocuments({
                teacherId: teacherObjectId,
                type: 'sale',
                status: 'completed',
                ...dateFilter
            }),
            Transaction.aggregate([
                {
                    $match: {
                        teacherId: teacherObjectId,
                        type: 'sale',
                        status: 'completed',
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: null,
                        average: { $avg: '$netAmount' }
                    }
                }
            ])
        ]);

        return {
            totalEarnings: totalEarnings[0]?.total || 0,
            totalSales,
            averageOrderValue: averageOrderValue[0]?.average || 0,
            period
        };
    }

    /**
     * Get transactions
     */
    static async getTransactions(teacherId: string, filters: any) {
        const { page = 1, limit = 20, type, startDate, endDate, courseId, status } = filters;
        const skip = (page - 1) * limit;

        const query: any = {
            teacherId: new mongoose.Types.ObjectId(teacherId)
        };

        if (type) query.type = type;
        if (status) query.status = status;
        if (courseId) query.courseId = new mongoose.Types.ObjectId(courseId);

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Check if there are any transactions
        const hasTransactions = await Transaction.exists(query);

        if (!hasTransactions) {
            // Return mock data from enrollments
            return await this.getTransactionsFromEnrollments(teacherId, filters);
        }

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('courseId', 'title')
                .populate('studentId', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(query)
        ]);

        return {
            transactions: transactions.map(t => ({
                _id: t._id,
                courseId: t.courseId,
                studentId: t.studentId,
                teacherId: t.teacherId,
                amount: t.amount,
                netAmount: t.netAmount,
                type: t.type,
                status: t.status,
                paymentMethod: t.paymentMethod,
                transactionId: t._id,
                courseTitle: (t.courseId as any)?.title || 'Unknown Course',
                studentName: t.studentId ? `${(t.studentId as any).firstName} ${(t.studentId as any).lastName}` : 'Unknown Student',
                createdAt: t.createdAt,
                updatedAt: t.updatedAt
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get transaction by ID
     */
    static async getTransactionById(id: string, teacherId: string) {
        const transaction = await Transaction.findOne({
            _id: id,
            teacherId: new mongoose.Types.ObjectId(teacherId)
        }).populate('courseId', 'title').populate('studentId', 'firstName lastName');

        if (!transaction) return null;

        return {
            id: transaction._id,
            courseTitle: (transaction.courseId as any)?.title || 'Unknown Course',
            studentName: transaction.studentId ? `${(transaction.studentId as any).firstName} ${(transaction.studentId as any).lastName}` : 'Unknown Student',
            amount: transaction.netAmount,
            type: transaction.type,
            status: transaction.status,
            paymentMethod: transaction.paymentMethod,
            createdAt: transaction.createdAt
        };
    }

    /**
     * Get transaction stats
     */
    static async getTransactionStats(teacherId: string) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        const [totalTransactions, completedTransactions, pendingTransactions, totalRevenue] = await Promise.all([
            Transaction.countDocuments({ teacherId: teacherObjectId }),
            Transaction.countDocuments({ teacherId: teacherObjectId, status: 'completed' }),
            Transaction.countDocuments({ teacherId: teacherObjectId, status: 'pending' }),
            Transaction.aggregate([
                {
                    $match: {
                        teacherId: teacherObjectId,
                        type: 'sale',
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$netAmount' }
                    }
                }
            ])
        ]);

        return {
            totalTransactions,
            completedTransactions,
            pendingTransactions,
            totalRevenue: totalRevenue[0]?.total || 0,
            completionRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0
        };
    }

    /**
     * Export transactions
     */
    static async exportTransactions(teacherId: string, filters: any) {
        const { startDate, endDate, format = 'csv' } = filters;

        const query: any = {
            teacherId: new mongoose.Types.ObjectId(teacherId),
            type: 'sale'
        };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .populate('courseId', 'title')
            .populate('studentId', 'firstName lastName')
            .sort({ createdAt: -1 });

        if (format === 'csv') {
            let csv = 'Date,Type,Description,Amount,Status\n';
            transactions.forEach(t => {
                csv += `${t.createdAt.toISOString().split('T')[0]},${t.type},${t.description},${t.netAmount},${t.status}\n`;
            });
            return csv;
        }

        return transactions;
    }

    /**
     * Get monthly breakdown for chart
     */
    static async getMonthlyBreakdown(teacherId: string, months: number = 6) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
        const breakdown = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const courses = await Course.find({
                instructorId: teacherObjectId,
                status: 'published',
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }).select('totalStudents price');

            const monthlyRevenue = courses.reduce((sum, course) => {
                return sum + ((course.totalStudents || 0) * (course.price || 0));
            }, 0);

            breakdown.push({
                month: date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
                earnings: Math.round(monthlyRevenue * 100) / 100,
                students: courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0),
                courses: courses.length
            });
        }
        return breakdown;
    }

    static async getOverviewFromCourses(teacherId: string) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        // Get all teacher's published courses
        const courses = await Course.find({
            instructorId: teacherObjectId,
            status: 'published'
        }).select('totalStudents price createdAt');

        // Calculate total revenue
        const totalRevenue = courses.reduce((sum, course) => {
            return sum + ((course.totalStudents || 0) * (course.price || 0));
        }, 0);

        // Get current month courses
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const currentMonthCourses = courses.filter(c => c.createdAt >= currentMonthStart);
        const currentMonthRevenue = currentMonthCourses.reduce((sum, course) => {
            return sum + ((course.totalStudents || 0) * (course.price || 0));
        }, 0);

        // Get last month
        const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        const lastMonthEnd = currentMonthStart;
        const lastMonthCourses = courses.filter(c => c.createdAt >= lastMonthStart && c.createdAt < lastMonthEnd);
        const lastMonthRevenue = lastMonthCourses.reduce((sum, course) => {
            return sum + ((course.totalStudents || 0) * (course.price || 0));
        }, 0);

        const growthRate = lastMonthRevenue > 0
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        // Find top earning course
        const topCourse = courses
            .map(c => ({
                id: c._id,
                title: c.title,
                earnings: (c.totalStudents || 0) * (c.price || 0)
            }))
            .sort((a, b) => b.earnings - a.earnings)[0];

        const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);

        return {
            totalEarnings: Math.round(totalRevenue * 100) / 100,
            availableBalance: Math.round(totalRevenue * 100) / 100,
            pendingEarnings: 0,
            totalWithdrawn: 0,
            currentMonthEarnings: Math.round(currentMonthRevenue * 100) / 100,
            lastMonthEarnings: Math.round(lastMonthRevenue * 100) / 100,
            growthRate: Math.round(growthRate * 10) / 10,
            topCourse: topCourse || null,
            totalStudents,
            totalCourses: courses.length,
            note: 'Calculated from course enrollments (no transactions yet)'
        };
    }

    static async getTransactionsFromEnrollments(teacherId: string, filters: any) {
        const { page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        const enrollments = await Enrollment.find({
            isActive: true
        })
            .populate('courseId', 'title price instructorId')
            .populate('studentId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();

        const teacherEnrollments = enrollments.filter(e =>
            e.courseId &&
            (e.courseId as any).instructorId.toString() === teacherId
        );

        const total = teacherEnrollments.length;
        const paginatedEnrollments = teacherEnrollments.slice(skip, skip + limit);

        const transactions = paginatedEnrollments.map(enrollment => ({
            _id: `mock_${enrollment._id}`,
            courseId: (enrollment.courseId as any)._id,
            studentId: (enrollment.studentId as any)._id,
            teacherId: teacherObjectId,
            amount: (enrollment.courseId as any).price || 0,
            netAmount: (enrollment.courseId as any).price || 0,
            type: 'sale',
            status: 'completed',
            paymentMethod: 'enrollment_sync',
            transactionId: `TXN_${enrollment._id}`,
            courseTitle: (enrollment.courseId as any).title,
            studentName: `${(enrollment.studentId as any).firstName} ${(enrollment.studentId as any).lastName}`,
            createdAt: enrollment.createdAt || new Date(),
            updatedAt: enrollment.updatedAt || new Date()
        }));

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Helper methods
    static async getCurrentMonthEarnings(teacherId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const result = await Transaction.aggregate([
            {
                $match: {
                    teacherId: new mongoose.Types.ObjectId(teacherId),
                    type: 'sale',
                    status: 'completed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$netAmount' }
                }
            }
        ]);

        return result[0]?.total || 0;
    }

    static async getLastMonthEarnings(teacherId: string) {
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const result = await Transaction.aggregate([
            {
                $match: {
                    teacherId: new mongoose.Types.ObjectId(teacherId),
                    type: 'sale',
                    status: 'completed',
                    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$netAmount' }
                }
            }
        ]);

        return result[0]?.total || 0;
    }

    // Analytics Methods
    static async getAnalyticsOverview(teacherId: string) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        // Get all courses with enrollments
        const courses = await Course.find({
            instructorId: teacherObjectId,
            status: 'published'
        }).select('title totalStudents price averageRating createdAt');

        const totalRevenue = courses.reduce((sum, course) => {
            return sum + ((course.totalStudents || 0) * (course.price || 0));
        }, 0);

        const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
        const averageRating = courses.length > 0
            ? courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.length
            : 0;

        // Calculate growth
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthRevenue = courses
            .filter(c => c.createdAt.getMonth() === currentMonth && c.createdAt.getFullYear() === currentYear)
            .reduce((sum, c) => sum + ((c.totalStudents || 0) * (c.price || 0)), 0);

        const lastMonthRevenue = courses
            .filter(c => c.createdAt.getMonth() === lastMonth && c.createdAt.getFullYear() === lastMonthYear)
            .reduce((sum, c) => sum + ((c.totalStudents || 0) * (c.price || 0)), 0);

        const growthRate = lastMonthRevenue > 0
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        return {
            totalRevenue,
            totalStudents,
            totalCourses: courses.length,
            averageRating: Math.round(averageRating * 10) / 10,
            growthRate: Math.round(growthRate * 10) / 10,
            currentMonthRevenue,
            lastMonthRevenue,
            topPerformingCourse: courses
                .map(c => ({
                    id: c._id,
                    title: c.title,
                    revenue: (c.totalStudents || 0) * (c.price || 0),
                    students: c.totalStudents || 0,
                    rating: c.averageRating || 0
                }))
                .sort((a, b) => b.revenue - a.revenue)[0] || null
        };
    }

    static async getTrends(teacherId: string, period: string = '30days') {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
            case '7days':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90days':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '1year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        // Get courses created in period
        const courses = await Course.find({
            instructorId: teacherObjectId,
            status: 'published',
            createdAt: { $gte: startDate, $lte: endDate }
        }).select('title totalStudents price createdAt');

        // Group by day
        const dailyData = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const dayCourses = courses.filter(c =>
                c.createdAt >= dayStart && c.createdAt < dayEnd
            );

            const dayRevenue = dayCourses.reduce((sum, c) =>
                sum + ((c.totalStudents || 0) * (c.price || 0)), 0
            );

            const dayStudents = dayCourses.reduce((sum, c) =>
                sum + (c.totalStudents || 0), 0
            );

            dailyData.push({
                date: currentDate.toISOString().split('T')[0],
                revenue: dayRevenue,
                students: dayStudents,
                courses: dayCourses.length
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dailyData;
    }

    static async getEarningsByCourse(teacherId: string) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        const courses = await Course.find({
            instructorId: teacherObjectId,
            status: 'published'
        }).select('title totalStudents price averageRating thumbnail createdAt');

        const courseEarnings = courses.map(course => ({
            id: course._id,
            title: course.title,
            thumbnail: course.thumbnail,
            revenue: (course.totalStudents || 0) * (course.price || 0),
            students: course.totalStudents || 0,
            price: course.price || 0,
            rating: course.averageRating || 0,
            createdAt: course.createdAt
        })).sort((a, b) => b.revenue - a.revenue);

        const totalRevenue = courseEarnings.reduce((sum, c) => sum + c.revenue, 0);

        return {
            courses: courseEarnings,
            totalRevenue,
            averageRevenuePerCourse: courseEarnings.length > 0
                ? totalRevenue / courseEarnings.length
                : 0
        };
    }

    static async getEarningsByPeriod(teacherId: string, options: {
        groupBy: string;
        startDate?: string;
        endDate?: string;
    }) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
        const { groupBy, startDate, endDate } = options;

        const filter: any = {
            instructorId: teacherObjectId,
            status: 'published'
        };

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const courses = await Course.find(filter).select('title totalStudents price createdAt');

        // Group by period
        const groupedData: any = {};

        courses.forEach(course => {
            let periodKey = '';
            const courseDate = new Date(course.createdAt);
            const revenue = (course.totalStudents || 0) * (course.price || 0);

            switch (groupBy) {
                case 'day':
                    periodKey = courseDate.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(courseDate);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    periodKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    periodKey = `${courseDate.getFullYear()}-${String(courseDate.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'quarter':
                    const quarter = Math.floor(courseDate.getMonth() / 3) + 1;
                    periodKey = `${courseDate.getFullYear()}-Q${quarter}`;
                    break;
                case 'year':
                    periodKey = courseDate.getFullYear().toString();
                    break;
                default:
                    periodKey = `${courseDate.getFullYear()}-${String(courseDate.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!groupedData[periodKey]) {
                groupedData[periodKey] = {
                    period: periodKey,
                    revenue: 0,
                    students: 0,
                    courses: 0
                };
            }

            groupedData[periodKey].revenue += revenue;
            groupedData[periodKey].students += (course.totalStudents || 0);
            groupedData[periodKey].courses += 1;
        });

        return Object.values(groupedData).sort((a: any, b: any) => a.period.localeCompare(b.period));
    }

    static async getForecast(teacherId: string, months: number = 3) {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        // Get historical data for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const courses = await Course.find({
            instructorId: teacherObjectId,
            status: 'published',
            createdAt: { $gte: sixMonthsAgo }
        }).select('totalStudents price createdAt');

        // Calculate monthly averages
        const monthlyData: any = {};

        courses.forEach(course => {
            const courseDate = new Date(course.createdAt);
            const monthKey = `${courseDate.getFullYear()}-${String(courseDate.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    revenue: 0,
                    students: 0,
                    courses: 0
                };
            }

            const revenue = (course.totalStudents || 0) * (course.price || 0);
            monthlyData[monthKey].revenue += revenue;
            monthlyData[monthKey].students += (course.totalStudents || 0);
            monthlyData[monthKey].courses += 1;
        });

        const monthlyRevenues = Object.values(monthlyData).map((m: any) => m.revenue);
        const averageMonthlyRevenue = monthlyRevenues.length > 0
            ? monthlyRevenues.reduce((sum, r) => sum + r, 0) / monthlyRevenues.length
            : 0;

        // Simple forecast based on average
        const forecast = [];
        const currentDate = new Date();

        for (let i = 1; i <= months; i++) {
            const forecastDate = new Date(currentDate);
            forecastDate.setMonth(forecastDate.getMonth() + i);

            forecast.push({
                month: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
                predictedRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
                confidence: Math.max(50, 100 - (i * 10)) // Decreasing confidence
            });
        }

        return {
            forecast,
            averageMonthlyRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
            historicalData: Object.values(monthlyData),
            basedOnMonths: Object.keys(monthlyData).length
        };
    }

    static async getComparison(teacherId: string, compareTo: string = 'previous_period') {
        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
        const currentDate = new Date();

        let startDate: Date, endDate: Date;
        let comparisonStartDate: Date, comparisonEndDate: Date;

        if (compareTo === 'previous_period') {
            // Current month vs previous month
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            comparisonStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            comparisonEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        } else {
            // Current period vs same period last year
            startDate = new Date(currentDate.getFullYear(), 0, 1);
            endDate = new Date(currentDate.getFullYear(), 11, 31);

            comparisonStartDate = new Date(currentDate.getFullYear() - 1, 0, 1);
            comparisonEndDate = new Date(currentDate.getFullYear() - 1, 11, 31);
        }

        const currentCourses = await Course.find({
            instructorId: teacherObjectId,
            status: 'published',
            createdAt: { $gte: startDate, $lte: endDate }
        }).select('totalStudents price');

        const comparisonCourses = await Course.find({
            instructorId: teacherObjectId,
            status: 'published',
            createdAt: { $gte: comparisonStartDate, $lte: comparisonEndDate }
        }).select('totalStudents price');

        const currentRevenue = currentCourses.reduce((sum, c) =>
            sum + ((c.totalStudents || 0) * (c.price || 0)), 0
        );

        const comparisonRevenue = comparisonCourses.reduce((sum, c) =>
            sum + ((c.totalStudents || 0) * (c.price || 0)), 0
        );

        const currentStudents = currentCourses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
        const comparisonStudents = comparisonCourses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);

        const revenueGrowth = comparisonRevenue > 0
            ? ((currentRevenue - comparisonRevenue) / comparisonRevenue) * 100
            : 0;

        const studentGrowth = comparisonStudents > 0
            ? ((currentStudents - comparisonStudents) / comparisonStudents) * 100
            : 0;

        return {
            current: {
                revenue: Math.round(currentRevenue * 100) / 100,
                students: currentStudents,
                courses: currentCourses.length,
                period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
            },
            comparison: {
                revenue: Math.round(comparisonRevenue * 100) / 100,
                students: comparisonStudents,
                courses: comparisonCourses.length,
                period: `${comparisonStartDate.toISOString().split('T')[0]} to ${comparisonEndDate.toISOString().split('T')[0]}`
            },
            growth: {
                revenue: Math.round(revenueGrowth * 10) / 10,
                students: Math.round(studentGrowth * 10) / 10,
                courses: currentCourses.length - comparisonCourses.length
            },
            compareTo
        };
    }
}