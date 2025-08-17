import express from 'express';
import { SupportController } from '../controllers/support.controller';
import { adminSupportValidation } from '../validators/support.validator';
import { validateRequest } from '../../shared/middleware/validation';

const router = express.Router();

// Get all support tickets
router.get('/tickets', validateRequest(adminSupportValidation.ticketQuery), SupportController.getTickets);

// Get ticket by ID
router.get('/tickets/:id', validateRequest(adminSupportValidation.ticketId), SupportController.getTicketById);

// Assign ticket to support staff
router.put('/tickets/:id/assign', 
  validateRequest([...adminSupportValidation.ticketId, ...adminSupportValidation.assignTicket]), 
  SupportController.assignTicket
);

// Update ticket status
router.put('/tickets/:id/status', 
  validateRequest([...adminSupportValidation.ticketId, ...adminSupportValidation.updateTicket]), 
  SupportController.updateTicketStatus
);

// Add internal note to ticket
router.post('/tickets/:id/notes', 
  validateRequest([...adminSupportValidation.ticketId, ...adminSupportValidation.addResponse]), 
  SupportController.addInternalNote
);

// Get support staff
router.get('/staff', SupportController.getSupportStaff);

// Get ticket statistics
router.get('/stats', SupportController.getTicketStatistics);

// Search tickets
router.get('/search', validateRequest(adminSupportValidation.ticketQuery), SupportController.searchTickets);

export default router;
