import { PackagePlan } from '../../shared/models/extended/TeacherPackage';
import { TeacherPackageSubscription } from '../../shared/models/extended/TeacherPackage';
import { User } from '../../shared/models/core/User';
import Bill from '../../shared/models/core/Bill';
import { buildVnpayPaymentUrl } from '../../shared/services/payments/vnpay.service';

export class TeacherPackageService {
    // Helper function to create bill for package subscription
    private static async createPackageBill(
        teacherId: string,
        packageId: string,
        packageName: string,
        amount: number,
        paymentMethod: string,
        subscriptionId: string,
        orderId: string,
        status: 'pending' | 'completed' = 'pending',
        transactionId?: string,
        metadata?: any
    ) {
        try {
            const bill = new Bill({
                studentId: teacherId, // Using studentId field for teacher (Bill model uses studentId for all users)
                courseId: undefined, // No course for package subscription
                amount: amount,
                currency: 'VND',
                purpose: 'subscription',
                status: status,
                paymentMethod: paymentMethod as 'stripe' | 'paypal' | 'bank_transfer' | 'cash' | 'vnpay',
                description: `Payment for package: ${packageName}`,
                transactionId: transactionId || orderId,
                paidAt: status === 'completed' ? new Date() : undefined,
                metadata: {
                    ...metadata,
                    subscriptionId: subscriptionId,
                    packageId: packageId,
                    packageName: packageName,
                    isPackageSubscription: true
                }
            });

            await bill.save();
            console.log(`Bill created for package subscription: ${bill._id}, Status: ${status}`);
            return bill;
        } catch (error) {
            console.error('Error creating bill for package subscription:', error);
            // Don't throw error - bill creation failure shouldn't break subscription
            return null;
        }
    }

    // Get available packages for teachers
    static async getAvailablePackages(status: string = 'active') {
        const filter: any = {};
        if (status !== 'all') {
            filter.isActive = status === 'active';
        }

        const packages = await PackagePlan.find(filter)
            .select('name description price maxCourses billingCycle features version isActive')
            .sort({ price: 1 });

        return packages.map(pkg => ({
            id: pkg._id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            maxCourses: pkg.maxCourses,
            billingCycle: pkg.billingCycle,
            features: pkg.features || [],
            version: pkg.version || 1,
            isActive: pkg.isActive,
            durationMonths: pkg.billingCycle === 'monthly' ? 1 : 12
        }));
    }

