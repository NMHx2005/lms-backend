import { Request, Response } from 'express';
import { buildVnpayPaymentUrl, verifyVnpSignature } from '../services/payments/vnpay.service';
import Payment from '../models/payment/Payment';
import Order from '../models/payment/Order';
import Invoice from '../models/payment/Invoice';
import { generateInvoiceNumber, renderInvoiceHtml } from '../services/payments/invoice.service';
import { queryVnpayTransaction } from '../services/payments/vnpay.service';

export const createVnpayPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, amount, orderInfo, ipAddr, bankCode } = req.body || {};
    if (!orderId || !amount || !orderInfo) {
      return res.status(400).json({ success: false, message: 'orderId, amount, orderInfo are required' });
    }

    // Ensure order exists or create a lightweight record (optional)
    const userId = (req as any).user?.id || undefined;
    let order = await Order.findById(orderId);
    if (!order) order = await Order.create({ userId, items: [], amount, currency: 'VND', status: 'PENDING', txnRef: orderId });

    const clientIp = ipAddr || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const paymentUrl = buildVnpayPaymentUrl({
      orderId,
      amount: Number(amount),
      orderInfo: String(orderInfo),
      ipAddr: String(clientIp),
      bankCode
    });

    // Create Payment record PENDING
    await Payment.create({
      orderId: order._id,
      userId,
      gateway: 'vnpay',
      amount: Number(amount),
      currency: 'VND',
      txnRef: orderId,
      status: 'PENDING'
    });

    return res.json({ success: true, paymentUrl });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Internal error' });
  }
};

export const vnpayReturn = async (req: Request, res: Response) => {
  const input: Record<string, string> = {};
  Object.entries(req.query).forEach(([k, v]) => {
    if (k.startsWith('vnp_')) input[k] = String(v);
  });
  const { valid } = verifyVnpSignature(input);
  const responseCode = input['vnp_ResponseCode'] || input['vnp_TransactionStatus'] || '99';
  return res.status(200).json({ success: valid, responseCode, data: input });
};

export const vnpayIpn = async (req: Request, res: Response) => {
  const allParams = Object.keys(req.body || {}).length ? req.body : req.query;
  const input: Record<string, string> = {};
  Object.entries(allParams as any).forEach(([k, v]) => {
    if (k.startsWith('vnp_')) input[k] = String(v);
  });
  try {
    const { valid } = verifyVnpSignature(input);
    if (!valid) return res.json({ RspCode: '97', Message: 'Invalid signature' });

    const txnRef = input['vnp_TxnRef'];
    const amount = Number(input['vnp_Amount'] || 0) / 100;
    const resp = input['vnp_ResponseCode'];
    const tranStatus = input['vnp_TransactionStatus'];
    const transactionNo = input['vnp_TransactionNo'];
    const bankCode = input['vnp_BankCode'];

    // Find payment by txnRef
    const payment = await Payment.findOne({ txnRef: txnRef });
    if (!payment) return res.json({ RspCode: '01', Message: 'Payment not found' });

    // Idempotency: if already finalized
    if (payment.status === 'PAID' || payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    // Validate amount matches
    if (payment.amount !== amount) {
      return res.json({ RspCode: '04', Message: 'invalid amount' });
    }

    const isSuccess = resp === '00' || tranStatus === '00';
    payment.transactionNo = transactionNo;
    payment.bankCode = bankCode;
    payment.responseCode = resp;
    payment.transactionStatus = tranStatus;
    payment.rawIpn = input;
    payment.status = isSuccess ? 'PAID' : 'FAILED';
    if (isSuccess) payment.paidAt = new Date();
    await payment.save();

    // Update order status accordingly
    await Order.findByIdAndUpdate(payment.orderId, { status: isSuccess ? 'PAID' : 'FAILED' });

    // Create invoice on success (sandbox HTML)
    if (isSuccess) {
      const invoiceNumber = generateInvoiceNumber();
      const html = renderInvoiceHtml({
        number: invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        userId: String(payment.userId || ''),
        orderId: String(payment.orderId || ''),
        paymentId: String(payment._id),
        issuedAt: new Date()
      });
      await Invoice.create({
        orderId: payment.orderId,
        paymentId: payment._id,
        userId: payment.userId,
        number: invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        html,
        issuedAt: new Date()
      });
    }

    return res.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (e) {
    return res.json({ RspCode: '99', Message: 'Unknown error' });
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { status, from, to } = req.query as any;
  const query: any = {};
  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }
  const data = await Payment.find(query).sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, data });
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const inv = await Invoice.findById(id);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  return res.json({ success: true, data: inv });
};

// Fallback: query VNPay transaction if IPN chưa về
export const fallbackQueryDr = async (req: Request, res: Response) => {
  try {
    const { txnRef } = req.query as any;
    if (!txnRef) return res.status(400).json({ success: false, message: 'txnRef is required' });
    const result = await queryVnpayTransaction({ txnRef: String(txnRef) });
    return res.json({ success: true, data: result });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'QueryDR failed' });
  }
};


