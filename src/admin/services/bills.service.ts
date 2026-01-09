import Bill from '../../shared/models/core/Bill';
import User from '../../shared/models/core/User';
import Course from '../../shared/models/core/Course';

export interface BillFilters {
    search?: string;
    status?: string;
    paymentMethod?: string;
    dateRange?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface BillResult {
    bills: any[];
    total: number;
}

export class BillsService {
    /**
     * Get bills with filtering and pagination
     */
    static async getBills(filters: BillFilters): Promise<BillResult> {
        try {
            const query: any = {};

            // Apply filters
            if (filters.status && filters.status !== 'all') {
                // Map frontend status to backend status
                const statusMap: { [key: string]: string } = {
                    'pending': 'pending',
                    'paid': 'completed',
                    'failed': 'failed',
                    'refunded': 'refunded',
                    'cancelled': 'cancelled'
                };
                query.status = statusMap[filters.status] || filters.status;
            }

            if (filters.paymentMethod && filters.paymentMethod !== 'all') {
                // Frontend already sends correct payment method values
                query.paymentMethod = filters.paymentMethod;
            }

            // Date range filter
            if (filters.dateRange && filters.dateRange !== 'all') {
                const now = new Date();
                let startDate: Date;

                switch (filters.dateRange) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        startDate = new Date(0);
                }
                query.createdAt = { $gte: startDate };
            }

            // Sort options
            const sortOptions: any = {};
            if (filters.sortBy) {
                sortOptions[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
            } else {
                sortOptions.createdAt = -1;
            }

            // Pagination
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const skip = (page - 1) * limit;

            // Execute query
            const bills = await Bill.find(query)
                .populate('studentId', 'name email')
                .populate('courseId', 'title')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Bill.countDocuments(query);

            // Apply search filter after population (for student name, course title)
            let filteredBills = bills;
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredBills = bills.filter((bill: any) => {
                    const studentName = (bill.studentId as any)?.name?.toLowerCase() || '';
                    const courseTitle = (bill.courseId as any)?.title?.toLowerCase() || '';
                    const description = bill.description?.toLowerCase() || '';

                    return studentName.includes(searchTerm) ||
                        courseTitle.includes(searchTerm) ||
                        description.includes(searchTerm);
                });
            }

            return {
                bills: filteredBills,
                total: filters.search ? filteredBills.length : total
            };
        } catch (error) {

            throw error;
        }
    }

    /**
     * Get bill by ID
     */
    static async getBillById(id: string) {
        try {
            return await Bill.findById(id)
                .populate('studentId', 'name email')
                .populate('courseId', 'title')
                .lean();
        } catch (error) {

            throw error;
        }
    }

    /**
     * Create new bill
     */
    static async createBill(billData: any) {
        try {
            const bill = new Bill(billData);
            await bill.save();

            return await Bill.findById(bill._id)
                .populate('studentId', 'name email')
                .populate('courseId', 'title')
                .lean();
        } catch (error) {

            throw error;
        }
    }

    /**
     * Update bill
     */
    static async updateBill(id: string, updateData: any) {
        try {
            const bill = await Bill.findByIdAndUpdate(id, updateData, { new: true })
                .populate('studentId', 'name email')
                .populate('courseId', 'title')
                .lean();

            return bill;
        } catch (error) {

            throw error;
        }
    }

    /**
     * Delete bill
     */
    static async deleteBill(id: string) {
        try {
            const bill = await Bill.findByIdAndDelete(id);
            return !!bill;
        } catch (error) {

            throw error;
        }
    }

    /**
     * Export bills to CSV
     */
    static async exportBillsToCSV(filters: BillFilters): Promise<string> {
        try {
            const result = await this.getBills({ ...filters, limit: 10000 }); // Get all bills for export

            const headers = [
                'Transaction ID',
                'Student Name',
                'Student Email',
                'Course Title',
                'Amount',
                'Currency',
                'Purpose',
                'Status',
                'Payment Method',
                'Payment Gateway',
                'Description',
                'Paid At',
                'Created At'
            ];

            const rows = result.bills.map(bill => [
                bill.transactionId || '',
                (bill.studentId as any)?.name || '',
                (bill.studentId as any)?.email || '',
                (bill.courseId as any)?.title || '',
                bill.amount,
                bill.currency,
                bill.purpose,
                bill.status,
                bill.paymentMethod,
                bill.paymentGateway || '',
                bill.description,
                bill.paidAt || '',
                bill.createdAt
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            return csvContent;
        } catch (error) {

            throw error;
        }
    }

    /**
     * Export bills to Excel
     */
    static async exportBillsToExcel(filters: BillFilters): Promise<Buffer> {
        try {
            // For now, return CSV data as Buffer
            // In production, you would use a library like 'exceljs' to create proper Excel files
            const csvData = await this.exportBillsToCSV(filters);
            return Buffer.from(csvData, 'utf-8');
        } catch (error) {

            throw error;
        }
    }
}
