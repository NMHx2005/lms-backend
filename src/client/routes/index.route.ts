import express from 'express';
import { authenticate } from '../middleware/auth';
import courseRoutes from './course.routes';
import sectionRoutes from './section.routes';
import lessonRoutes from './lesson.routes';
import userRoutes from './user.routes';
import enrollmentRoutes from './enrollment.routes';
import assignmentRoutes from './assignment.routes';
import announcementRoutes from './announcement.routes';
import courseSubmissionRoutes from './course-submission.routes';
import reviewRoutes from './review.routes';
import paymentRoutes from './payment.routes';
import clientAuthRoutes from './auth.routes';
import courseRatingRoutes from './course-rating.routes';
import analyticsRoutes from './analytics.routes';
import certificateRoutes from './certificate.routes';
import teacherRatingRoutes from './teacher-rating.routes';
import teacherDashboardRoutes from './teacher-dashboard.routes';
import teacherPackageRoutes from './teacher-package.routes';
import wishlistRoutes from './wishlist.routes';
import studyGroupRoutes from './study-group.routes';
import messageRoutes from './message.routes';
import earningsRoutes from './earnings.routes';
import aiToolsRoutes from './ai-tools.routes';
import categoryRoutes from './category.routes';
import refundRoutes from './refund.routes';
import progressRoutes from './progress.routes';
import chatRoutes from './chat.routes';
import videoRoutes from './video.routes';
import questionBankRoutes from './question-bank.routes';
import linkRoutes from './link.routes';
import assignmentGradingRoutes from './assignment-grading.routes';
import assignmentAnalyticsRoutes from './assignment-analytics.routes';
import { StudyGroupController } from '../controllers/study-group.controller';

const router = express.Router();

// Public routes (no authentication required)
router.use('/courses', courseRoutes);
router.use('/categories', categoryRoutes);

// Public certificate verification (no auth)
import { ClientCertificateController } from '../controllers/certificate.controller';
router.get('/certificates/verify/:certificateId', ClientCertificateController.verifyCertificate);

// Public VNPay callbacks (no authentication required - called by VNPay server)
// IMPORTANT: These routes must be registered BEFORE the authenticated payment routes
import { TeacherPackageController } from '../controllers/teacher-package.controller';
import { Bill, Course, User, Enrollment } from '../../shared/models';
import { verifyVnpSignature } from '../../shared/services/payments/vnpay.service';

// Helper to get client IP
const getClientIp = (req: any): string => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';
};

// VNPay IPN callback for course payments (server-to-server)
router.post('/payments/vnpay/ipn', async (req: any, res) => {
  try {
    // VNPay IPN có thể gửi qua GET hoặc POST
    const vnpParams = req.method === 'GET' ? req.query : req.body;
    console.log('VNPay IPN received:', vnpParams);

    // ✅ BƯỚC 1: Verify signature (BẮT BUỘC theo chuẩn VNPay)
    const { valid } = verifyVnpSignature(vnpParams);
    if (!valid) {
      console.error('Invalid VNPay signature in IPN');
      return res.status(400).json({
        RspCode: '97',
        Message: 'Invalid signature'
      });
    }

    // Extract VNPay parameters
    const orderId = vnpParams.vnp_TxnRef;
    const amount = parseInt(vnpParams.vnp_Amount) / 100; // Convert from smallest currency unit
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionStatus = vnpParams.vnp_TransactionStatus;
    const transactionId = vnpParams.vnp_TransactionNo;
    const bankCode = vnpParams.vnp_BankCode;

    // Verify response code (00 = success)
    const isSuccess = responseCode === '00' || transactionStatus === '00';
    const status = isSuccess ? 'completed' : 'failed';

    console.log(`VNPay IPN - Order: ${orderId}, Amount: ${amount}, Response: ${responseCode}, Status: ${status}`);

    // ✅ BƯỚC 2: Find bill by orderId
    const bill = await Bill.findOne({
      'metadata.vnpayOrderId': orderId
    });

    if (!bill) {
      console.error(`Bill not found for orderId: ${orderId}`);
      return res.status(404).json({
        RspCode: '01',
        Message: 'Order not found'
      });
    }

    // ✅ BƯỚC 3: Idempotency check - Kiểm tra xem đã xử lý chưa
    // Theo chuẩn VNPAY: chỉ xử lý khi status = 0 (pending), nếu đã xử lý thì trả về RspCode: '02'
    if (bill.status === 'completed' && bill.paidAt) {
      console.log(`Bill ${bill._id} already processed`);
      return res.json({
        RspCode: '02',
        Message: 'Order already confirmed'
      });
    }
    
    // Kiểm tra nếu status không phải pending thì không xử lý
    if (bill.status !== 'pending') {
      console.log(`Bill ${bill._id} status is ${bill.status}, not pending`);
      return res.json({
        RspCode: '02',
        Message: 'Order already confirmed'
      });
    }

    // ✅ BƯỚC 4: Amount validation - Kiểm tra số tiền
    if (Math.abs(bill.amount - amount) > 0.01) { // Allow small floating point difference
      console.error(`Amount mismatch: Bill ${bill.amount} vs VNPay ${amount}`);
      return res.status(400).json({
        RspCode: '04',
        Message: 'Invalid amount'
      });
    }

    // ✅ BƯỚC 5: Update bill status
    bill.status = status;
    bill.transactionId = transactionId;
    if (isSuccess) {
      bill.paidAt = new Date();
      bill.metadata = {
        ...bill.metadata,
        vnpBankCode: bankCode,
        vnpTransactionNo: transactionId,
        vnpResponseCode: responseCode,
        vnpTransactionStatus: transactionStatus,
        vnpPayDate: vnpParams.vnp_PayDate,
        processedAt: new Date()
      };
    } else {
      bill.metadata = {
        ...bill.metadata,
        vnpResponseCode: responseCode,
        vnpTransactionStatus: transactionStatus,
        error: `Payment failed with code: ${responseCode}`,
        processedAt: new Date()
      };
    }

    await bill.save();
    console.log(`VNPay IPN - Bill ${bill._id} updated to status: ${status}`);

    // ✅ BƯỚC 6: If payment successful, create enrollment
    if (isSuccess && bill.courseId) {
      try {
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
        console.error('Error creating enrollment in IPN:', enrollmentError);
        // Don't fail IPN if enrollment creation fails, but log it
      }
    }

    // ✅ BƯỚC 7: Return response to VNPay (REQUIRED theo chuẩn VNPay)
    // RspCode: 00 = Success, 02 = Already confirmed, 04 = Invalid amount, 97 = Invalid signature, 01 = Order not found
    res.json({
      RspCode: '00',
      Message: 'Confirm Success'
    });

  } catch (error) {
    console.error('Error processing VNPay IPN:', error);
    res.status(500).json({
      RspCode: '99',
      Message: 'Unknown error'
    });
  }
});

