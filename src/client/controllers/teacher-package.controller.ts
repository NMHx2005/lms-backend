import { Request, Response } from 'express';
import { PackagePlan } from '../../shared/models/extended/TeacherPackage';
import { TeacherPackageSubscription } from '../../shared/models/extended/TeacherPackage';
import { User } from '../../shared/models/core/User';
import Bill from '../../shared/models/core/Bill';
import { verifyVnpSignature } from '../../shared/services/payments/vnpay.service';
import { TeacherPackageService } from '../services/teacher-package.service';

export class TeacherPackageController {
  // Get available packages for teachers
  static async getAvailablePackages(req: any, res: Response) {
    try {
      const { status = 'active' } = req.query;
      const packages = await TeacherPackageService.getAvailablePackages(status);

      res.json({
        success: true,
        data: packages,
        message: 'Available packages retrieved successfully'
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve available packages'
      });
    }
  }

  // Get teacher's current active subscription
  static async getCurrentSubscription(req: any, res: Response) {
    try {
      const teacherId = req.user.id;
      const subscription = await TeacherPackageService.getCurrentSubscription(teacherId);

      res.json({
        success: true,
        data: subscription,
        message: subscription ? 'Current subscription retrieved' : 'No active subscription found'
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve current subscription'
      });
    }
  }

