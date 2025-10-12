import express from 'express';
import { AdminRefundController } from '../controllers/refund.controller';

const router = express.Router();

// All routes require admin authentication (registered in index with authenticate + requireAdmin middleware)

// Get all refund requests (admin view - read only)
router.get('/', AdminRefundController.getAllRefundRequests);

// Get refund statistics
router.get('/stats', AdminRefundController.getRefundStats);

// Get refund request details
router.get('/:id', AdminRefundController.getRefundDetails);

// Add admin note (no approval power, just monitoring)
router.post('/:id/note', AdminRefundController.addAdminNote);

export default router;

