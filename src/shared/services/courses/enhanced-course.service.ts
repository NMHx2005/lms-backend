import Course, { ICourse } from '../../models/core/Course';
import { Types } from 'mongoose';
import { AppError } from '../../utils/appError';

export interface CourseFilters {
  category?: string;
  subcategory?: string;
  difficulty?: string;
  targetAudience?: string[];
  ageGroup?: string;
  hasSubtitles?: boolean;
  hasLiveSessions?: boolean;
  deliveryMethod?: string;
  pricingModel?: string;
  hasFreeTrial?: boolean;
  hasCertification?: boolean;
  minPrice?: number;
  maxPrice?: number;
  language?: string;
  gdprCompliant?: boolean;
  accessibilityCompliant?: boolean;
}

export interface CourseAnalytics {
  viewCount: number;
  searchRanking: number;
  conversionRate: number;
  engagementScore: number;
  retentionRate: number;
  completionTime: number;
  dropoffPoints: string[];
  popularSections: string[];
}

export interface CourseSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  structuredData: any;
}

export interface CourseLocalization {
  originalLanguage: string;
  availableLanguages: string[];
  hasSubtitles: boolean;
  subtitleLanguages: string[];
  hasDubbing: boolean;
  dubbedLanguages: string[];
}

export class EnhancedCourseService {
  /**
   * Get courses with enhanced filters
   */
  async getCoursesWithFilters(filters: CourseFilters = {}, page: number = 1, limit: number = 20) {
    try {
      const query: any = {};

      // Apply filters
      if (filters.category) query.category = filters.category;
      if (filters.subcategory) query.subcategory = filters.subcategory;
      if (filters.difficulty) query.difficulty = filters.difficulty;
      if (filters.targetAudience && filters.targetAudience.length > 0) {
        query.targetAudience = { $in: filters.targetAudience };
      }
      if (filters.ageGroup) query.ageGroup = filters.ageGroup;
      if (filters.hasSubtitles !== undefined) query['accessibility.hasSubtitles'] = filters.hasSubtitles;
      if (filters.hasLiveSessions !== undefined) query['contentDelivery.hasLiveSessions'] = filters.hasLiveSessions;
      if (filters.deliveryMethod) query['contentDelivery.deliveryMethod'] = filters.deliveryMethod;
      if (filters.pricingModel) query['monetization.pricingModel'] = filters.pricingModel;
      if (filters.hasFreeTrial !== undefined) query['monetization.hasFreeTrial'] = filters.hasFreeTrial;
      if (filters.hasCertification !== undefined) query['assessment.hasCertification'] = filters.hasCertification;
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query.price = {};
        if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
      }
      if (filters.language) query['localization.originalLanguage'] = filters.language;
      if (filters.gdprCompliant !== undefined) query['compliance.gdprCompliant'] = filters.gdprCompliant;
      if (filters.accessibilityCompliant !== undefined) query['compliance.accessibilityCompliant'] = filters.accessibilityCompliant;

      const skip = (page - 1) * limit;

      const [courses, total] = await Promise.all([
        Course.find(query)
          .populate('instructorId', 'firstName lastName email avatar')
          .sort({ 'analytics.viewCount': -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean() as unknown as ICourse[],
        Course.countDocuments(query)
      ]);

      return {
        courses,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new AppError('Failed to fetch courses with filters', 500);
    }
  }

  /**
   * Update course analytics
   */
  async updateCourseAnalytics(courseId: string, analytics: Partial<CourseAnalytics>) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // Update analytics fields
      if (analytics.viewCount !== undefined) course.analytics.viewCount = analytics.viewCount;
      if (analytics.searchRanking !== undefined) course.analytics.searchRanking = analytics.searchRanking;
      if (analytics.conversionRate !== undefined) course.analytics.conversionRate = analytics.conversionRate;
      if (analytics.engagementScore !== undefined) course.analytics.engagementScore = analytics.engagementScore;
      if (analytics.retentionRate !== undefined) course.analytics.retentionRate = analytics.retentionRate;
      if (analytics.completionTime !== undefined) course.analytics.completionTime = analytics.completionTime;
      if (analytics.dropoffPoints) course.analytics.dropoffPoints = analytics.dropoffPoints;
      if (analytics.popularSections) course.analytics.popularSections = analytics.popularSections;

      await course.save();
      return course;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update course analytics', 500);
    }
  }