// VNPay return URL for course payments (user redirect)
router.get('/payments/vnpay/return', async (req: any, res) => {
  try {
    const vnpParams = req.query;
    console.log('VNPay return URL called with params:', vnpParams);

    // ✅ Verify signature (theo chuẩn VNPay - Return URL chỉ verify, không update)
    const { valid } = verifyVnpSignature(vnpParams);

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionStatus = vnpParams.vnp_TransactionStatus;
    const amount = vnpParams.vnp_Amount ? parseInt(vnpParams.vnp_Amount) / 100 : 0;
    const transactionId = vnpParams.vnp_TransactionNo;
    const bankCode = vnpParams.vnp_BankCode;

    // Find bill by orderId
    const bill = await Bill.findOne({
      'metadata.vnpayOrderId': orderId
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/payment/result', frontendUrl);

    if (!valid) {
      console.error('Invalid VNPay signature in return URL');
      redirectUrl.searchParams.set('error', 'invalid_signature');
      redirectUrl.searchParams.set('orderId', orderId);
      return res.redirect(redirectUrl.toString());
    }

    if (!bill) {
      console.error(`Bill not found for orderId: ${orderId}`);
      redirectUrl.searchParams.set('error', 'order_not_found');
      redirectUrl.searchParams.set('orderId', orderId);
      return res.redirect(redirectUrl.toString());
    }

    // Add VNPay parameters to redirect URL
    redirectUrl.searchParams.set('orderId', orderId);
    redirectUrl.searchParams.set('responseCode', responseCode);
    redirectUrl.searchParams.set('transactionStatus', transactionStatus || '');
    redirectUrl.searchParams.set('transactionId', transactionId || '');
    redirectUrl.searchParams.set('amount', amount.toString());
    redirectUrl.searchParams.set('bankCode', bankCode || '');

    // Determine success/failure
    const isSuccess = responseCode === '00' || transactionStatus === '00';
    redirectUrl.searchParams.set('success', isSuccess ? 'true' : 'false');

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error processing VNPay return URL:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/result?error=internal_error`);
  }
});

// VNPay callback for teacher package payments (server-to-server)
router.post('/teacher-packages/vnpay/callback', TeacherPackageController.handleVNPayCallback);

// Protected routes (authentication required)
router.use('/auth', clientAuthRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/sections', authenticate, sectionRoutes);
// Video routes MUST be before /lessons to avoid route conflict
// Video routes include: /lessons/:lessonId/progress, /lessons/:lessonId/notes, etc.
router.use('/', authenticate, videoRoutes); // Video routes (includes /teacher and /lessons prefixes)
router.use('/lessons', authenticate, lessonRoutes);
router.use('/question-bank', authenticate, questionBankRoutes);
router.use('/links', linkRoutes);
router.use('/enrollments', authenticate, enrollmentRoutes);
router.use('/assignments', authenticate, assignmentRoutes);
router.use('/assignment-grading', assignmentGradingRoutes);
router.use('/assignment-analytics', assignmentAnalyticsRoutes);
router.use('/announcements', authenticate, announcementRoutes);
router.use('/payments', authenticate, paymentRoutes);
router.use('/teacher-dashboard', teacherDashboardRoutes); // Must be BEFORE /analytics to avoid route conflict
router.use('/analytics', authenticate, analyticsRoutes);
router.use('/certificates', authenticate, certificateRoutes);
router.use('/teacher-ratings', teacherRatingRoutes);
router.use('/course-submissions', courseSubmissionRoutes);
router.use('/ratings', reviewRoutes); // Course reviews with teacher responses
router.use('/course-ratings', courseRatingRoutes); // Student course ratings/reviews
router.use('/teacher-packages', authenticate, teacherPackageRoutes);
router.use('/wishlist', authenticate, wishlistRoutes);
router.use('/refunds', authenticate, refundRoutes);
router.use('/messages', messageRoutes);
router.use('/earnings', earningsRoutes);
router.use('/ai-tools', aiToolsRoutes);
router.use('/progress', authenticate, progressRoutes);
router.use('/chat', authenticate, chatRoutes);

// Protected Study Group endpoints (must be before public routes to avoid conflicts)
router.use('/study-groups', authenticate, studyGroupRoutes);

// Public Study Group endpoints (no auth)
router.get('/study-groups/public', StudyGroupController.listPublic);
router.get('/study-groups/:groupId', StudyGroupController.detail);

// Client dashboard overview
router.get('/dashboard', authenticate, async (req: any, res) => {
  try {
    res.json({
      success: true,
      message: 'Client Dashboard',
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        userRoles: req.user.roles
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
