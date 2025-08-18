import crypto from 'crypto';

export type BuildUrlParams = {
  orderId: string;
  amount: number; // VND
  orderInfo: string;
  ipAddr: string;
  bankCode?: string;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const buildVnpayPaymentUrl = (params: BuildUrlParams): string => {
  const tmnCode = process.env.VNPAY_TMN_CODE || '';
  const hashSecret = process.env.VNPAY_HASH_SECRET || '';
  const paymentUrl = process.env.VNPAY_PAYMENT_URL || '';
  const returnUrl = process.env.VNPAY_RETURN_URL || '';
  const locale = process.env.VNPAY_LOCALE || 'vn';
  const currency = process.env.VNPAY_CURRENCY || 'VND';
  const expireMinutes = Number(process.env.VNPAY_EXPIRE_MINUTES || 15);
  const orderType = process.env.VNPAY_ORDER_TYPE || 'other';

  const now = new Date();
  const created = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;
  const expire = new Date(now.getTime() + expireMinutes * 60 * 1000);
  const expStr = `${expire.getFullYear()}${pad(expire.getMonth() + 1)}${pad(expire.getDate())}${pad(
    expire.getHours()
  )}${pad(expire.getMinutes())}${pad(expire.getSeconds())}`;

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(params.amount * 100),
    vnp_CurrCode: currency,
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: orderType,
    vnp_Locale: locale,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: created,
    vnp_ExpireDate: expStr
  };
  if (params.bankCode) vnpParams.vnp_BankCode = params.bankCode;

  const sortedKeys = Object.keys(vnpParams).sort();
  const query = sortedKeys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(vnpParams[k])}`).join('&');
  const hashData = sortedKeys
    .map((k, idx) => `${idx ? '&' : ''}${encodeURIComponent(k)}=${encodeURIComponent(vnpParams[k])}`)
    .join('');

  const secureHash = crypto.createHmac('sha512', hashSecret).update(hashData).digest('hex');
  return `${paymentUrl}?${query}&vnp_SecureHash=${secureHash}`;
};

export const verifyVnpSignature = (input: Record<string, string>) => {
  const hashSecret = process.env.VNPAY_HASH_SECRET || '';
  const cloned = { ...input };
  const secureHash = cloned['vnp_SecureHash'] || cloned['vnp_SecureHashType'] || '';
  delete cloned['vnp_SecureHash'];
  delete cloned['vnp_SecureHashType'];
  const keys = Object.keys(cloned)
    .filter((k) => k.startsWith('vnp_'))
    .sort();
  const hashData = keys
    .map((k, idx) => `${idx ? '&' : ''}${encodeURIComponent(k)}=${encodeURIComponent(cloned[k])}`)
    .join('');
  const calc = crypto.createHmac('sha512', hashSecret).update(hashData).digest('hex');
  return { valid: calc === secureHash, calc, provided: secureHash };
};

// --- QueryDR fallback (best effort sandbox) ---
import https from 'https';

const formEncode = (data: Record<string, string>) =>
  Object.keys(data)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`)
    .join('&');

export const queryVnpayTransaction = (params: {
  txnRef: string;
  orderInfo?: string;
  transactionDate?: string; // yyyyMMddHHmmss (optional)
  ipAddr?: string;
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const url = process.env.VNPAY_QUERYDR_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
      const tmnCode = process.env.VNPAY_TMN_CODE || '';
      const hashSecret = process.env.VNPAY_HASH_SECRET || '';
      const now = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const createDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(
        now.getMinutes()
      )}${pad(now.getSeconds())}`;

      const payload: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'querydr',
        vnp_TmnCode: tmnCode,
        vnp_TxnRef: params.txnRef,
        vnp_OrderInfo: params.orderInfo || 'QueryDR',
        vnp_CreateDate: createDate,
        vnp_IpAddr: params.ipAddr || '127.0.0.1'
      };
      if (params.transactionDate) payload.vnp_TransactionDate = params.transactionDate;

      // Sign by sorted params with HMACSHA512 (best effort per VNPay docs)
      const keys = Object.keys(payload).sort();
      const hashData = keys
        .map((k, idx) => `${idx ? '&' : ''}${encodeURIComponent(k)}=${encodeURIComponent(payload[k])}`)
        .join('');
      const secureHash = crypto.createHmac('sha512', hashSecret).update(hashData).digest('hex');
      payload.vnp_SecureHash = secureHash;

      const body = formEncode(payload);
      const { hostname, pathname } = new URL(url);
      const options: https.RequestOptions = {
        hostname,
        path: pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch {
            resolve({ raw: data });
          }
        });
      });
      req.on('error', (e) => reject(e));
      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
};



