import express from 'express';
import { Bill, Course, User } from '../../shared/models';
import { buildVnpayPaymentUrl, verifyVnpSignature } from '../../shared/services/payments/vnpay.service';

const router = express.Router();

// Helper function to get client IP address
const getClientIp = (req: any): string => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';
};

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

    // Generate REAL VNPay URL using shared service
    const clientIp = getClientIp(req);
    const ipnUrl = process.env.VNPAY_IPN_URL || `${process.env.BACKEND_URL || 'https://lms-backend-cf11.onrender.com'}/api/client/payments/vnpay/ipn`;

    const paymentUrl = buildVnpayPaymentUrl({
      orderId: vnpayOrderId,
      amount: bill.amount,
      orderInfo: `Thanh toan khoa hoc: ${courseTitle || course.title}`,
      ipAddr: clientIp,
      returnUrl: returnUrl,
      ipnUrl: ipnUrl,
      email: user.email,
      name: (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Customer',
      expireMinutes: 15
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
    // NOTE: Remove || true to allow real VNPAY payment when VNPAY_USE_MOCK is not 'true'
    const useMockPayment = process.env.NODE_ENV === 'development' || process.env.VNPAY_USE_MOCK === 'true';

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
        return res.status(500).json({
          success: false,
          error: 'Failed to process mock payment'
        });
      }
    }

    // Real VNPay payment (if mock is disabled) - using shared service
    const clientIp = getClientIp(req);
    const ipnUrl = process.env.VNPAY_IPN_URL || `${process.env.BACKEND_URL || 'https://lms-backend-cf11.onrender.com'}/api/client/payments/vnpay/ipn`;

    const paymentUrl = buildVnpayPaymentUrl({
      orderId: vnpayOrderId,
      amount: bill.amount,
      orderInfo: `Thanh toan khoa hoc: ${courseTitle || course.title}`,
      ipAddr: clientIp,
      returnUrl: returnUrl,
      ipnUrl: ipnUrl,
      email: user.email,
      name: (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Customer',
      expireMinutes: 15
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

      }
    }

    console.log(`Mock IPN processed successfully for order: ${orderId}`);
  } catch (error) {
  }
}

// Removed duplicate generateVNPayPaymentUrl function - now using shared buildVnpayPaymentUrl service

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

// NOTE: VNPay IPN callback has been moved to index.route.ts as public route (no authentication)
// This allows VNPay server to call the endpoint without authentication token

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
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// NOTE: VNPay return URL has been moved to index.route.ts as public route (no authentication)
// This allows VNPay to redirect users after payment without requiring authentication

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
      pendingPayments,
      failedPayments
    ] = await Promise.all([
      Bill.aggregate([
        { $match: { studentId: req.user.id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Bill.countDocuments({ studentId: req.user.id }),
      Bill.countDocuments({ studentId: req.user.id, status: 'completed' }),
      Bill.countDocuments({ studentId: req.user.id, status: 'pending' }),
      Bill.countDocuments({ studentId: req.user.id, status: 'failed' })
    ]);

    const spent = totalSpent[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalSpent: spent,
        totalBills,
        completedPayments,
        pendingPayments,
        failedPayments,
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

// Retry failed payment
router.post('/bills/:id/retry', async (req: any, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      studentId: req.user.id,
      status: 'failed'
    }).populate('courseId', 'title thumbnail price');

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found or not eligible for retry'
      });
    }

    const course = bill.courseId as any;

    // Generate new VNPay payment URL
    const vnpayOrderId = `VNPAY_RETRY_${Date.now()}_${req.user.id}_${course._id}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Update bill metadata with new order ID
    bill.metadata = {
      ...bill.metadata,
      vnpayOrderId,
      retryAttempt: (bill.metadata?.retryAttempt || 0) + 1
    };
    bill.status = 'pending';
    await bill.save();

    // Get user information
    const user = await User.findById(req.user.id);

    // Generate payment URL using shared service
    const clientIp = getClientIp(req);
    const ipnUrl = process.env.VNPAY_IPN_URL || `${process.env.BACKEND_URL || 'https://lms-backend-cf11.onrender.com'}/api/client/payments/vnpay/ipn`;

    const paymentUrl = buildVnpayPaymentUrl({
      orderId: vnpayOrderId,
      amount: bill.amount,
      orderInfo: `Thanh toan khoa hoc: ${course.title}`,
      ipAddr: clientIp,
      returnUrl: `${frontendUrl}/payment/result`,
      ipnUrl: ipnUrl,
      email: user?.email || '',
      name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Customer',
      expireMinutes: 15
    });

    res.json({
      success: true,
      message: 'Payment retry initiated',
      data: {
        paymentUrl,
        billId: bill._id,
        orderId: vnpayOrderId,
        amount: bill.amount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Download invoice PDF
router.get('/bills/:id/invoice', async (req: any, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      studentId: req.user.id,
      status: 'completed'
    })
      .populate('courseId', 'title')
      .populate('studentId', 'firstName lastName email');

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found or payment not completed'
      });
    }

    // Generate invoice PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${bill._id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    const course = bill.courseId as any;
    const student = bill.studentId as any;

    // Header - Company Info
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1976d2')
      .text('INVOICE', 50, 50);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#424242')
      .text('Learning Management System', 50, 80)
      .text('Email: support@lms.com', 50, 95)
      .text('Website: www.lms.com', 50, 110);

    // Invoice Info (Right side)
    doc
      .fontSize(10)
      .text(`Invoice No: ${bill._id.toString().substring(18)}`, 400, 50, { align: 'right' })
      .text(`Date: ${bill.paidAt?.toLocaleDateString('en-US') || new Date().toLocaleDateString('en-US')}`, 400, 65, { align: 'right' })
      .text(`Status: ${bill.status.toUpperCase()}`, 400, 80, { align: 'right' });

    // Line separator
    doc
      .moveTo(50, 130)
      .lineTo(550, 130)
      .stroke();

    // Bill To
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BILL TO:', 50, 150);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${student.firstName || ''} ${student.lastName || ''}`.trim(), 50, 170)
      .text(student.email, 50, 185);

    // Items Table Header
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DESCRIPTION', 50, 250)
      .text('AMOUNT', 450, 250, { align: 'right' });

    doc
      .moveTo(50, 270)
      .lineTo(550, 270)
      .stroke();

    // Item
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Course: ${course.title}`, 50, 285, { width: 350 })
      .text(
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bill.amount),
        450,
        285,
        { align: 'right' }
      );

    doc
      .moveTo(50, 320)
      .lineTo(550, 320)
      .stroke();

    // Total
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TOTAL:', 350, 340)
      .text(
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bill.amount),
        450,
        340,
        { align: 'right' }
      );

    // Payment Info
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#616161')
      .text('Payment Method:', 50, 400)
      .text(bill.paymentMethod.toUpperCase(), 150, 400);

    if (bill.transactionId) {
      doc.text('Transaction ID:', 50, 415).text(bill.transactionId, 150, 415);
    }

    // Footer
    doc
      .fontSize(9)
      .fillColor('#9e9e9e')
      .text('Thank you for your purchase!', 50, 700, { align: 'center' })
      .text('This is a computer-generated invoice. No signature required.', 50, 715, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice'
    });
  }
});

export default router;
