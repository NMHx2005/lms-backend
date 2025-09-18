import { PackagePlan } from '../../shared/models/extended/TeacherPackage';
import { TeacherPackageSubscription } from '../../shared/models/extended/TeacherPackage';
import { User } from '../../shared/models/core/User';
import crypto from 'crypto';

export class TeacherPackageService {
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

    // Subscribe to a package
    static async subscribeToPackage(
        teacherId: string,
        packageId: string,
        paymentMethod: string = 'wallet',
        couponCode?: string
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
                        mockOrderId: `MOCK_PKG_${Date.now()}_${teacherId}_${packageId}`
                    }
                });

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

                // Generate VNPay payment URL
                const paymentUrl = generateVNPayPaymentUrl({
                    orderId: `PKG_${Date.now()}_${teacherId}_${packageId}`,
                    amount: pkg.price,
                    packageName: pkg.name,
                    teacherId,
                    subscriptionId: subscription._id.toString(),
                    userEmail: user.email,
                    userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer'
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

// Helper function to generate VNPay payment URL for package subscription
function generateVNPayPaymentUrl(params: {
    orderId: string;
    amount: number;
    packageName: string;
    teacherId: string;
    subscriptionId: string;
    userEmail: string;
    userName: string;
}) {
    const baseUrl = process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const tmnCode = process.env.VNPAY_TMN_CODE || 'J7FE4EZ7';
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'R2AVUE6ZP6SNYCGWBUXMYM4X507IPVNV';

    // Create payment URL with required VNPay parameters
    const url = new URL(baseUrl);

    // Required parameters
    url.searchParams.set('vnp_Version', '2.1.0');
    url.searchParams.set('vnp_Command', 'pay');
    url.searchParams.set('vnp_TmnCode', tmnCode);
    url.searchParams.set('vnp_Amount', (params.amount * 100).toString()); // Convert to smallest currency unit
    url.searchParams.set('vnp_CurrCode', 'VND');
    url.searchParams.set('vnp_TxnRef', params.orderId);
    url.searchParams.set('vnp_OrderInfo', `Thanh toan goi: ${params.packageName}`);
    url.searchParams.set('vnp_OrderType', 'other');
    url.searchParams.set('vnp_Locale', 'vn');
    url.searchParams.set('vnp_ReturnUrl', process.env.VNPAY_RETURN_URL || 'http://localhost:3000/vnpay/return-url');
    url.searchParams.set('vnp_IpnUrl', process.env.VNPAY_IPN_URL || 'https://lms-backend-cf11.onrender.com/api/client/payments/vnpay/ipn');

    // Add custom metadata for package subscription
    url.searchParams.set('vnp_Email', params.userEmail);
    url.searchParams.set('vnp_Name', params.userName);

    // Add timestamp
    const date = new Date();
    const createDate = date.toISOString().split('T')[0].split('-').join('');
    url.searchParams.set('vnp_CreateDate', createDate);

    // Add expire time (15 minutes from now)
    const expireDate = new Date(date.getTime() + 15 * 60 * 1000);
    const expireDateStr = expireDate.toISOString().split('T')[0].split('-').join('');
    url.searchParams.set('vnp_ExpireDate', expireDateStr);

    // Generate checksum hash
    const queryString = url.searchParams.toString();
    const hashData = queryString;
    const hmac = crypto.createHmac('sha512', hashSecret);
    hmac.update(hashData);
    const vnp_SecureHash = hmac.digest('hex');

    // Add secure hash
    url.searchParams.set('vnp_SecureHash', vnp_SecureHash);

    return url.toString();
}
