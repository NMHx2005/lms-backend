import express from 'express';
import { BillsController } from '../controllers/bills.controller';
import { validateRequest } from '../../shared/middleware/validation';
import { billsValidation } from '../validators/bills.validator';

const router = express.Router();

// Bills management routes
router.get('/', validateRequest(billsValidation.queryParams), BillsController.getBills);
router.get('/export/csv', validateRequest(billsValidation.queryParams), BillsController.exportBillsToCSV);
router.get('/export/excel', validateRequest(billsValidation.queryParams), BillsController.exportBillsToExcel);
router.get('/:id', validateRequest(billsValidation.getBill), BillsController.getBillById);
router.post('/', validateRequest(billsValidation.createBill), BillsController.createBill);
router.put('/:id', validateRequest(billsValidation.updateBill), BillsController.updateBill);
router.delete('/:id', validateRequest(billsValidation.deleteBill), BillsController.deleteBill);

export default router;
