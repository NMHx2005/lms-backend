import { Request, Response } from 'express';
import { PackagePlan } from '../../shared/models/extended/TeacherPackage';
import { TeacherPackageSubscription } from '../../shared/models/extended/TeacherPackage';
import { User } from '../../shared/models/core/User';
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
      console.error('Get available packages error:', error);
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
      console.error('Get current subscription error:', error);
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
      console.error('Get subscription history error:', error);
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
        couponCode
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Successfully subscribed to package'
      });
    } catch (error) {
      console.error('Subscribe to package error:', error);
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
      console.error('Renew subscription error:', error);
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
      console.error('Cancel subscription error:', error);
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
      console.error('Cancel package subscription error:', error);
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
      console.error('Get package details error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve package details'
      });
    }
  }

  // Handle VNPay callback for package subscription
  static async handleVNPayCallback(req: any, res: Response) {
    try {
      const vnpParams = req.body;
      console.log('VNPay package callback received:', vnpParams);

      // Extract VNPay parameters
      const orderId = vnpParams.vnp_TxnRef;
      const amount = parseInt(vnpParams.vnp_Amount) / 100; // Convert from smallest currency unit
      const responseCode = vnpParams.vnp_ResponseCode;
      const transactionId = vnpParams.vnp_TransactionNo;
      const bankCode = vnpParams.vnp_BankCode;

      // Verify response code
      const isSuccess = responseCode === '00';
      const status = isSuccess ? 'active' : 'cancelled';

      console.log(`VNPay package callback - Order: ${orderId}, Amount: ${amount}, Response: ${responseCode}, Status: ${status}`);

      // Find subscription by orderId (extracted from orderId format: PKG_timestamp_teacherId_packageId)
      const orderParts = orderId.split('_');
      if (orderParts.length < 4 || orderParts[0] !== 'PKG') {
        console.error(`VNPay package callback - Invalid order ID format: ${orderId}`);
        return res.status(400).json({
          RspCode: '99',
          Message: 'Invalid order ID format'
        });
      }

      const teacherId = orderParts[2];
      const packageId = orderParts[3];

      // Find pending subscription
      const subscription = await TeacherPackageSubscription.findOne({
        teacherId,
        packageId,
        status: 'pending',
        paymentMethod: 'vnpay'
      });

      if (!subscription) {
        console.error(`VNPay package callback - Subscription not found for order: ${orderId}`);
        return res.status(404).json({
          RspCode: '99',
          Message: 'Subscription not found'
        });
      }

      // Update subscription status
      subscription.status = status;
      if (isSuccess) {
        subscription.metadata = {
          ...subscription.metadata,
          vnpBankCode: bankCode,
          vnpTransactionNo: transactionId,
          vnpResponseCode: responseCode,
          vnpOrderId: orderId
        };
      }

      await subscription.save();
      console.log(`VNPay package callback - Subscription ${subscription._id} updated to status: ${status}`);

      // Return success to VNPay (required)
      res.json({
        RspCode: '00',
        Message: 'Confirmed'
      });

    } catch (error) {
      console.error('VNPay package callback error:', error);
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
      console.error('Get active subscriptions error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve active subscriptions' });
    }
  }
}