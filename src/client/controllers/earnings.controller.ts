import { Request, Response } from 'express';
import { EarningsService } from '../services/earnings.service';

export class EarningsController {
    /**
     * Get earnings overview
     */
    static async getOverview(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const overview = await EarningsService.getOverview(teacherId);

            res.json({
                success: true,
                data: overview
            });
        } catch (error) {
            console.error('Error getting earnings overview:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get current balance
     */
    static async getBalance(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const balance = await EarningsService.getBalance(teacherId);

            res.json({
                success: true,
                data: balance
            });
        } catch (error) {
            console.error('Error getting balance:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get earnings history
     */
    static async getHistory(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { page = 1, limit = 20, startDate, endDate, courseId } = req.query;

            const result = await EarningsService.getHistory(teacherId, {
                page: Number(page),
                limit: Number(limit),
                startDate: startDate as string,
                endDate: endDate as string,
                courseId: courseId as string
            });

            res.json({
                success: true,
                data: result.history,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error getting earnings history:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get pending earnings
     */
    static async getPendingEarnings(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const pending = await EarningsService.getPendingEarnings(teacherId);

            res.json({
                success: true,
                data: pending
            });
        } catch (error) {
            console.error('Error getting pending earnings:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Request withdrawal
     */
    static async requestWithdrawal(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { amount, method, accountDetails, notes } = req.body;

            const withdrawal = await EarningsService.requestWithdrawal(teacherId, {
                amount,
                method,
                accountDetails,
                notes
            });

            res.status(201).json({
                success: true,
                message: 'Withdrawal request submitted successfully',
                data: withdrawal
            });
        } catch (error: any) {
            console.error('Error requesting withdrawal:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }

    /**
     * Get withdrawals
     */
    static async getWithdrawals(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { page = 1, limit = 20, status } = req.query;

            const result = await EarningsService.getWithdrawals(teacherId, {
                page: Number(page),
                limit: Number(limit),
                status: status as string
            });

            res.json({
                success: true,
                data: result.withdrawals,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error getting withdrawals:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get withdrawal by ID
     */
    static async getWithdrawalById(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { id } = req.params;

            const withdrawal = await EarningsService.getWithdrawalById(id, teacherId);

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    error: 'Withdrawal not found'
                });
            }

            res.json({
                success: true,
                data: withdrawal
            });
        } catch (error) {
            console.error('Error getting withdrawal:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get earnings stats
     */
    static async getStats(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { period = 'monthly' } = req.query;

            const stats = await EarningsService.getStats(teacherId, period as string);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get transactions
     */
    static async getTransactions(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { page = 1, limit = 20, type, startDate, endDate, courseId, status } = req.query;

            const result = await EarningsService.getTransactions(teacherId, {
                page: Number(page),
                limit: Number(limit),
                type: type as string,
                startDate: startDate as string,
                endDate: endDate as string,
                courseId: courseId as string,
                status: status as string
            });

            res.json({
                success: true,
                data: result.transactions,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error getting transactions:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get transaction by ID
     */
    static async getTransactionById(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { id } = req.params;

            const transaction = await EarningsService.getTransactionById(id, teacherId);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found'
                });
            }

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            console.error('Error getting transaction:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get transaction stats
     */
    static async getTransactionStats(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const stats = await EarningsService.getTransactionStats(teacherId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Export transactions
     */
    static async exportTransactions(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { startDate, endDate, format = 'csv' } = req.query;

            const file = await EarningsService.exportTransactions(teacherId, {
                startDate: startDate as string,
                endDate: endDate as string,
                format: format as string
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
            res.send(file);
        } catch (error) {
            console.error('Error exporting transactions:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get analytics overview
     */
    static async getAnalyticsOverview(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const overview = await EarningsService.getAnalyticsOverview(teacherId);

            res.json({
                success: true,
                data: overview
            });
        } catch (error) {
            console.error('Error getting analytics overview:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get earnings trends
     */
    static async getTrends(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { period = '30days' } = req.query;

            const trends = await EarningsService.getTrends(teacherId, period as string);

            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            console.error('Error getting trends:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get earnings by course
     */
    static async getEarningsByCourse(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const byCourse = await EarningsService.getEarningsByCourse(teacherId);

            res.json({
                success: true,
                data: byCourse
            });
        } catch (error) {
            console.error('Error getting earnings by course:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get earnings by period
     */
    static async getEarningsByPeriod(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { groupBy = 'month', startDate, endDate } = req.query;

            const byPeriod = await EarningsService.getEarningsByPeriod(teacherId, {
                groupBy: groupBy as string,
                startDate: startDate as string,
                endDate: endDate as string
            });

            res.json({
                success: true,
                data: byPeriod
            });
        } catch (error) {
            console.error('Error getting earnings by period:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get earnings forecast
     */
    static async getForecast(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { months = 3 } = req.query;

            const forecast = await EarningsService.getForecast(teacherId, Number(months));

            res.json({
                success: true,
                data: forecast
            });
        } catch (error) {
            console.error('Error getting forecast:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get earnings comparison
     */
    static async getComparison(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const { compareTo = 'previous_period' } = req.query;

            const comparison = await EarningsService.getComparison(teacherId, compareTo as string);

            res.json({
                success: true,
                data: comparison
            });
        } catch (error) {
            console.error('Error getting comparison:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get monthly breakdown for chart
     */
    static async getMonthlyBreakdown(req: Request, res: Response) {
        try {
            const teacherId = (req.user as any)?.id;
            const months = parseInt(req.query.months as string) || 6;
            const breakdown = await EarningsService.getMonthlyBreakdown(teacherId, months);

            res.json({
                success: true,
                data: breakdown
            });
        } catch (error) {
            console.error('Error getting monthly breakdown:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

export default EarningsController;

