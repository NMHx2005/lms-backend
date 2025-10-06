import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getSupportTickets,
  getSupportTicketById,
  assignTicket,
  updateTicketStatus,
  addTicketNote,
  getSupportStaff,
  getSupportStats,
  getFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  toggleFAQStatus
} from '../controllers/supportController';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// ========== SUPPORT TICKET ROUTES ==========
router.get('/tickets', getSupportTickets);
router.get('/tickets/:id', getSupportTicketById);
router.put('/tickets/:id/assign', assignTicket);
router.put('/tickets/:id/status', updateTicketStatus);
router.post('/tickets/:id/notes', addTicketNote);

// ========== SUPPORT STAFF ROUTES ==========
router.get('/staff', getSupportStaff);

// ========== SUPPORT STATISTICS ROUTES ==========
router.get('/stats', getSupportStats);

// ========== FAQ ROUTES ==========
router.get('/faqs', getFAQs);
router.get('/faqs/:id', getFAQById);
router.post('/faqs', createFAQ);
router.put('/faqs/:id', updateFAQ);
router.delete('/faqs/:id', deleteFAQ);
router.patch('/faqs/:id/toggle-status', toggleFAQStatus);

export default router;