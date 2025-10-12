import express from 'express';
import { ClientRefundController } from '../controllers/refund.controller';

const router = express.Router();

// All routes require authentication (registered in index with authenticate middleware)

// Get eligible courses for refund
router.get('/eligible-courses', ClientRefundController.getEligibleCourses);

// Get user's refund requests (student)
router.get('/', ClientRefundController.getRefundRequests);

// Get refund request details
router.get('/:id', ClientRefundController.getRefundDetails);

// Create refund request (student)
router.post('/', ClientRefundController.createRefundRequest);

// Cancel refund request (student)
router.delete('/:id', ClientRefundController.cancelRefundRequest);

// ========== TEACHER ENDPOINTS ==========

// Get teacher's refund requests
router.get('/teacher/requests', ClientRefundController.getTeacherRefundRequests);

// Approve refund (teacher)
router.post('/:id/approve', ClientRefundController.approveRefund);

// Reject refund (teacher)
router.post('/:id/reject', ClientRefundController.rejectRefund);

export default router;