  /**
   * Update course SEO
   */
  async updateCourseSEO(courseId: string, seo: CourseSEO) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      course.seo = seo;
      await course.save();
      return course;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update course SEO', 500);
    }
  }

  /**
   * Update course localization
   */
  async updateCourseLocalization(courseId: string, localization: CourseLocalization) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      course.localization = localization;
      await course.save();
      return course;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update course localization', 500);
    }
  }

  /**
   * Update course compliance
   */
  async updateCourseCompliance(courseId: string, compliance: any, userId: string) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // Update compliance fields
      if (compliance.gdprCompliant !== undefined) course.compliance.gdprCompliant = compliance.gdprCompliant;
      if (compliance.accessibilityCompliant !== undefined) course.compliance.accessibilityCompliant = compliance.accessibilityCompliant;
      if (compliance.industryStandards) course.compliance.industryStandards = compliance.industryStandards;
      if (compliance.certifications) course.compliance.certifications = compliance.certifications;

      // Add audit trail entry
      course.compliance.auditTrail.push({
        action: 'compliance_updated',
        performedBy: new Types.ObjectId(userId),
        performedAt: new Date(),
        details: 'Course compliance settings updated'
      });

      await course.save();
      return course;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update course compliance', 500);
    }
  }

  /**
   * Get course recommendations based on user preferences
   */
  async getCourseRecommendations(userId: string, preferences: any, limit: number = 10) {
    try {
      const query: any = { isPublished: true, isApproved: true };

      // Apply user preferences
      if (preferences.categories && preferences.categories.length > 0) {
        query.category = { $in: preferences.categories };
      }
      if (preferences.difficulty) {
        query.difficulty = preferences.difficulty;
      }
      if (preferences.targetAudience && preferences.targetAudience.length > 0) {
        query.targetAudience = { $in: preferences.targetAudience };
      }
      if (preferences.hasSubtitles !== undefined) {
        query['accessibility.hasSubtitles'] = preferences.hasSubtitles;
      }
      if (preferences.hasLiveSessions !== undefined) {
        query['contentDelivery.hasLiveSessions'] = preferences.hasLiveSessions;
      }
      if (preferences.maxPrice) {
        query.price = { $lte: preferences.maxPrice };
      }

      const courses = await Course.find(query)
        .populate('instructorId', 'firstName lastName email avatar')
        .sort({ 'analytics.engagementScore': -1, 'analytics.viewCount': -1 })
        .limit(limit)
        .lean() as unknown as ICourse[];

      return courses;
    } catch (error) {
      throw new AppError('Failed to get course recommendations', 500);
    }
  }

  /**
   * Get course statistics by category
   */
  async getCourseStatsByCategory() {
    try {
      const stats = await Course.aggregate([
        { $match: { isPublished: true, isApproved: true } },
        {
          $group: {
            _id: '$category',
            totalCourses: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            averageRating: { $avg: '$averageRating' },
            totalStudents: { $sum: '$totalStudents' },
            totalRevenue: { $sum: { $multiply: ['$price', '$totalStudents'] } },
            coursesWithCertification: {
              $sum: { $cond: ['$assessment.hasCertification', 1, 0] }
            },
            coursesWithLiveSessions: {
              $sum: { $cond: ['$contentDelivery.hasLiveSessions', 1, 0] }
            }
          }
        },
        { $sort: { totalCourses: -1 } }
      ]);

      return stats;
    } catch (error) {
      throw new AppError('Failed to get course statistics by category', 500);
    }
  }

  /**
   * Get accessibility statistics
   */
  async getAccessibilityStats() {
    try {
      const stats = await Course.aggregate([
        { $match: { isPublished: true, isApproved: true } },
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            coursesWithSubtitles: {
              $sum: { $cond: ['$accessibility.hasSubtitles', 1, 0] }
            },
            coursesWithAudioDescription: {
              $sum: { $cond: ['$accessibility.hasAudioDescription', 1, 0] }
            },
            coursesWithSignLanguage: {
              $sum: { $cond: ['$accessibility.hasSignLanguage', 1, 0] }
            },
            coursesSupportingScreenReaders: {
              $sum: { $cond: ['$accessibility.supportsScreenReaders', 1, 0] }
            },
            coursesWithHighContrast: {
              $sum: { $cond: ['$accessibility.hasHighContrast', 1, 0] }
            },
            gdprCompliantCourses: {
              $sum: { $cond: ['$compliance.gdprCompliant', 1, 0] }
            },
            accessibilityCompliantCourses: {
              $sum: { $cond: ['$compliance.accessibilityCompliant', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalCourses: 0,
        coursesWithSubtitles: 0,
        coursesWithAudioDescription: 0,
        coursesWithSignLanguage: 0,
        coursesSupportingScreenReaders: 0,
        coursesWithHighContrast: 0,
        gdprCompliantCourses: 0,
        accessibilityCompliantCourses: 0
      };
    } catch (error) {
      throw new AppError('Failed to get accessibility statistics', 500);
    }
  }

  /**
   * Get monetization statistics
   */
  async getMonetizationStats() {
    try {
      const stats = await Course.aggregate([
        { $match: { isPublished: true, isApproved: true } },
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            oneTimePricing: {
              $sum: { $cond: [{ $eq: ['$monetization.pricingModel', 'one-time'] }, 1, 0] }
            },
            subscriptionPricing: {
              $sum: { $cond: [{ $eq: ['$monetization.pricingModel', 'subscription'] }, 1, 0] }
            },
            freemiumPricing: {
              $sum: { $cond: [{ $eq: ['$monetization.pricingModel', 'freemium'] }, 1, 0] }
            },
            payPerLessonPricing: {
              $sum: { $cond: [{ $eq: ['$monetization.pricingModel', 'pay-per-lesson'] }, 1, 0] }
            },
            coursesWithFreeTrial: {
              $sum: { $cond: ['$monetization.hasFreeTrial', 1, 0] }
            },
            coursesWithMoneyBackGuarantee: {
              $sum: { $cond: ['$monetization.hasMoneyBackGuarantee', 1, 0] }
            },
            coursesWithInstallmentPlan: {
              $sum: { $cond: ['$monetization.installmentPlan.enabled', 1, 0] }
            },
            averagePrice: { $avg: '$price' },
            totalRevenue: { $sum: { $multiply: ['$price', '$totalStudents'] } }
          }
        }
      ]);

      return stats[0] || {
        totalCourses: 0,
        oneTimePricing: 0,
        subscriptionPricing: 0,
        freemiumPricing: 0,
        payPerLessonPricing: 0,
        coursesWithFreeTrial: 0,
        coursesWithMoneyBackGuarantee: 0,
        coursesWithInstallmentPlan: 0,
        averagePrice: 0,
        totalRevenue: 0
      };
    } catch (error) {
      throw new AppError('Failed to get monetization statistics', 500);
    }
  }

  /**
   * Search courses with advanced filters
   */
  async searchCourses(searchTerm: string, filters: CourseFilters = {}, page: number = 1, limit: number = 20) {
    try {
      const query: any = {
        $and: [
          { isPublished: true, isApproved: true },
          {
            $or: [
              { title: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } },
              { shortDescription: { $regex: searchTerm, $options: 'i' } },
              { tags: { $in: [new RegExp(searchTerm, 'i')] } },
              { category: { $regex: searchTerm, $options: 'i' } },
              { subcategory: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      };

      // Apply additional filters
      if (filters.category) query.$and.push({ category: filters.category });
      if (filters.difficulty) query.$and.push({ difficulty: filters.difficulty });
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceQuery: any = {};
        if (filters.minPrice !== undefined) priceQuery.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined) priceQuery.$lte = filters.maxPrice;
        query.$and.push({ price: priceQuery });
      }

      const skip = (page - 1) * limit;

      const [courses, total] = await Promise.all([
        Course.find(query)
          .populate('instructorId', 'firstName lastName email avatar')
          .sort({ 'analytics.searchRanking': -1, 'analytics.viewCount': -1 })
          .skip(skip)
          .limit(limit)
          .lean() as unknown as ICourse[],
        Course.countDocuments(query)
      ]);

      return {
        courses,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        searchTerm
      };
    } catch (error) {
      throw new AppError('Failed to search courses', 500);
    }
  }
}

export default new EnhancedCourseService();