  // Get teacher's subscription history
  static async getSubscriptionHistory(req: any, res: Response) {
    try {
      const teacherId = req.user.id;
      const { status = 'all', page = 1, limit = 10 } = req.query;

      const result = await TeacherPackageService.getSubscriptionHistory(
        teacherId,
        status,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.subscriptions,
        pagination: result.pagination,
        message: 'Subscription history retrieved successfully'
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve subscription history'
      });
    }
  }

  // Subscribe to a package
  static async subscribeToPackage(req: any, res: Response) {
    try {
      const teacherId = req.user.id;
      const { packageId, paymentMethod = 'wallet', couponCode } = req.body;

      // Removed controller-level guard that blocked any new subscription if one was active.
      // Service already prevents duplicate subscription to the SAME package and allows multiple different packages.

      const result = await TeacherPackageService.subscribeToPackage(
        teacherId,
        packageId,
        paymentMethod,
        couponCode,
        req // Pass request object to get IP address
      );

      console.log('Subscribe result:', {
        hasPaymentUrl: !!result.paymentUrl,
        paymentMethod,
        status: result.status
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Successfully subscribed to package'
      });
    } catch (error) {

      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to subscribe to package'
      });
    }
  }

  // Renew current subscription
  static async renewSubscription(req: any, res: Response) {
    try {
      const teacherId = req.user.id;
      const { paymentMethod = 'wallet', couponCode } = req.body;

      const result = await TeacherPackageService.renewSubscription(
        teacherId,
        paymentMethod,
        couponCode
      );

      res.json({
        success: true,
        data: result,
        message: 'Subscription renewed successfully'
      });
    } catch (error) {

      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to renew subscription'
      });
    }
  }

  // Cancel current subscription
  static async cancelSubscription(req: any, res: Response) {
    try {
      const teacherId = req.user.id;

      const result = await TeacherPackageService.cancelSubscription(teacherId);

      res.json({
        success: true,
        data: result,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {

      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to cancel subscription'
      });
    }
  }

  // Cancel specific package subscription
  static async cancelPackageSubscription(req: any, res: Response) {
    try {
      const teacherId = req.user.id;
      const { packageId } = req.params;
      const result = await TeacherPackageService.cancelPackageSubscription(teacherId, packageId);

      res.json({
        success: true,
        data: result,
        message: 'Package subscription cancelled successfully'
      });
    } catch (error) {

      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to cancel package subscription'
      });
    }
  }

  // Get package details
  static async getPackageDetails(req: any, res: Response) {
    try {
      const { id } = req.params;
      const packageDetails = await TeacherPackageService.getPackageDetails(id);

      if (!packageDetails) {
        return res.status(404).json({
          success: false,
          error: 'Package not found'
        });
      }

      res.json({
        success: true,
        data: packageDetails,
        message: 'Package details retrieved successfully'
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve package details'
      });
    }
  }

  // Handle VNPay callback for package subscription (IPN URL)
  static async handleVNPayCallback(req: any, res: Response) {
    try {
      // VNPay IPN có thể gửi qua GET hoặc POST
      const vnpParams = req.method === 'GET' ? req.query : req.body;
      console.log('VNPay package callback received:', vnpParams);

      // ✅ BƯỚC 1: Verify signature (BẮT BUỘC theo chuẩn VNPay)
      const { valid } = verifyVnpSignature(vnpParams);
      if (!valid) {
        console.error('Invalid VNPay signature for package callback');
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
      const status = isSuccess ? 'active' : 'cancelled';

      console.log(`VNPay package callback - Order: ${orderId}, Amount: ${amount}, Response: ${responseCode}, Status: ${status}`);

      // Find subscription by orderId (extracted from orderId format: PKG_timestamp_teacherId_packageId)
      const orderParts = orderId.split('_');
      if (orderParts.length < 4 || orderParts[0] !== 'PKG') {
        console.error(`Invalid order ID format: ${orderId}`);
        return res.status(400).json({
          RspCode: '01',
          Message: 'Invalid order ID format'
        });
      }

      const teacherId = orderParts[2];
      const packageId = orderParts[3];

      // Find pending subscription - try multiple ways
      // Method 1: Find by teacherId + packageId + status pending
      let subscription = await TeacherPackageSubscription.findOne({
        teacherId,
        packageId,
        status: 'pending',
        paymentMethod: 'vnpay'
      });

      // Method 2: If not found, try to find by metadata.vnpOrderId (fallback)
      if (!subscription) {
        subscription = await TeacherPackageSubscription.findOne({
          'metadata.vnpOrderId': orderId,
          status: 'pending'
        });
        console.log(`Found subscription by metadata.vnpOrderId: ${subscription ? subscription._id : 'not found'}`);
      }

      // Method 3: If still not found, try to find any subscription with this orderId (even if not pending)
      if (!subscription) {
        subscription = await TeacherPackageSubscription.findOne({
          'metadata.vnpOrderId': orderId
        });
        console.log(`Found subscription by metadata.vnpOrderId (any status): ${subscription ? subscription._id : 'not found'}`);
      }

      if (!subscription) {
        console.error(`Subscription not found for orderId: ${orderId}, teacherId: ${teacherId}, packageId: ${packageId}`);
        return res.status(404).json({
          RspCode: '01',
          Message: 'Subscription not found'
        });
      }

      // ✅ BƯỚC 2: Idempotency check - Kiểm tra xem đã xử lý chưa
      // Theo chuẩn VNPAY: chỉ xử lý khi status = pending, nếu đã xử lý thì trả về RspCode: '02'
      if (subscription.status === 'active' && subscription.metadata?.vnpTransactionNo) {
        console.log(`Subscription ${subscription._id} already processed`);
        return res.json({
          RspCode: '02',
          Message: 'Order already confirmed'
        });
      }

      // Kiểm tra nếu status không phải pending thì không xử lý
      if (subscription.status !== 'pending') {
        console.log(`Subscription ${subscription._id} status is ${subscription.status}, not pending`);
        return res.json({
          RspCode: '02',
          Message: 'Order already confirmed'
        });
      }

      // ✅ BƯỚC 3: Amount validation - Kiểm tra số tiền
      const expectedAmount = subscription.snapshot.price;
      if (Math.abs(amount - expectedAmount) > 0.01) { // Allow small floating point difference
        console.error(`Amount mismatch: Expected ${expectedAmount}, got ${amount}`);
        return res.status(400).json({
          RspCode: '04',
          Message: 'Invalid amount'
        });
      }

      // ✅ BƯỚC 4: Update subscription status
      subscription.status = status;
      if (isSuccess) {
        // Set startAt and endAt if not already set (should be set during creation, but ensure it)
        if (!subscription.startAt) {
          subscription.startAt = new Date();
        }
        if (!subscription.endAt) {
          const endAt = new Date(subscription.startAt);
          const billingCycle = subscription.snapshot?.billingCycle || 'monthly';
          if (billingCycle === 'monthly') {
            endAt.setMonth(endAt.getMonth() + 1);
          } else {
            endAt.setFullYear(endAt.getFullYear() + 1);
          }
          subscription.endAt = endAt;
        }

        subscription.metadata = {
          ...subscription.metadata,
          vnpBankCode: bankCode,
          vnpTransactionNo: transactionId,
          vnpResponseCode: responseCode,
          vnpTransactionStatus: transactionStatus,
          vnpOrderId: orderId,
          vnpPayDate: vnpParams.vnp_PayDate,
          processedAt: new Date()
        };
      } else {
        subscription.metadata = {
          ...subscription.metadata,
          vnpResponseCode: responseCode,
          vnpTransactionStatus: transactionStatus,
          vnpOrderId: orderId,
          error: `Payment failed with code: ${responseCode}`,
          processedAt: new Date()
        };
      }

      await subscription.save();
      console.log(`VNPay package callback - Subscription ${subscription._id} updated to status: ${status}, startAt: ${subscription.startAt}, endAt: ${subscription.endAt}`);

      // ✅ BƯỚC 5: Update bill when payment is successful (giống logic course payment)
      if (isSuccess) {
        try {
          // Find bill by metadata.vnpayOrderId (giống course payment)
          const bill = await Bill.findOne({
            'metadata.vnpayOrderId': orderId
          });

          if (bill) {
            // Idempotency check for bill - chỉ xử lý khi status = pending
            if (bill.status === 'completed' && bill.paidAt) {
              console.log(`Bill ${bill._id} already processed`);
            } else if (bill.status === 'pending') {
              // Update existing bill to completed
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
                processedAt: new Date()
              };
              await bill.save();
              console.log(`VNPay package callback - Bill ${bill._id} updated to completed`);
            } else {
              console.log(`Bill ${bill._id} status is ${bill.status}, not pending - skipping update`);
            }
          } else {
            console.error(`Bill not found for orderId: ${orderId} in package callback`);
            // Don't create new bill here - bill should have been created during subscription creation
          }
        } catch (error) {
          console.error('Error updating bill in VNPay callback:', error);
          // Don't fail the callback if bill update fails, but log it
        }
      } else {
        // Update bill status to failed if payment failed
        try {
          const bill = await Bill.findOne({
            'metadata.vnpayOrderId': orderId
          });

          if (bill && bill.status === 'pending') {
            bill.status = 'failed';
            bill.metadata = {
              ...bill.metadata,
              vnpResponseCode: responseCode,
              vnpTransactionStatus: transactionStatus,
              vnpOrderId: orderId,
              error: `Payment failed with code: ${responseCode}`,
              processedAt: new Date()
            };
            await bill.save();
            console.log(`VNPay package callback - Bill ${bill._id} updated to failed`);
          }
        } catch (error) {
          console.error('Error updating bill status to failed:', error);
        }
      }

      // ✅ BƯỚC 6: Return response to VNPay (REQUIRED theo chuẩn VNPay)
      // RspCode: 00 = Success, 02 = Already confirmed, 04 = Invalid amount, 97 = Invalid signature, 01 = Order not found
      res.json({
        RspCode: '00',
        Message: 'Confirm Success'
      });

    } catch (error) {

      res.status(500).json({
        RspCode: '99',
        Message: 'Unknown error'
      });
    }
  }

  // Get all active subscriptions
  static async getActiveSubscriptions(req: any, res: Response) {
    try {
      const teacherId = req.user.id;
      const subs = await TeacherPackageService.getActiveSubscriptions(teacherId);
      res.json({ success: true, data: subs, message: 'Active subscriptions retrieved' });
    } catch (error) {

      res.status(500).json({ success: false, error: 'Failed to retrieve active subscriptions' });
    }
  }
}