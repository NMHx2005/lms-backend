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
import quizHistoryRoutes from './quiz-history.routes';
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

    // ✅ BƯỚC 2: Find bill by orderId (try multiple formats - similar to Return URL)
    // Parse orderId to extract courseId and studentId
    // Format: VNPAY_timestamp_studentId_courseId
    const orderParts = orderId ? orderId.split('_') : [];
    let bill = null;

    // Method 1: Find by metadata.vnpayOrderId (primary method)
    if (orderId) {
      bill = await Bill.findOne({
        'metadata.vnpayOrderId': orderId
      });
    }

    // Method 2: If not found and orderId format is correct, parse and find by courseId + studentId
    if (!bill && orderParts.length >= 4 && orderParts[0] === 'VNPAY') {
      const studentId = orderParts[orderParts.length - 2];
      const courseId = orderParts[orderParts.length - 1];

      console.log(`VNPay IPN - Parsing orderId - studentId: ${studentId}, courseId: ${courseId}`);

      // Find by courseId + studentId + status pending (similar to teacher package)
      bill = await Bill.findOne({
        courseId: courseId,
        studentId: studentId,
        status: 'pending',
        paymentMethod: 'vnpay'
      });

      console.log(`VNPay IPN - Found bill by courseId+studentId: ${bill ? bill._id : 'not found'}`);
    }

    // Method 3: Fallback - try other formats
    if (!bill && orderId) {
      console.log(`VNPay IPN - Bill not found with primary methods, trying fallback lookups for: ${orderId}`);

      // Try finding by orderId as transactionId
      bill = await Bill.findOne({
        transactionId: orderId
      });

      // Try finding by orderId in metadata (different key)
      if (!bill) {
        bill = await Bill.findOne({
          'metadata.orderId': orderId
        });
      }
    }

    console.log('VNPay IPN - Bill lookup result:', {
      orderId,
      billFound: !!bill,
      billId: bill?._id?.toString(),
      billStatus: bill?.status,
      billCourseId: bill?.courseId?.toString(),
      billStudentId: bill?.studentId?.toString(),
      billMetadata: bill?.metadata
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
    console.log('=== VNPay Return URL Handler Called ===');
    console.log('VNPay return URL called with params:', JSON.stringify(vnpParams, null, 2));

    // ✅ Verify signature (theo chuẩn VNPay - Return URL chỉ verify, không update)
    const { valid, calc, provided } = verifyVnpSignature(vnpParams);

    console.log('VNPay return URL signature verification:', {
      valid,
      calcPrefix: calc?.substring(0, 20) || 'N/A',
      providedPrefix: provided?.substring(0, 20) || 'N/A',
      orderId: vnpParams.vnp_TxnRef
    });

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionStatus = vnpParams.vnp_TransactionStatus;
    const amount = vnpParams.vnp_Amount ? parseInt(vnpParams.vnp_Amount) / 100 : 0;
    const transactionId = vnpParams.vnp_TransactionNo;
    const bankCode = vnpParams.vnp_BankCode;

    // Determine success/failure
    const isSuccess = responseCode === '00' || transactionStatus === '00';

    console.log('VNPay return URL - Payment status:', {
      orderId,
      responseCode,
      transactionStatus,
      isSuccess,
      amount,
      transactionId,
      bankCode
    });

    // Parse orderId to extract courseId and studentId (similar to teacher package)
    // Format: VNPAY_timestamp_studentId_courseId
    const orderParts = orderId ? orderId.split('_') : [];
    let bill = null;

    // Method 1: Find by metadata.vnpayOrderId (primary method)
    if (orderId) {
      bill = await Bill.findOne({
        'metadata.vnpayOrderId': orderId
      });
    }

    // Method 2: If not found and orderId format is correct, parse and find by courseId + studentId
    if (!bill && orderParts.length >= 4 && orderParts[0] === 'VNPAY') {
      const studentId = orderParts[orderParts.length - 2];
      const courseId = orderParts[orderParts.length - 1];

      console.log(`Parsing orderId - studentId: ${studentId}, courseId: ${courseId}`);

      // Find by courseId + studentId + status pending (similar to teacher package)
      bill = await Bill.findOne({
        courseId: courseId,
        studentId: studentId,
        status: 'pending',
        paymentMethod: 'vnpay'
      });

      console.log(`Found bill by courseId+studentId: ${bill ? bill._id : 'not found'}`);
    }

    // Method 3: Fallback - try other formats
    if (!bill && orderId) {
      console.log(`Bill not found with primary methods, trying fallback lookups for: ${orderId}`);

      // Try finding by orderId as transactionId
      bill = await Bill.findOne({
        transactionId: orderId
      });

      // Try finding by orderId in metadata (different key)
      if (!bill) {
        bill = await Bill.findOne({
          'metadata.orderId': orderId
        });
      }
    }

    console.log('VNPay return URL - Bill lookup result:', {
      orderId,
      billFound: !!bill,
      billId: bill?._id?.toString(),
      billStatus: bill?.status,
      billCourseId: bill?.courseId?.toString(),
      billStudentId: bill?.studentId?.toString(),
      billAmount: bill?.amount,
      billMetadata: bill?.metadata
    });

    // Try to update bill and create enrollment if payment successful (fallback if IPN didn't work)
    if (isSuccess && valid && bill) {
      try {
        // Update bill if still pending (fallback - IPN should have done this)
        if (bill.status === 'pending') {
          bill.status = 'completed';
          bill.paidAt = new Date();
          bill.transactionId = transactionId || orderId;
          bill.metadata = {
            ...bill.metadata,
            vnpBankCode: bankCode,
            vnpTransactionNo: transactionId,
            vnpResponseCode: responseCode,
            vnpTransactionStatus: transactionStatus,
            vnpOrderId: orderId,
            vnpPayDate: vnpParams.vnp_PayDate,
            processedAt: new Date(),
            updatedViaReturnUrl: true // Flag to indicate this was updated via return URL
          };
          await bill.save();
          console.log(`VNPay return URL - Bill ${bill._id} updated to completed (fallback)`);

          // Create enrollment if not exists (fallback - IPN should have done this)
          if (bill.courseId) {
            const existingEnrollment = await Enrollment.findOne({
              studentId: bill.studentId,
              courseId: bill.courseId
            });

            if (!existingEnrollment) {
              const course = await Course.findById(bill.courseId);
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
              console.log(`VNPay return URL - Enrollment created: ${enrollment._id} (fallback)`);

              // Update course stats
              await Course.findByIdAndUpdate(bill.courseId, {
                $inc: { totalStudents: 1 }
              });

              // Update user stats
              await User.findByIdAndUpdate(bill.studentId, {
                $inc: { 'stats.totalCoursesEnrolled': 1 }
              });
            } else {
              console.log(`VNPay return URL - User already enrolled in course: ${bill.courseId}`);
            }
          }
        } else {
          console.log(`VNPay return URL - Bill ${bill._id} already processed (status: ${bill.status})`);
        }
      } catch (error) {
        console.error('Error updating bill/enrollment in return URL:', error);
        // Don't fail redirect if update fails
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/payment/result', frontendUrl);

    if (!valid) {
      console.error('Invalid VNPay signature in return URL - will not update bill/enrollment for security');
      redirectUrl.searchParams.set('error', 'invalid_signature');
      redirectUrl.searchParams.set('signatureError', 'true');
      if (orderId) redirectUrl.searchParams.set('orderId', orderId);
      return res.redirect(redirectUrl.toString());
    }

    if (!bill) {
      console.error(`=== ERROR: Bill not found for orderId: ${orderId} ===`);
      console.error('Attempted lookups:', {
        'metadata.vnpayOrderId': orderId,
        'transactionId': orderId,
        'metadata.orderId': orderId
      });
      redirectUrl.searchParams.set('error', 'order_not_found');
      if (orderId) redirectUrl.searchParams.set('orderId', orderId);
      return res.redirect(redirectUrl.toString());
    }

    console.log('=== VNPay Return URL - Processing bill update ===');
    console.log('Bill details before update:', {
      billId: bill._id.toString(),
      status: bill.status,
      courseId: bill.courseId?.toString(),
      studentId: bill.studentId?.toString()
    });

    // Add VNPay parameters to redirect URL (use original VNPAY parameter names for frontend compatibility)
    // Frontend expects: vnp_ResponseCode, vnp_TxnRef, vnp_Amount, vnp_TransactionNo, vnp_BankCode
    if (orderId) {
      redirectUrl.searchParams.set('vnp_TxnRef', orderId); // Original VNPAY name
      redirectUrl.searchParams.set('orderId', orderId); // Also set mapped name
    }
    if (responseCode) {
      redirectUrl.searchParams.set('vnp_ResponseCode', responseCode); // Original VNPAY name
      redirectUrl.searchParams.set('responseCode', responseCode); // Also set mapped name
    }
    if (transactionStatus) {
      redirectUrl.searchParams.set('vnp_TransactionStatus', transactionStatus); // Original VNPAY name
      redirectUrl.searchParams.set('transactionStatus', transactionStatus); // Also set mapped name
    }
    if (transactionId) {
      redirectUrl.searchParams.set('vnp_TransactionNo', transactionId); // Original VNPAY name
      redirectUrl.searchParams.set('transactionId', transactionId); // Also set mapped name
    }
    if (amount) {
      redirectUrl.searchParams.set('vnp_Amount', (amount * 100).toString()); // VNPAY uses amount * 100
      redirectUrl.searchParams.set('amount', amount.toString()); // Also set mapped name
    }
    if (bankCode) {
      redirectUrl.searchParams.set('vnp_BankCode', bankCode); // Original VNPAY name
      redirectUrl.searchParams.set('bankCode', bankCode); // Also set mapped name
    }

    // Determine success/failure
    redirectUrl.searchParams.set('success', isSuccess ? 'true' : 'false');

    if (isSuccess && valid) {
      console.log('=== Return URL: Signature valid, payment successful ===');
      console.log('Final bill status:', bill.status);
      console.log('Enrollment check will be done in fallback logic above');
    } else {
      console.log('=== Return URL: Payment failed or signature invalid ===', {
        isSuccess,
        valid
      });
    }

    console.log('=== Redirecting to frontend ===');
    console.log('Redirect URL:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error processing VNPay return URL:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/result?error=internal_error`);
  }
});

// VNPay callback for teacher package payments (server-to-server)
router.post('/teacher-packages/vnpay/callback', TeacherPackageController.handleVNPayCallback);

// VNPay return URL for teacher package payments (user redirect)
router.get('/teacher-packages/vnpay/return', async (req: any, res) => {
  try {
    const vnpParams = req.query;
    console.log('VNPay teacher package return URL called with params:', vnpParams);

    // ✅ Verify signature (theo chuẩn VNPay - Return URL chỉ verify, không update)
    const { valid, calc, provided } = verifyVnpSignature(vnpParams);

    console.log('VNPay return URL signature verification:', {
      valid,
      calcPrefix: calc.substring(0, 20),
      providedPrefix: provided.substring(0, 20),
      orderId: vnpParams.vnp_TxnRef
    });

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionStatus = vnpParams.vnp_TransactionStatus;
    const amount = vnpParams.vnp_Amount ? parseInt(vnpParams.vnp_Amount) / 100 : 0;
    const transactionId = vnpParams.vnp_TransactionNo;
    const bankCode = vnpParams.vnp_BankCode;

    // Determine success/failure
    const isSuccess = responseCode === '00' || transactionStatus === '00';

    // Extract orderId parts to get teacherId and packageId
    const orderParts = orderId ? orderId.split('_') : [];
    if (orderParts.length >= 4 && orderParts[0] === 'PKG') {
      const teacherId = orderParts[2];
      const packageId = orderParts[3];

      // Try to find subscription and update if payment successful (fallback if IPN didn't work)
      // Only update if signature is valid AND payment is successful
      if (isSuccess && valid) {
        try {
          const { TeacherPackageSubscription } = require('../../shared/models/extended/TeacherPackage');

          // Try multiple methods to find subscription (similar to IPN handler)
          // Method 1: Find by teacherId + packageId + status pending
          let subscription = await TeacherPackageSubscription.findOne({
            teacherId,
            packageId,
            status: 'pending',
            paymentMethod: 'vnpay'
          });

          // Method 2: If not found, try to find by metadata.vnpOrderId
          if (!subscription) {
            subscription = await TeacherPackageSubscription.findOne({
              'metadata.vnpayOrderId': orderId,
              status: 'pending'
            });
          }

          // Method 3: If still not found, try to find by metadata.vnpOrderId (any status) to check if already processed
          if (!subscription) {
            subscription = await TeacherPackageSubscription.findOne({
              'metadata.vnpayOrderId': orderId
            });
          }

          if (subscription) {
            // ✅ IDEMPOTENCY CHECK: Don't update if already processed by IPN
            if (subscription.status === 'active' && subscription.metadata?.vnpTransactionNo) {
              console.log(`VNPay return URL - Subscription ${subscription._id} already processed by IPN, skipping update`);
            } else if (subscription.status !== 'pending') {
              console.log(`VNPay return URL - Subscription ${subscription._id} status is ${subscription.status}, not pending, skipping update`);
            } else {
              // Only update if still pending (IPN hasn't processed it yet)
              subscription.status = 'active';
              subscription.metadata = {
                ...subscription.metadata,
                vnpBankCode: bankCode,
                vnpTransactionNo: transactionId,
                vnpResponseCode: responseCode,
                vnpTransactionStatus: transactionStatus,
                vnpOrderId: orderId,
                vnpayOrderId: orderId, // Also set for consistency
                vnpPayDate: vnpParams.vnp_PayDate,
                processedAt: new Date(),
                updatedViaReturnUrl: true // Flag to indicate this was updated via return URL
              };
              await subscription.save();
              console.log(`VNPay return URL - Subscription ${subscription._id} updated to active (fallback - IPN didn't process yet)`);

              // Also update bill if exists
              const bill = await Bill.findOne({
                'metadata.vnpayOrderId': orderId
              });
              if (bill && bill.status === 'pending') {
                bill.status = 'completed';
                bill.paidAt = new Date();
                bill.transactionId = transactionId || orderId;
                bill.metadata = {
                  ...bill.metadata,
                  vnpBankCode: bankCode,
                  vnpTransactionNo: transactionId,
                  vnpResponseCode: responseCode,
                  vnpTransactionStatus: transactionStatus,
                  vnpOrderId: orderId,
                  vnpPayDate: vnpParams.vnp_PayDate,
                  subscriptionId: subscription._id.toString(),
                  processedAt: new Date(),
                  updatedViaReturnUrl: true
                };
                await bill.save();
                console.log(`VNPay return URL - Bill ${bill._id} updated to completed (fallback)`);
              }
            }
          }
        } catch (error) {
          console.error('Error updating subscription in return URL:', error);
          // Don't fail redirect if update fails
        }
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/teacher/advanced/packages', frontendUrl);

    // Add VNPay parameters to redirect URL
    redirectUrl.searchParams.set('payment', isSuccess && valid ? 'success' : 'failed');
    if (orderId) redirectUrl.searchParams.set('orderId', orderId);
    if (responseCode) redirectUrl.searchParams.set('responseCode', responseCode);
    if (transactionStatus) redirectUrl.searchParams.set('transactionStatus', transactionStatus);
    if (transactionId) redirectUrl.searchParams.set('transactionId', transactionId);
    if (amount) redirectUrl.searchParams.set('amount', amount.toString());

    if (!valid) {
      console.error('Invalid signature in return URL - will not update subscription/bill for security');
      redirectUrl.searchParams.set('error', 'invalid_signature');
      redirectUrl.searchParams.set('signatureError', 'true');
    } else if (isSuccess) {
      // If signature is valid and payment successful, but subscription/bill not updated above,
      // it means IPN should have handled it. Log for debugging.
      console.log('Return URL: Signature valid, payment successful. IPN should have updated subscription/bill.');
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error processing VNPay teacher package return URL:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/teacher/advanced/packages?payment=error&error=internal_error`);
  }
  });

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
router.use('/quiz/history', quizHistoryRoutes);

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
