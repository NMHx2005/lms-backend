import express from 'express';
import { Bill, Course, User } from '../../shared/models';

const router = express.Router();

// Get user payment history
router.get('/history', async (req: any, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter: any = { studentId: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const bills = await Bill.find(filter)
      .populate('courseId', 'title thumbnail')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Bill.countDocuments(filter);

    res.json({
      success: true,
      data: bills,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get bill by ID
router.get('/bills/:id', async (req: any, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      studentId: req.user.id
    }).populate('courseId', 'title thumbnail');

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create payment for course
router.post('/course/:courseId', async (req: any, res) => {
  try {
    const { courseId } = req.params;
    const { paymentMethod, amount } = req.body;

    // Check if course exists
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
      isApproved: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if already enrolled
    // This would typically check enrollment collection

    // Create bill
    const bill = new Bill({
      studentId: req.user.id,
      courseId: courseId,
      amount: amount || course.price,
      currency: 'VND',
      purpose: 'course_purchase',
      status: 'pending',
      paymentMethod: paymentMethod || 'stripe',
      description: `Payment for course: ${course.title}`
    });

    await bill.save();

    // This would typically integrate with payment gateway
    // For now, just return success

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        billId: bill._id,
        amount: bill.amount,
        status: bill.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create VNPay payment for course (with real VNPay)
router.post('/vnpay-real/:courseId', async (req: any, res) => {
  try {
    const { courseId } = req.params;
    const { amount, courseTitle, userInfo } = req.body;

    // Set default URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = req.body.returnUrl || `${frontendUrl}/payment/result`;
    const cancelUrl = req.body.cancelUrl || `${frontendUrl}/courses/${courseId}`;

    // Check if course exists
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
      isApproved: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Get user information for VNPay
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already enrolled
    const { Enrollment } = require('../../shared/models');
    const existingEnrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId: courseId
    });

    if (existingEnrollment) {
      return res.json({
        success: true,
        message: 'Bạn đã đăng ký khóa học này rồi!',
        data: {
          alreadyEnrolled: true,
          enrollmentId: existingEnrollment._id,
          enrolledAt: existingEnrollment.enrolledAt
        }
      });
    }

    // Generate unique order ID for VNPay
    const vnpayOrderId = `VNPAY_${Date.now()}_${req.user.id}_${courseId}`;

    // Create bill with VNPay metadata and user information
    const bill = new Bill({
      studentId: req.user.id,
      courseId: courseId,
      amount: amount || course.price,
      currency: 'VND',
      purpose: 'course_purchase',
      status: 'pending',
      paymentMethod: 'vnpay',
      description: `Payment for course: ${courseTitle || course.title}`,
      metadata: {
        vnpayOrderId,
        returnUrl,
        cancelUrl,
        userInfo: userInfo || {
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          phone: user.phone || '',
          address: user.address || ''
        }
      }
    });

    await bill.save();

    // Generate REAL VNPay URL
    const paymentUrl = generateVNPayPaymentUrl({
      orderId: vnpayOrderId,
      amount: bill.amount,
      courseTitle: courseTitle || course.title,
      returnUrl,
      cancelUrl,
      userEmail: user.email,
      userName: (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Customer'
    });

    res.json({
      success: true,
      message: 'VNPay payment initiated successfully',
      data: {
        paymentUrl,
        billId: bill._id,
        orderId: vnpayOrderId,
        amount: bill.amount
      }
    });
  } catch (error) {
    console.error('VNPay payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create VNPay payment for course
router.post('/vnpay/:courseId', async (req: any, res) => {
  try {
    const { courseId } = req.params;
    const { amount, courseTitle, userInfo } = req.body;

    // Set default URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = req.body.returnUrl || `${frontendUrl}/payment/result`;
    const cancelUrl = req.body.cancelUrl || `${frontendUrl}/courses/${courseId}`;

    // Check if course exists
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
      isApproved: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Get user information for VNPay
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already enrolled
    const { Enrollment } = require('../../shared/models');
    const existingEnrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId: courseId
    });

    if (existingEnrollment) {
      // Return success instead of error when already enrolled
      return res.json({
        success: true,
        message: 'Bạn đã đăng ký khóa học này rồi!',
        data: {
          alreadyEnrolled: true,
          enrollmentId: existingEnrollment._id,
          enrolledAt: existingEnrollment.enrolledAt
        }
      });
    }

    // Generate unique order ID for VNPay
    const vnpayOrderId = `VNPAY_${Date.now()}_${req.user.id}_${courseId}`;

    // Create bill with VNPay metadata and user information
    const bill = new Bill({
      studentId: req.user.id,
      courseId: courseId,
      amount: amount || course.price,
      currency: 'VND',
      purpose: 'course_purchase',
      status: 'pending',
      paymentMethod: 'vnpay',
      description: `Payment for course: ${courseTitle || course.title}`,
      metadata: {
        vnpayOrderId,
        returnUrl,
        cancelUrl,
        userInfo: userInfo || {
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          phone: user.phone || '',
          address: user.address || ''
        }
      }
    });

    await bill.save();

    // Use mock payment for development/testing (like teacher package flow)
    const useMockPayment = process.env.NODE_ENV === 'development' || process.env.VNPAY_USE_MOCK === 'true' || true;

    if (useMockPayment) {
      // Mock payment - process immediately and create enrollment
      try {
        // Update bill to completed
        bill.status = 'completed';
        bill.paidAt = new Date();
        bill.transactionId = `MOCK_${Date.now()}`;
        bill.metadata = {
          ...bill.metadata,
          vnpBankCode: 'NCB',
          vnpTransactionNo: bill.transactionId,
          vnpResponseCode: '00',
          mockPayment: true
        };
        await bill.save();

        // Create enrollment immediately
        const { Enrollment } = require('../../shared/models');
        const enrollment = new Enrollment({
          studentId: req.user.id,
          courseId: courseId,
          instructorId: course.instructorId,
          enrolledAt: new Date(),
          progress: 0,
          isActive: true,
          paymentStatus: 'completed',
          paymentMethod: 'vnpay',
          paymentDetails: {
            billId: bill._id,
            transactionId: bill.transactionId,
            amount: bill.amount,
            currency: 'VND',
            paymentGateway: 'vnpay'
          }
        });
        await enrollment.save();

        // Update course stats
        await Course.findByIdAndUpdate(courseId, {
          $inc: { totalStudents: 1 }
        });

        // Update user stats
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { 'stats.totalCoursesEnrolled': 1 }
        });

        console.log(`Mock payment processed - Enrollment created: ${enrollment._id}`);

        // Return mock payment URL for redirect
        const mockUrl = new URL('/payment/result', process.env.FRONTEND_URL || 'http://localhost:3000');
        mockUrl.searchParams.set('vnp_TxnRef', vnpayOrderId);
        mockUrl.searchParams.set('vnp_ResponseCode', '00');
        mockUrl.searchParams.set('vnp_Amount', (bill.amount * 100).toString());
        mockUrl.searchParams.set('vnp_TransactionNo', bill.transactionId);
        mockUrl.searchParams.set('vnp_BankCode', 'NCB');

        return res.json({
          success: true,
          message: 'Mock payment successful - Enrollment created',
          data: {
            paymentUrl: mockUrl.toString(),
            billId: bill._id,
            orderId: vnpayOrderId,
            amount: bill.amount,
            enrollmentId: enrollment._id,
            mockPayment: true
          }
        });
      } catch (error) {
        console.error('Mock payment error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to process mock payment'
        });
      }
    }

    // Real VNPay payment (if mock is disabled)
    const paymentUrl = generateVNPayPaymentUrl({
      orderId: vnpayOrderId,
      amount: bill.amount,
      courseTitle: courseTitle || course.title,
      returnUrl,
      cancelUrl,
      userEmail: user.email,
      userName: (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Customer'
    });

    res.json({
      success: true,
      message: 'VNPay payment initiated successfully',
      data: {
        paymentUrl,
        billId: bill._id,
        orderId: vnpayOrderId,
        amount: bill.amount
      }
    });
  } catch (error) {
    console.error('VNPay payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to process mock IPN
async function processMockIPN(orderId: string, amount: number, responseCode: string) {
  try {
    console.log(`Processing mock IPN - Order: ${orderId}, Amount: ${amount}, Response: ${responseCode}`);

    // Find bill by orderId
    const bill = await Bill.findOne({
      'metadata.vnpayOrderId': orderId
    });

    if (!bill) {
      console.error(`Mock IPN - Bill not found for order: ${orderId}`);
      return;
    }

    // Update bill status
    const isSuccess = responseCode === '00';
    const status = isSuccess ? 'completed' : 'failed';

    bill.status = status;
    bill.transactionId = `MOCK_${Date.now()}`;
    if (isSuccess) {
      bill.paidAt = new Date();
      bill.metadata = {
        ...bill.metadata,
        vnpBankCode: 'NCB',
        vnpTransactionNo: bill.transactionId,
        vnpResponseCode: responseCode
      };
    }

    await bill.save();
    console.log(`Mock IPN - Bill ${bill._id} updated to status: ${status}`);

    // If payment successful, create enrollment
    if (isSuccess && bill.courseId) {
      try {
        // Import Enrollment model
        const { Enrollment } = require('../../shared/models');

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          studentId: bill.studentId,
          courseId: bill.courseId
        });

        if (!existingEnrollment) {
          // Get course to get instructorId
          const course = await Course.findById(bill.courseId);

          // Create enrollment
          const enrollment = new Enrollment({
            studentId: bill.studentId,
            courseId: bill.courseId,
            instructorId: course?.instructorId,
            enrolledAt: new Date(),
            progress: 0,
            isActive: true,
            paymentStatus: 'completed',
            paymentMethod: 'vnpay',
            paymentDetails: {
              billId: bill._id,
              transactionId: bill.transactionId,
              amount: amount,
              currency: 'VND',
              paymentGateway: 'vnpay'
            }
          });

          await enrollment.save();
          console.log(`Mock IPN - Enrollment created: ${enrollment._id}`);

          // Update course stats
          await Course.findByIdAndUpdate(bill.courseId, {
            $inc: { totalStudents: 1 }
          });

          // Update user stats
          await User.findByIdAndUpdate(bill.studentId, {
            $inc: { 'stats.totalCoursesEnrolled': 1 }
          });
        } else {
          console.log(`Mock IPN - User already enrolled in course: ${bill.courseId}`);
        }
      } catch (enrollmentError) {
        console.error('Mock IPN - Error creating enrollment:', enrollmentError);
      }
    }

    console.log(`Mock IPN processed successfully for order: ${orderId}`);
  } catch (error) {
    console.error('Mock IPN processing error:', error);
  }
}

// Helper function to generate VNPay payment URL
function generateVNPayPaymentUrl(params: {
  orderId: string;
  amount: number;
  courseTitle: string;
  returnUrl: string;
  cancelUrl: string;
  userEmail: string;
  userName: string;
}) {
  const baseUrl = process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const tmnCode = process.env.VNPAY_TMN_CODE || 'V0M3ZTRW';
  const hashSecret = process.env.VNPAY_HASH_SECRET || 'UEYCKX1ZQ2SXSCPY7KGKC04XQWAWOT15';

  // Create payment URL with required VNPay parameters
  const url = new URL(baseUrl);

  // Required parameters
  url.searchParams.set('vnp_Version', '2.1.0');
  url.searchParams.set('vnp_Command', 'pay');
  url.searchParams.set('vnp_TmnCode', tmnCode);
  url.searchParams.set('vnp_Amount', (params.amount * 100).toString()); // Convert to smallest currency unit
  url.searchParams.set('vnp_CurrCode', 'VND');
  url.searchParams.set('vnp_TxnRef', params.orderId);
  url.searchParams.set('vnp_OrderInfo', `Thanh toan khoa hoc: ${params.courseTitle}`);
  url.searchParams.set('vnp_OrderType', 'other');
  url.searchParams.set('vnp_Locale', 'vn');
  url.searchParams.set('vnp_ReturnUrl', params.returnUrl);
  url.searchParams.set('vnp_IpnUrl', process.env.VNPAY_IPN_URL || 'https://lms-backend-cf11.onrender.com/api/client/payments/vnpay/ipn');

  // Add user information for VNPay email notifications (optional)
  // Only add if email is valid to avoid SMTP errors
  if (params.userEmail && params.userEmail.includes('@') && params.userEmail.includes('.')) {
    url.searchParams.set('vnp_Email', params.userEmail);
    url.searchParams.set('vnp_Name', params.userName);
  }

  // Add timestamp (VNPay format: YYYYMMDDHHmmss)
  const date = new Date();
  const createDate =
    date.getFullYear().toString() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2);
  url.searchParams.set('vnp_CreateDate', createDate);

  // Add expire time (15 minutes from now) - VNPay format: YYYYMMDDHHmmss
  const expireDate = new Date(date.getTime() + 15 * 60 * 1000);
  const expireDateStr =
    expireDate.getFullYear().toString() +
    ('0' + (expireDate.getMonth() + 1)).slice(-2) +
    ('0' + expireDate.getDate()).slice(-2) +
    ('0' + expireDate.getHours()).slice(-2) +
    ('0' + expireDate.getMinutes()).slice(-2) +
    ('0' + expireDate.getSeconds()).slice(-2);
  url.searchParams.set('vnp_ExpireDate', expireDateStr);

  // Generate checksum hash - VNPay requires sorted params
  const crypto = require('crypto');

  // Get all params and sort alphabetically
  const sortedParams: string[] = [];
  url.searchParams.forEach((value, key) => {
    sortedParams.push(`${key}=${value}`);
  });
  sortedParams.sort();

  // Create hash data string
  const hashData = sortedParams.join('&');

  // Generate HMAC SHA512 hash
  const hmac = crypto.createHmac('sha512', hashSecret);
  hmac.update(Buffer.from(hashData, 'utf-8'));
  const vnp_SecureHash = hmac.digest('hex');

  // Add secure hash to URL
  url.searchParams.set('vnp_SecureHash', vnp_SecureHash);

  return url.toString();
}

// Process payment callback
router.post('/callback', async (req: any, res) => {
  try {
    const { billId, status, transactionId } = req.body;

    if (!billId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID and status are required'
      });
    }

    // Update bill status
    const bill = await Bill.findByIdAndUpdate(
      billId,
      {
        status: status === 'success' ? 'completed' : 'failed',
        transactionId,
        paidAt: status === 'success' ? new Date() : undefined
      },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    // If payment successful, enroll user in course
    if (status === 'success' && bill.courseId) {
      // This would typically create enrollment
      // For now, just return success
    }

    res.json({
      success: true,
      message: 'Payment callback processed successfully',
      data: bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test IPN endpoint accessibility
router.get('/vnpay/test-ipn', async (req: any, res) => {
  try {
    res.json({
      success: true,
      message: 'IPN endpoint is accessible',
      timestamp: new Date().toISOString(),
      environment: {
        vnpayTmnCode: process.env.VNPAY_TMN_CODE,
        vnpayPaymentUrl: process.env.VNPAY_PAYMENT_URL,
        vnpayIpnUrl: process.env.VNPAY_IPN_URL,
        appBaseUrl: process.env.APP_BASE_URL
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'IPN test failed'
    });
  }
});

// VNPay IPN callback
router.post('/vnpay/ipn', async (req: any, res) => {
  try {
    const vnpParams = req.body;
    console.log('VNPay IPN received:', vnpParams);

    // Extract VNPay parameters
    const orderId = vnpParams.vnp_TxnRef;
    const amount = parseInt(vnpParams.vnp_Amount) / 100; // Convert from smallest currency unit
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionId = vnpParams.vnp_TransactionNo;
    const bankCode = vnpParams.vnp_BankCode;
    const secureHash = vnpParams.vnp_SecureHash;

    // Verify response code
    const isSuccess = responseCode === '00';
    const status = isSuccess ? 'completed' : 'failed';

    console.log(`VNPay IPN - Order: ${orderId}, Amount: ${amount}, Response: ${responseCode}, Status: ${status}`);

    // Find bill by orderId
    const bill = await Bill.findOne({
      'metadata.vnpayOrderId': orderId
    });

    if (!bill) {
      console.error(`VNPay IPN - Bill not found for order: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    // Update bill status
    bill.status = status;
    bill.transactionId = transactionId;
    if (isSuccess) {
      bill.paidAt = new Date();
      bill.metadata = {
        ...bill.metadata,
        vnpBankCode: bankCode,
        vnpTransactionNo: transactionId,
        vnpResponseCode: responseCode
      };
    }

    await bill.save();
    console.log(`VNPay IPN - Bill ${bill._id} updated to status: ${status}`);

    // If payment successful, create enrollment
    if (isSuccess && bill.courseId) {
      try {
        // Import Enrollment model
        const { Enrollment } = require('../../shared/models');

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          studentId: bill.studentId,
          courseId: bill.courseId
        });

        if (!existingEnrollment) {
          // Get course to get instructorId
          const course = await Course.findById(bill.courseId);

          // Create enrollment
          const enrollment = new Enrollment({
            studentId: bill.studentId,
            courseId: bill.courseId,
            instructorId: course?.instructorId,
            enrolledAt: new Date(),
            progress: 0,
            isActive: true,
            paymentStatus: 'completed',
            paymentMethod: 'vnpay',
            paymentDetails: {
              billId: bill._id,
              transactionId: transactionId,
              amount: amount,
              currency: 'VND',
              paymentGateway: 'vnpay'
            }
          });

          await enrollment.save();
          console.log(`VNPay IPN - Enrollment created: ${enrollment._id}`);

          // Update course stats
          await Course.findByIdAndUpdate(bill.courseId, {
            $inc: { totalStudents: 1 }
          });

          // Update user stats
          await User.findByIdAndUpdate(bill.studentId, {
            $inc: { 'stats.totalCoursesEnrolled': 1 }
          });
        } else {
          console.log(`VNPay IPN - User already enrolled in course: ${bill.courseId}`);
        }
      } catch (enrollmentError) {
        console.error('VNPay IPN - Error creating enrollment:', enrollmentError);
      }
    }

    // Return success to VNPay (required)
    res.json({
      RspCode: '00',
      Message: 'Confirmed'
    });

  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.status(500).json({
      RspCode: '99',
      Message: 'Unknown error'
    });
  }
});

// Mock VNPay IPN for testing
router.post('/vnpay/mock-ipn', async (req: any, res) => {
  try {
    const { orderId, amount, responseCode = '00' } = req.body;

    console.log(`Mock VNPay IPN - Order: ${orderId}, Amount: ${amount}, Response: ${responseCode}`);

    // Find bill by orderId
    const bill = await Bill.findOne({
      'metadata.vnpayOrderId': orderId
    });

    if (!bill) {
      console.error(`Mock VNPay IPN - Bill not found for order: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    // Update bill status
    const isSuccess = responseCode === '00';
    const status = isSuccess ? 'completed' : 'failed';

    bill.status = status;
    bill.transactionId = `MOCK_${Date.now()}`;
    if (isSuccess) {
      bill.paidAt = new Date();
      bill.metadata = {
        ...bill.metadata,
        vnpBankCode: 'NCB',
        vnpTransactionNo: bill.transactionId,
        vnpResponseCode: responseCode
      };
    }

    await bill.save();
    console.log(`Mock VNPay IPN - Bill ${bill._id} updated to status: ${status}`);

    // If payment successful, create enrollment
    if (isSuccess && bill.courseId) {
      try {
        // Import Enrollment model
        const { Enrollment } = require('../../shared/models');

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          studentId: bill.studentId,
          courseId: bill.courseId
        });

        if (!existingEnrollment) {
          // Get course to get instructorId
          const course = await Course.findById(bill.courseId);

          // Create enrollment
          const enrollment = new Enrollment({
            studentId: bill.studentId,
            courseId: bill.courseId,
            instructorId: course?.instructorId,
            enrolledAt: new Date(),
            progress: 0,
            isActive: true,
            paymentStatus: 'completed',
            paymentMethod: 'vnpay',
            paymentDetails: {
              billId: bill._id,
              transactionId: bill.transactionId,
              amount: amount,
              currency: 'VND',
              paymentGateway: 'vnpay'
            }
          });

          await enrollment.save();
          console.log(`Mock VNPay IPN - Enrollment created: ${enrollment._id}`);

          // Update course stats
          await Course.findByIdAndUpdate(bill.courseId, {
            $inc: { totalStudents: 1 }
          });

          // Update user stats
          await User.findByIdAndUpdate(bill.studentId, {
            $inc: { 'stats.totalCoursesEnrolled': 1 }
          });
        } else {
          console.log(`Mock VNPay IPN - User already enrolled in course: ${bill.courseId}`);
        }
      } catch (enrollmentError) {
        console.error('Mock VNPay IPN - Error creating enrollment:', enrollmentError);
      }
    }

    res.json({
      success: true,
      message: 'Mock VNPay IPN processed successfully',
      data: {
        orderId,
        amount,
        status,
        transactionId: bill.transactionId
      }
    });

  } catch (error) {
    console.error('Mock VNPay IPN error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// VNPay return URL (user redirect after payment)
router.get('/vnpay/return', async (req: any, res) => {
  try {
    const vnpParams = req.query;

    console.log('VNPay return URL called with params:', vnpParams);

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const amount = vnpParams.vnp_Amount / 100;
    const transactionId = vnpParams.vnp_TransactionNo;
    const bankCode = vnpParams.vnp_BankCode;

    // Find bill by orderId
    const bill = await Bill.findOne({
      'metadata.vnpayOrderId': orderId
    });

    if (!bill) {
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/result?error=order_not_found`);
    }

    // Redirect to frontend with payment result
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/payment/result', frontendUrl);

    // Add all VNPay parameters to redirect URL
    Object.keys(vnpParams).forEach(key => {
      redirectUrl.searchParams.set(key, vnpParams[key]);
    });

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('VNPay return URL error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/result?error=internal_error`);
  }
});

// Request refund
router.post('/refund', async (req: any, res) => {
  try {
    const { billId, reason, description } = req.body;

    if (!billId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID and reason are required'
      });
    }

    // Check if bill exists and belongs to user
    const bill = await Bill.findOne({
      _id: billId,
      studentId: req.user.id,
      status: 'completed'
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found or not eligible for refund'
      });
    }

    // This would typically create a refund request
    // For now, just return success

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: {
        billId: bill._id,
        amount: bill.amount,
        reason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get payment methods
router.get('/methods', async (req: any, res) => {
  try {
    // This would typically query user's saved payment methods
    const mockMethods = [
      {
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      }
    ];

    res.json({
      success: true,
      data: mockMethods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get payment statistics
router.get('/stats', async (req: any, res) => {
  try {
    const [
      totalSpent,
      totalBills,
      completedPayments,
      pendingPayments
    ] = await Promise.all([
      Bill.aggregate([
        { $match: { studentId: req.user.id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Bill.countDocuments({ studentId: req.user.id }),
      Bill.countDocuments({ studentId: req.user.id, status: 'completed' }),
      Bill.countDocuments({ studentId: req.user.id, status: 'pending' })
    ]);

    const spent = totalSpent[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalSpent: spent,
        totalBills,
        completedPayments,
        pendingPayments,
        averageSpent: totalBills > 0 ? spent / totalBills : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
