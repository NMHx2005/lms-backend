import { Request, Response } from 'express';
import { BillsService } from '../services/bills.service';

export class BillsController {
    /**
     * Get bills with filtering and pagination
     */
    static async getBills(req: Request, res: Response) {
        try {
            const filters = {
                search: req.query.search as string,
                status: req.query.status as string,
                paymentMethod: req.query.paymentMethod as string,
                dateRange: req.query.dateRange as string,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const result = await BillsService.getBills(filters);

            res.json({
                success: true,
                data: {
                    data: result.bills,
                    pagination: {
                        total: result.total,
                        pages: Math.ceil(result.total / filters.limit),
                        page: filters.page,
                        limit: filters.limit
                    }
                }
            });
        } catch (error) {
            console.error('Get bills error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get bill by ID
     */
    static async getBillById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const bill = await BillsService.getBillById(id);

            if (!bill) {
                return res.status(404).json({
                    success: false,
                    error: 'Bill not found'
                });
            }

            res.json({
                success: true,
                data: bill
            });
        } catch (error) {
            console.error('Get bill by ID error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Create new bill
     */
    static async createBill(req: Request, res: Response) {
        try {
            const billData = req.body;
            const bill = await BillsService.createBill(billData);

            res.status(201).json({
                success: true,
                data: bill,
                message: 'Bill created successfully'
            });
        } catch (error) {
            console.error('Create bill error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Update bill
     */
    static async updateBill(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const bill = await BillsService.updateBill(id, updateData);

            if (!bill) {
                return res.status(404).json({
                    success: false,
                    error: 'Bill not found'
                });
            }

            res.json({
                success: true,
                data: bill,
                message: 'Bill updated successfully'
            });
        } catch (error) {
            console.error('Update bill error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Delete bill
     */
    static async deleteBill(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await BillsService.deleteBill(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Bill not found'
                });
            }

            res.json({
                success: true,
                message: 'Bill deleted successfully'
            });
        } catch (error) {
            console.error('Delete bill error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Export bills to CSV
     */
    static async exportBillsToCSV(req: Request, res: Response) {
        try {
            const filters = {
                search: req.query.search as string,
                status: req.query.status as string,
                paymentMethod: req.query.paymentMethod as string,
                dateRange: req.query.dateRange as string,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
            };

            const csvData = await BillsService.exportBillsToCSV(filters);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=bills_export_${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csvData);
        } catch (error) {
            console.error('Export bills CSV error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Export bills to Excel
     */
    static async exportBillsToExcel(req: Request, res: Response) {
        try {
            const filters = {
                search: req.query.search as string,
                status: req.query.status as string,
                paymentMethod: req.query.paymentMethod as string,
                dateRange: req.query.dateRange as string,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
            };

            const excelData = await BillsService.exportBillsToExcel(filters);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=bills_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            res.send(excelData);
        } catch (error) {
            console.error('Export bills Excel error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
