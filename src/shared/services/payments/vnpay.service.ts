import crypto from 'crypto';

export type BuildUrlParams = {
  orderId: string;
  amount: number; // VND
  orderInfo: string;
  ipAddr: string;
  bankCode?: string;
  returnUrl?: string; // Optional, will use env var if not provided
  ipnUrl?: string; // Optional, will use env var if not provided
  email?: string; // Optional user email
  name?: string; // Optional user name
  expireMinutes?: number; // Optional, default 15
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const buildVnpayPaymentUrl = (params: BuildUrlParams): string => {
  const tmnCode = process.env.VNPAY_TMN_CODE || '';
  const hashSecret = process.env.VNPAY_HASH_SECRET || '';
  const paymentUrl = process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const defaultReturnUrl = process.env.VNPAY_RETURN_URL || '';
  const defaultIpnUrl = process.env.VNPAY_IPN_URL || '';
  const locale = process.env.VNPAY_LOCALE || 'vn';
  const currency = process.env.VNPAY_CURRENCY || 'VND';
  const expireMinutes = params.expireMinutes || Number(process.env.VNPAY_EXPIRE_MINUTES || 15);
  const orderType = process.env.VNPAY_ORDER_TYPE || 'other';

  // Format date theo chuẩn VNPay: yyyyMMddHHmmss (GMT+7)
  // VNPay yêu cầu timezone GMT+7, nếu server ở UTC thì cần convert
  const now = new Date();
  // Get Vietnam time (GMT+7) - offset 7 hours from UTC
  const vietnamOffset = 7 * 60; // minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const vietnamTime = new Date(utcTime + (vietnamOffset * 60 * 1000));
  
  const created = `${vietnamTime.getFullYear()}${pad(vietnamTime.getMonth() + 1)}${pad(vietnamTime.getDate())}${pad(vietnamTime.getHours())}${pad(
    vietnamTime.getMinutes()
  )}${pad(vietnamTime.getSeconds())}`;
  
  const expire = new Date(now.getTime() + expireMinutes * 60 * 1000);
  const expireUtcTime = expire.getTime() + (expire.getTimezoneOffset() * 60 * 1000);
  const expireVietnamTime = new Date(expireUtcTime + (vietnamOffset * 60 * 1000));
  const expStr = `${expireVietnamTime.getFullYear()}${pad(expireVietnamTime.getMonth() + 1)}${pad(expireVietnamTime.getDate())}${pad(
    expireVietnamTime.getHours()
  )}${pad(expireVietnamTime.getMinutes())}${pad(expireVietnamTime.getSeconds())}`;

  // Build VNPay parameters theo đúng chuẩn VNPay
  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(params.amount * 100), // Nhân 100 để khử phần thập phân
    vnp_CurrCode: currency,
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: orderType,
    vnp_Locale: locale,
    vnp_ReturnUrl: params.returnUrl || defaultReturnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: created,
    vnp_ExpireDate: expStr
  };

  // Optional parameters
  if (params.bankCode) vnpParams.vnp_BankCode = params.bankCode;
  
  // Note: vnp_IpnUrl is NOT sent in payment URL - IPN URL is configured separately in VNPay merchant portal
  // According to VNPay official documentation, IPN URL should be configured in merchant portal, not sent as parameter
  
  // Optional billing/invoice parameters (if needed)
  // Note: vnp_Email and vnp_Name are not in official VNPay parameter list, but some versions may support them
  // Commenting out to strictly follow official documentation
  // if (params.email && params.email.includes('@') && params.email.includes('.')) {
  //   vnpParams.vnp_Email = params.email;
  // }
  // if (params.name) {
  //   vnpParams.vnp_Name = params.name;
  // }

  // Sort parameters alphabetically for hash generation (theo chuẩn VNPay)
  const sortedKeys = Object.keys(vnpParams).sort();
  
  // Build query string
  const query = sortedKeys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(vnpParams[k])}`).join('&');
  
  // Build hash data (chỉ các params vnp_*, không bao gồm vnp_SecureHash)
  const hashData = sortedKeys
    .map((k, idx) => `${idx ? '&' : ''}${encodeURIComponent(k)}=${encodeURIComponent(vnpParams[k])}`)
    .join('');

  // Generate HMAC SHA512 hash
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



