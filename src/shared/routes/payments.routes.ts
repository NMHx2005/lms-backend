import { Router } from 'express';
import { validateRequest } from '../middleware/validation';
import { paymentsValidation } from '../validators/payments.validator';
import { createVnpayPayment, vnpayReturn, vnpayIpn, getPaymentHistory, getInvoiceById, fallbackQueryDr } from '../controllers/payments.controller';
import { authenticate } from '../../admin/middleware/auth';

const router = Router();

// VNPay create payment
router.post('/vnpay/create', validateRequest(paymentsValidation.createVnpay), createVnpayPayment);

// VNPay return (browser redirect)
router.get('/vnpay/return', vnpayReturn);

// VNPay IPN (server-to-server)
router.get('/vnpay/ipn', vnpayIpn);
router.post('/vnpay/ipn', vnpayIpn);

// History & invoice (protected)
router.get('/history', authenticate, getPaymentHistory);
router.get('/invoices/:id', authenticate, getInvoiceById);

// Optional: QueryDR fallback (for sandbox when IPN not set)
router.get('/vnpay/querydr', authenticate, fallbackQueryDr);

export default router;


