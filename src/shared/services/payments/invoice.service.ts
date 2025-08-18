import { IInvoice } from '../../models/payment/Invoice';

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rnd}`;
};

export const renderInvoiceHtml = (data: {
  number: string;
  amount: number;
  currency: string;
  userId?: string;
  orderId?: string;
  paymentId?: string;
  issuedAt: Date;
}): string => {
  return `<!doctype html>
  <html><head><meta charset="utf-8"><title>Invoice ${data.number}</title></head>
  <body>
    <h1>Invoice ${data.number}</h1>
    <p>Order: ${data.orderId || ''}</p>
    <p>Payment: ${data.paymentId || ''}</p>
    <p>User: ${data.userId || ''}</p>
    <p>Amount: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: data.currency }).format(
      data.amount
    )}</p>
    <p>Issued at: ${data.issuedAt.toISOString()}</p>
  </body></html>`;
};