    // Get teacher's current active subscription
    static async getCurrentSubscription(teacherId: string) {
        const subscription = await TeacherPackageSubscription.findOne({
            teacherId,
            status: 'active',
            endAt: { $gt: new Date() }
        }).populate('packageId', 'name description price maxCourses billingCycle features version');

        if (!subscription) return null;

        return {
            id: subscription._id,
            packageId: subscription.packageId,
            status: subscription.status,
            startAt: subscription.startAt,
            endAt: subscription.endAt,
            renewedAt: subscription.renewedAt,
            snapshot: subscription.snapshot,
            daysRemaining: Math.ceil((subscription.endAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        };
    }

    // Get all active subscriptions for a teacher
    static async getActiveSubscriptions(teacherId: string) {
        const subs = await TeacherPackageSubscription.find({
            teacherId,
            status: 'active',
            endAt: { $gt: new Date() }
        }).populate('packageId', 'name description price maxCourses billingCycle features version');

        return subs.map((subscription) => ({
            id: subscription._id,
            packageId: subscription.packageId,
            status: subscription.status,
            startAt: subscription.startAt,
            endAt: subscription.endAt,
            renewedAt: subscription.renewedAt,
            snapshot: subscription.snapshot,
            daysRemaining: Math.ceil((subscription.endAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }));
    }

    // Get teacher's subscription history
    static async getSubscriptionHistory(
        teacherId: string,
        status: string = 'all',
        page: number = 1,
        limit: number = 10
    ) {
        const filter: any = { teacherId };
        if (status !== 'all') {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [subscriptions, total] = await Promise.all([
            TeacherPackageSubscription.find(filter)
                .populate('packageId', 'name description price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            TeacherPackageSubscription.countDocuments(filter)
        ]);

        return {
            subscriptions: subscriptions.map(sub => ({
                id: sub._id,
                packageId: sub.packageId,
                status: sub.status,
                startAt: sub.startAt,
                endAt: sub.endAt,
                renewedAt: sub.renewedAt,
                snapshot: sub.snapshot,
                createdAt: sub.createdAt
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Helper to get client IP (should be passed from controller)
    private static getClientIp(req?: any): string {
        if (req) {
            return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                req.ip ||
                '127.0.0.1';
        }
        return '127.0.0.1';
    }

    // Subscribe to a package
    static async subscribeToPackage(
        teacherId: string,
        packageId: string,
        paymentMethod: string = 'wallet',
        couponCode?: string,
        req?: any // Optional request object to get IP address
    ) {
        // Verify user exists and has appropriate role
        const user = await User.findById(teacherId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if user has teacher role or admin role
        const hasTeacherRole = user.role === 'teacher' ||
            (user.roles && Array.isArray(user.roles) && user.roles.includes('teacher'));
        const hasAdminRole = user.role === 'admin' ||
            (user.roles && Array.isArray(user.roles) && user.roles.includes('admin'));

        if (!hasTeacherRole && !hasAdminRole) {
            throw new Error('Only teachers and admins can subscribe to packages');
        }

        // Get package details
        const pkg = await PackagePlan.findById(packageId);
        if (!pkg) {
            throw new Error('Package not found');
        }
        if (!pkg.isActive) {
            throw new Error('Package is not available for subscription');
        }

        // Check if teacher already has active subscription for the same package
        const existingActiveSamePackage = await TeacherPackageSubscription.findOne({
            teacherId,
            packageId: pkg._id,
            status: 'active',
            endAt: { $gt: new Date() }
        });

        // If already subscribed to the same package and it's still active, renew by one cycle from now
        if (existingActiveSamePackage) {
            const now = new Date();
            const newEndAt = new Date(now);
            if (pkg.billingCycle === 'monthly') newEndAt.setMonth(newEndAt.getMonth() + 1);
            else newEndAt.setFullYear(newEndAt.getFullYear() + 1);

            existingActiveSamePackage.startAt = now;
            existingActiveSamePackage.endAt = newEndAt;
            existingActiveSamePackage.renewedAt = now;
            existingActiveSamePackage.status = 'active';
            await existingActiveSamePackage.save();

            // Create bill for renewal
            const orderId = `PKG_RENEW_${Date.now()}_${teacherId}_${packageId}`;
            await this.createPackageBill(
                teacherId,
                packageId.toString(),
                existingActiveSamePackage.snapshot.name || pkg.name,
                existingActiveSamePackage.snapshot.price || pkg.price,
                paymentMethod,
                existingActiveSamePackage._id.toString(),
                orderId,
                'completed',
                orderId,
                { couponCode, isRenewal: true, autoRenewal: true }
            );

            return {
                id: existingActiveSamePackage._id,
                packageId: existingActiveSamePackage.packageId,
                status: existingActiveSamePackage.status,
                startAt: existingActiveSamePackage.startAt,
                endAt: existingActiveSamePackage.endAt,
                renewedAt: existingActiveSamePackage.renewedAt,
                snapshot: existingActiveSamePackage.snapshot,
                renewed: true,
                message: 'Subscription renewed for one billing cycle'
            };
        }

        // Allow multiple package subscriptions - no need to cancel existing ones

        // Calculate subscription period
        const startAt = new Date();
        const endAt = new Date(startAt);
        if (pkg.billingCycle === 'monthly') {
            endAt.setMonth(endAt.getMonth() + 1);
        } else {
            endAt.setFullYear(endAt.getFullYear() + 1);
        }

        // Process payment based on payment method
        if (paymentMethod === 'vnpay') {
            // Check if we should use mock payment (for development/testing)
            const useMockPayment = process.env.NODE_ENV === 'development' || process.env.VNPAY_USE_MOCK === 'true';

            if (useMockPayment) {
                // Mock payment - create active subscription directly
                const orderId = `MOCK_PKG_${Date.now()}_${teacherId}_${packageId}`;
                const subscription = await TeacherPackageSubscription.create({
                    teacherId,
                    packageId: pkg._id,
                    status: 'active',
                    startAt,
                    endAt,
                    snapshot: {
                        name: pkg.name,
                        maxCourses: pkg.maxCourses,
                        billingCycle: pkg.billingCycle,
                        features: pkg.features || [],
                        version: pkg.version || 1,
                        price: pkg.price,
                    },
                    paymentMethod: 'vnpay',
                    couponCode,
                    metadata: {
                        mockPayment: true,
                        mockOrderId: orderId
                    }
                });

                // Create bill for mock payment
                await this.createPackageBill(
                    teacherId,
                    packageId.toString(),
                    pkg.name,
                    pkg.price,
                    'vnpay',
                    subscription._id.toString(),
                    orderId,
                    'completed',
                    orderId,
                    { mockPayment: true, couponCode }
                );

                return {
                    id: subscription._id,
                    packageId: subscription.packageId,
                    status: 'active',
                    startAt: subscription.startAt,
                    endAt: subscription.endAt,
                    snapshot: subscription.snapshot,
                    paymentMethod,
                    couponCode,
                    mockPayment: true,
                    message: 'Mock payment successful - subscription activated'
                };
            } else {
                // Real VNPay payment
                const orderId = `PKG_${Date.now()}_${teacherId}_${packageId}`;
                const subscription = await TeacherPackageSubscription.create({
                    teacherId,
                    packageId: pkg._id,
                    status: 'pending',
                    startAt,
                    endAt,
                    snapshot: {
                        name: pkg.name,
                        maxCourses: pkg.maxCourses,
                        billingCycle: pkg.billingCycle,
                        features: pkg.features || [],
                        version: pkg.version || 1,
                        price: pkg.price,
                    },
                    paymentMethod,
                    couponCode
                });

                // Create bill with pending status for VNPay payment
                await this.createPackageBill(
                    teacherId,
                    packageId.toString(),
                    pkg.name,
                    pkg.price,
                    'vnpay',
                    subscription._id.toString(),
                    orderId,
                    'pending',
                    undefined,
                    { vnpayOrderId: orderId, couponCode }
                );

                // Generate VNPay payment URL using shared service
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                const returnUrl = `${frontendUrl}/teacher/advanced/packages?payment=success&orderId=${orderId}`;
                const ipnUrl = process.env.VNPAY_IPN_URL || `${process.env.BACKEND_URL || 'https://lms-backend-cf11.onrender.com'}/api/client/teacher-packages/vnpay/callback`;
                
                // Get client IP address
                const clientIp = this.getClientIp(req);
                
                const paymentUrl = buildVnpayPaymentUrl({
                    orderId: orderId,
                    amount: pkg.price,
                    orderInfo: `Thanh toan goi: ${pkg.name}`,
                    ipAddr: clientIp,
                    returnUrl: returnUrl,
                    ipnUrl: ipnUrl,
                    email: user.email,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
                    expireMinutes: 15
                });

                return {
                    id: subscription._id,
                    packageId: subscription.packageId,
                    status: 'pending',
                    startAt: subscription.startAt,
                    endAt: subscription.endAt,
                    snapshot: subscription.snapshot,
                    paymentMethod,
                    couponCode,
                    paymentUrl
                };
            }
        } else {
            // For wallet or other methods, create active subscription directly
            const orderId = `PKG_${Date.now()}_${teacherId}_${packageId}`;
            const subscription = await TeacherPackageSubscription.create({
                teacherId,
                packageId: pkg._id,
                status: 'active',
                startAt,
                endAt,
                snapshot: {
                    name: pkg.name,
                    maxCourses: pkg.maxCourses,
                    billingCycle: pkg.billingCycle,
                    features: pkg.features || [],
                    version: pkg.version || 1,
                    price: pkg.price,
                },
                paymentMethod,
                couponCode
            });

            // Create bill with completed status for wallet payment
            await this.createPackageBill(
                teacherId,
                packageId.toString(),
                pkg.name,
                pkg.price,
                paymentMethod,
                subscription._id.toString(),
                orderId,
                'completed',
                orderId,
                { couponCode }
            );

            return {
                id: subscription._id,
                packageId: subscription.packageId,
                status: subscription.status,
                startAt: subscription.startAt,
                endAt: subscription.endAt,
                snapshot: subscription.snapshot,
                paymentMethod,
                couponCode
            };
        }
    }

    // Renew current subscription
    static async renewSubscription(
        teacherId: string,
        paymentMethod: string = 'wallet',
        couponCode?: string
    ) {
        const currentSubscription = await this.getCurrentSubscription(teacherId);
        if (!currentSubscription) {
            throw new Error('No active subscription found to renew');
        }

        // Get package details for bill creation
        const subscriptionDoc = await TeacherPackageSubscription.findById(currentSubscription.id).populate('packageId');
        const pkg = subscriptionDoc?.packageId as any;

        // Calculate new period based on current snapshot
        const now = new Date();
        const newEndAt = new Date(now);
        if (currentSubscription.snapshot.billingCycle === 'monthly') {
            newEndAt.setMonth(newEndAt.getMonth() + 1);
        } else {
            newEndAt.setFullYear(newEndAt.getFullYear() + 1);
        }

        // Update subscription
        const subscription = await TeacherPackageSubscription.findByIdAndUpdate(
            currentSubscription.id,
            {
                startAt: now,
                endAt: newEndAt,
                renewedAt: now,
                status: 'active'
            },
            { new: true }
        );

        // Create bill for renewal
        if (subscription && pkg) {
            const orderId = `PKG_RENEW_${Date.now()}_${teacherId}_${pkg._id}`;
            await this.createPackageBill(
                teacherId,
                pkg._id.toString(),
                currentSubscription.snapshot.name || pkg.name,
                currentSubscription.snapshot.price || pkg.price,
                paymentMethod,
                subscription._id.toString(),
                orderId,
                'completed',
                orderId,
                { couponCode, isRenewal: true }
            );
        }

        return {
            id: subscription!._id,
            packageId: subscription!.packageId,
            status: subscription!.status,
            startAt: subscription!.startAt,
            endAt: subscription!.endAt,
            renewedAt: subscription!.renewedAt,
            snapshot: subscription!.snapshot,
            paymentMethod,
            couponCode
        };
    }

    // Cancel current subscription
    static async cancelSubscription(teacherId: string) {
        const currentSubscription = await this.getCurrentSubscription(teacherId);
        if (!currentSubscription) {
            throw new Error('No active subscription found to cancel');
        }

        const subscription = await TeacherPackageSubscription.findByIdAndUpdate(
            currentSubscription.id,
            { status: 'cancelled' },
            { new: true }
        );

        return {
            id: subscription!._id,
            packageId: subscription!.packageId,
            status: subscription!.status,
            cancelledAt: new Date()
        };
    }

    // Cancel specific package subscription
    static async cancelPackageSubscription(teacherId: string, packageId: string) {
        const subscription = await TeacherPackageSubscription.findOne({
            teacherId,
            packageId,
            status: 'active',
            endAt: { $gt: new Date() }
        });

        if (!subscription) {
            throw new Error('No active subscription found for this package');
        }

        const updatedSubscription = await TeacherPackageSubscription.findByIdAndUpdate(
            subscription._id,
            { status: 'cancelled' },
            { new: true }
        );

        return {
            id: updatedSubscription!._id,
            packageId: updatedSubscription!.packageId,
            status: updatedSubscription!.status,
            cancelledAt: new Date()
        };
    }

    // Get package details
    static async getPackageDetails(packageId: string) {
        const pkg = await PackagePlan.findById(packageId)
            .select('name description price maxCourses billingCycle features version isActive createdAt updatedAt');

        if (!pkg) return null;

        return {
            id: pkg._id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            maxCourses: pkg.maxCourses,
            billingCycle: pkg.billingCycle,
            features: pkg.features || [],
            version: pkg.version || 1,
            isActive: pkg.isActive,
            durationMonths: pkg.billingCycle === 'monthly' ? 1 : 12,
            createdAt: pkg.createdAt,
            updatedAt: pkg.updatedAt
        };
    }
}

// Removed duplicate generateVNPayPaymentUrl function - now using shared buildVnpayPaymentUrl service
