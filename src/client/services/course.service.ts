import { Course as CourseModel, Enrollment as EnrollmentModel, User as UserModel, Bill as BillModel, LessonProgress as LessonProgressModel } from '../../shared/models';
import {
  CourseListResponse,
  CourseSearchFilters,
  Course,
  EnrollmentRequest,
  CourseContent,
  CourseProgress
} from '../interfaces/course.interface';

export class ClientCourseService {
  // Get published and approved courses with pagination and filters
  static async getPublishedCourses(
    page: number = 1,
    limit: number = 12,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc',
    filters: CourseSearchFilters = {}
  ): Promise<CourseListResponse> {
    const skip = (page - 1) * limit;

    // Build query for published and approved courses only
    const query: any = {
      isPublished: true,
      isApproved: true
    };

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { domain: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    if (filters.domain) {
      query.domain = filters.domain;
    }

    if (filters.level) {
      query.level = filters.level;
    }

    if (filters.instructorId) {
      query.instructorId = filters.instructorId;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    if (filters.isFree !== undefined) {
      query.price = filters.isFree ? 0 : { $gt: 0 };
    }

    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }

    if (filters.language) {
      query.language = filters.language;
    }

    if (filters.certificate !== undefined) {
      query.certificate = filters.certificate;
    }

    // Handle rating filter
    if (filters.minRating !== undefined) {
      query.averageRating = { $gte: filters.minRating };
    }

    // Handle duration filter
    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      query.totalDuration = {};
      if (filters.minDuration !== undefined) query.totalDuration.$gte = filters.minDuration;
      if (filters.maxDuration !== undefined) query.totalDuration.$lte = filters.maxDuration;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [coursesData, total] = await Promise.all([
      CourseModel.find(query)
        .populate('instructorId', 'name email avatar')
        .populate('sections', 'title description')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CourseModel.countDocuments(query)
    ]);

    // Map to match Course interface
    const courses: Course[] = coursesData.map(course => ({
      _id: course._id.toString(),
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      thumbnail: course.thumbnail,
      domain: course.domain,
      level: course.level,
      totalDuration: course.totalDuration || 0,
      price: course.price,
      originalPrice: course.originalPrice,
      discountPercentage: course.discountPercentage,
      isPublished: course.isPublished,
      isApproved: course.isApproved,
      isFeatured: course.isFeatured,
      instructorId: course.instructorId._id.toString(),
      instructorName: (course.instructorId as any).name,
      instructorEmail: (course.instructorId as any).email,
      instructorAvatar: (course.instructorId as any).avatar,
      totalStudents: course.totalStudents || 0,
      averageRating: course.averageRating || 0,
      totalLessons: course.totalLessons || 0,
      tags: course.tags || [],
      prerequisites: course.prerequisites || [],
      benefits: course.benefits || [],
      relatedLinks: course.relatedLinks || [],
      language: course.language || 'English',
      certificate: course.certificate || false,
      maxStudents: course.maxStudents,
      startDate: course.startDate,
      endDate: course.endDate,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      publishedAt: course.publishedAt,
      approvedAt: course.approvedAt
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      courses,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Get course by ID (published and approved only)
  static async getCourseById(courseId: string, userId?: string) {
    // First, find the course without populate to check instructorId
    const courseDoc = await CourseModel.findById(courseId).lean();

    if (!courseDoc) {
      throw new Error('Course not found or not available');
    }

    // Check access permissions
    const isInstructor = userId && courseDoc.instructorId &&
      courseDoc.instructorId.toString() === userId.toString();

    const isPublicCourse = courseDoc.isPublished && courseDoc.isApproved;

    // Debug logging
    console.log('🔍 Access Check:', {
      courseId,
      userId,
      instructorId: courseDoc.instructorId?.toString(),
      isInstructor,
      isPublished: courseDoc.isPublished,
      isApproved: courseDoc.isApproved,
      isPublicCourse
    });

    // Allow access if:
    // 1. User is the instructor (can see draft/pending courses)
    // 2. Course is published and approved (public access)
    if (!isInstructor && !isPublicCourse) {
      console.log('❌ Access denied');
      throw new Error('Course not found or not available');
    }

    console.log('✅ Access granted');

    // Now populate and return
    const course = await CourseModel.findById(courseId)
      .populate('instructorId', 'firstName lastName email avatar bio')
      .lean();

    return course;
  }

  // Get course content (for enrolled students)
  static async getCourseContent(courseId: string, userId: string): Promise<CourseContent> {
    // Check if user is enrolled
    const enrollment = await EnrollmentModel.findOne({
      courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access course content');
    }

    const course = await CourseModel.findById(courseId)
      .populate('sections')
      .populate('lessons')
      .populate('assignments');

    if (!course) {
      throw new Error('Course not found');
    }

    return {
      course,
      enrollment,
      progress: enrollment.progress || 0,
      completedLessons: [], // Will be implemented when lesson completion tracking is added
      currentLesson: enrollment.currentLesson?.toString()
    };
  }

  // Search courses
  static async searchCourses(
    searchTerm: string,
    limit: number = 10,
    filters: CourseSearchFilters = {}
  ) {
    const query: any = {
      isPublished: true,
      isApproved: true,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { domain: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };

    // Apply additional filters
    if (filters.domain) query.domain = filters.domain;
    if (filters.level) query.level = filters.level;
    if (filters.isFree !== undefined) {
      query.price = filters.isFree ? 0 : { $gt: 0 };
    }

    const courses = await CourseModel.find(query)
      .populate('instructorId', 'name')
      .limit(limit);

    return courses;
  }

  // Get course categories
  static async getCourseCategories() {
    const categories = await CourseModel.aggregate([
      { $match: { isPublished: true, isApproved: true } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return categories.map(cat => ({
      domain: cat._id,
      count: cat.count
    }));
  }

  // Get featured courses
  static async getFeaturedCourses(limit: number = 6) {
    const courses = await CourseModel.find({
      isPublished: true,
      isApproved: true,
      isFeatured: true
    })
      .populate('instructorId', 'name')
      .sort({ totalStudents: -1, averageRating: -1 })
      .limit(limit);

    return courses;
  }

  // Get popular courses
  static async getPopularCourses(limit: number = 8) {
    const courses = await CourseModel.find({
      isPublished: true,
      isApproved: true
    })
      .populate('instructorId', 'name')
      .sort({ totalStudents: -1, averageRating: -1 })
      .limit(limit);

    return courses;
  }

  // Get courses by instructor
  static async getCoursesByInstructor(instructorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      CourseModel.find({
        instructorId,
        isPublished: true,
        isApproved: true
      })
        .populate('instructorId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CourseModel.countDocuments({
        instructorId,
        isPublished: true,
        isApproved: true
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      courses,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Get related courses
  static async getRelatedCourses(courseId: string, limit: number = 4) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const relatedCourses = await CourseModel.find({
      _id: { $ne: courseId },
      domain: course.domain,
      isPublished: true,
      isApproved: true
    })
      .populate('instructorId', 'name')
      .limit(limit);

    return relatedCourses;
  }

  // Get course progress for enrolled user
  static async getCourseProgress(courseId: string, userId: string): Promise<CourseProgress> {
    const enrollment = await EnrollmentModel.findOne({
      courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You are not enrolled in this course');
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const totalLessons = course.totalLessons || 0;

    // Calculate actual completed lessons count from LessonProgress
    const completedLessonsCount = await LessonProgressModel.countDocuments({
      studentId: userId,
      courseId: courseId,
      isCompleted: true
    });

    // Use enrollment.progress (updated when lessons are completed) or calculate it
    // Enrollment.progress should already be accurate from markLessonCompleted
    const progress = enrollment.progress || (totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0);

    return {
      courseId,
      userId,
      progress,
      completedLessons: completedLessonsCount,
      totalLessons,
      currentLesson: enrollment.currentLesson?.toString(),
      lastAccessed: enrollment.updatedAt,
      enrollmentDate: enrollment.enrolledAt,
      status: enrollment.isCompleted ? 'completed' : 'active'
    };
  }

  // Get course recommendations based on user preferences
  static async getCourseRecommendations(userId: string, limit: number = 6) {
    // Get user's enrolled courses to understand preferences
    const userEnrollments = await EnrollmentModel.find({ studentId: userId, isActive: true })
      .populate('courseId', 'domain level tags');

    if (userEnrollments.length === 0) {
      // If no enrollments, return popular courses
      return this.getPopularCourses(limit);
    }

    // Extract user preferences
    const domains = [...new Set(userEnrollments.map(e => (e.courseId as any).domain))];
    const levels = [...new Set(userEnrollments.map(e => (e.courseId as any).level))];
    const tags = userEnrollments
      .flatMap(e => (e.courseId as any).tags || [])
      .filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index);

    // Build recommendation query
    const query: any = {
      isPublished: true,
      isApproved: true,
      _id: { $nin: userEnrollments.map(e => e.courseId) }
    };

    if (domains.length > 0) {
      query.$or = [
        { domain: { $in: domains } },
        { tags: { $in: tags } }
      ];
    }

    const recommendations = await CourseModel.find(query)
      .populate('instructorId', 'name')
      .sort({ totalStudents: -1, averageRating: -1 })
      .limit(limit);

    return recommendations;
  }

  // Get filter options for advanced search
  static async getFilterOptions() {
    try {
      const [domains, levels, languages, tags, instructors] = await Promise.all([
        CourseModel.distinct('domain', { isPublished: true, isApproved: true }),
        CourseModel.distinct('level', { isPublished: true, isApproved: true }),
        CourseModel.distinct('language', { isPublished: true, isApproved: true }),
        CourseModel.distinct('tags', { isPublished: true, isApproved: true }),
        CourseModel.distinct('instructorId', { isPublished: true, isApproved: true })
      ]);

      // Get instructor details
      const instructorDetails = await UserModel.find(
        { _id: { $in: instructors } },
        'name email avatar bio'
      ).lean();

      return {
        domains: domains.filter(Boolean).sort(),
        levels: levels.filter(Boolean).sort(),
        languages: languages.filter(Boolean).sort(),
        tags: tags.filter(Boolean).sort(),
        instructors: instructorDetails.map(instructor => ({
          id: instructor._id.toString(),
          name: instructor.name,
          email: instructor.email,
          avatar: instructor.avatar,
          bio: instructor.bio
        }))
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      throw error;
    }
  }

  // Get popular tags
  static async getPopularTags(limit: number = 20) {
    try {
      const tags = await CourseModel.aggregate([
        { $match: { isPublished: true, isApproved: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return tags.map(tag => ({
        name: tag._id,
        count: tag.count
      }));
    } catch (error) {
      console.error('Error getting popular tags:', error);
      throw error;
    }
  }

  // ========== TEACHER COURSE MANAGEMENT ==========

  /**
   * Get teacher's single course by ID (for editing)
   */
  static async getTeacherCourseById(courseId: string, teacherId: string) {
    const course = await CourseModel.findOne({
      _id: courseId,
      instructorId: teacherId
    })
      .populate('instructorId', 'firstName lastName email avatar bio')
      .lean();

    if (!course) {
      throw new Error('Course not found or you do not have permission to view it');
    }

    return course;
  }

  /**
   * Get teacher's courses with filters
   */
  static async getTeacherCourses(teacherId: string, filters: any) {
    const { page, limit, status, search, sortBy, sortOrder } = filters;
    const skip = (page - 1) * limit;

    const query: any = { instructorId: teacherId };

    if (status && status !== 'all') {
      if (status === 'draft') {
        query.status = 'draft';
      } else if (status === 'published') {
        query.status = 'published';
      } else if (status === 'pending') {
        query.status = 'submitted';
      } else if (status === 'approved') {
        query.status = 'approved';
      } else if (status === 'rejected') {
        query.status = 'rejected';
      } else {
        // Use status field directly for other values
        query.status = status;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } }
      ];
    }

    const [courses, total] = await Promise.all([
      CourseModel.find(query)
        .select('title thumbnail domain level price status hasUnsavedChanges isPublished isApproved totalStudents averageRating createdAt updatedAt')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(query)
    ]);

    // Get sections and lessons count for each course
    const coursesWithCounts = await Promise.all(
      courses.map(async (course: any) => {
        const sections = await CourseModel.aggregate([
          { $match: { _id: course._id } },
          { $lookup: { from: 'sections', localField: '_id', foreignField: 'courseId', as: 'sections' } },
          { $unwind: { path: '$sections', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'lessons',
              localField: 'sections._id',
              foreignField: 'sectionId',
              as: 'sections.lessons'
            }
          },
          {
            $group: {
              _id: '$_id',
              sectionsCount: { $sum: 1 },
              lessonsCount: { $sum: { $size: '$sections.lessons' } }
            }
          }
        ]);

        const counts = sections[0] || { sectionsCount: 0, lessonsCount: 0 };

        return {
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail || '/images/default-course.png',
          domain: course.domain,
          level: course.level,
          price: course.price,
          status: course.status || 'draft', // Use status field from database
          hasUnsavedChanges: course.hasUnsavedChanges || false,
          studentsCount: course.totalStudents || 0,
          rating: course.averageRating || 0,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          sectionsCount: counts.sectionsCount,
          lessonsCount: counts.lessonsCount
        };
      })
    );

    return {
      courses: coursesWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get teacher course statistics
   */
  static async getTeacherCourseStats(teacherId: string) {
    const [total, published, draft, pending, totalStudents, revenue] = await Promise.all([
      CourseModel.countDocuments({ instructorId: teacherId }),
      CourseModel.countDocuments({ instructorId: teacherId, status: 'published' }),
      CourseModel.countDocuments({ instructorId: teacherId, status: 'draft' }),
      CourseModel.countDocuments({ instructorId: teacherId, status: 'submitted' }),
      CourseModel.aggregate([
        { $match: { instructorId: teacherId } },
        { $group: { _id: null, total: { $sum: '$totalStudents' } } }
      ]),
      BillModel.aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        {
          $match: {
            'course.instructorId': teacherId,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    return {
      total,
      published,
      draft,
      pending,
      totalStudents: totalStudents[0]?.total || 0,
      totalRevenue: revenue[0]?.total || 0
    };
  }

  /**
   * Create new course
   */
  static async createCourse(teacherId: string, courseData: any) {
    // ========== VALIDATE PACKAGE SUBSCRIPTION ==========
    const mongoose = require('mongoose');
    const { TeacherPackageSubscription } = require('../../shared/models/extended/TeacherPackage');
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // Get all active subscriptions
    const activeSubscriptions = await TeacherPackageSubscription.find({
      teacherId: teacherObjectId,
      status: 'active',
      endAt: { $gt: new Date() }
    }).sort({ 'snapshot.maxCourses': -1 }); // Sort by maxCourses descending

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      throw new Error('Bạn cần đăng ký gói subscription để tạo khóa học. Vui lòng chọn gói phù hợp tại /teacher/advanced/packages.');
    }

    // Get the subscription with highest maxCourses limit
    const maxAllowed = Math.max(...activeSubscriptions.map((sub: any) => sub.snapshot?.maxCourses || 0));
    const bestPackage = activeSubscriptions.find((sub: any) => sub.snapshot?.maxCourses === maxAllowed);

    // Check course creation quota
    const currentCoursesCount = await CourseModel.countDocuments({
      instructorId: teacherObjectId
    });

    if (currentCoursesCount >= maxAllowed) {
      const packageName = bestPackage?.snapshot?.name || 'hiện tại';
      throw new Error(`Bạn đã đạt giới hạn ${maxAllowed} khóa học của gói ${packageName}. Hiện tại: ${currentCoursesCount}/${maxAllowed}. Vui lòng nâng cấp gói để tạo thêm khóa học.`);
    }

    console.log(`✅ Course quota check passed: ${currentCoursesCount}/${maxAllowed} courses (Package: ${bestPackage?.snapshot?.name})`);
    // ========== END VALIDATION ==========

    // Map frontend field names to model field names
    const mappedData: any = {
      title: courseData.title,
      description: courseData.description,
      shortDescription: courseData.shortDescription || '', // ✅ NEW: Short description
      thumbnail: courseData.thumbnail,
      domain: courseData.domain,
      category: courseData.domain, // Set category = domain for backward compatibility
      level: courseData.level,
      price: courseData.price || 0,
      originalPrice: courseData.originalPrice || 0, // ✅ NEW: Original price
      discountPercentage: courseData.discountPercentage || 0, // ✅ NEW: Discount percentage
      estimatedDuration: courseData.duration > 0 ? courseData.duration : 1, // Min 0.5, default 1
      tags: courseData.tags || [],
      prerequisites: courseData.requirements || [], // Map requirements -> prerequisites
      learningObjectives: courseData.objectives || [], // Map objectives -> learningObjectives
      benefits: courseData.benefits || [], // ✅ NEW: Benefits
      maxStudents: courseData.maxStudents || 0, // ✅ NEW: Max students
      instructorId: teacherId,
      isPublished: false,
      isApproved: false,
      totalStudents: 0,
      averageRating: 0,
      totalRatings: 0,
      isFree: courseData.isFree || false,
      // Map language to localization object
      // Note: originalLanguage uses 'en' for text indexing, actual language stored in availableLanguages
      localization: {
        originalLanguage: 'en', // Fixed to 'en' for MongoDB compatibility
        availableLanguages: [courseData.language || 'vi'], // Actual course language(s)
        hasSubtitles: false,
        subtitleLanguages: [],
        hasDubbing: false,
        dubbedLanguages: []
      },
      // Assessment settings
      assessment: {
        hasQuizzes: false,
        hasAssignments: false,
        hasFinalExam: false,
        hasCertification: courseData.certificateAvailable || false,
        passingScore: 70,
        maxAttempts: 3
      },
      // Top-level certificate field (for backward compatibility)
      certificate: courseData.certificateAvailable || false
    };

    const course = new CourseModel(mappedData);
    await course.save();
    return course;
  }

  /**
   * Update course
   */
  static async updateCourse(courseId: string, teacherId: string, updates: any) {
    // First, get the current course to check its status
    const currentCourse = await CourseModel.findOne({
      _id: courseId,
      instructorId: teacherId
    });

    if (!currentCourse) {
      throw new Error('Course not found or you do not have permission to update this course');
    }

    // Map frontend field names to model field names
    const mappedUpdates: any = {
      ...updates,
      updatedAt: new Date()
    };

    // Sync category with domain for backward compatibility
    if (updates.domain !== undefined) {
      mappedUpdates.category = updates.domain;
    }

    // Remove deprecated fields if sent from old frontend
    if (updates.category !== undefined && updates.domain === undefined) {
      delete mappedUpdates.category; // Don't update category alone
    }

    // Map field names if they exist in updates
    if (updates.duration !== undefined) {
      mappedUpdates.estimatedDuration = updates.duration > 0 ? updates.duration : 1; // Min 0.5, default 1
      delete mappedUpdates.duration;
    }
    if (updates.requirements !== undefined) {
      mappedUpdates.prerequisites = updates.requirements;
      delete mappedUpdates.requirements;
    }
    if (updates.objectives !== undefined) {
      mappedUpdates.learningObjectives = updates.objectives;
      delete mappedUpdates.objectives;
    }
    if (updates.benefits !== undefined) {
      mappedUpdates.benefits = updates.benefits;
      // Don't delete - benefits is already the correct field name
    }
    if (updates.originalPrice !== undefined) {
      mappedUpdates.originalPrice = updates.originalPrice;
      // Don't delete - originalPrice is already the correct field name
    }
    if (updates.discountPercentage !== undefined) {
      mappedUpdates.discountPercentage = updates.discountPercentage;
      // Don't delete - discountPercentage is already the correct field name
    }
    if (updates.maxStudents !== undefined) {
      mappedUpdates.maxStudents = updates.maxStudents;
      // Don't delete - maxStudents is already the correct field name
    }
    if (updates.certificateAvailable !== undefined) {
      mappedUpdates.certificate = updates.certificateAvailable;
      mappedUpdates['assessment.hasCertification'] = updates.certificateAvailable;
      delete mappedUpdates.certificateAvailable;
    }

    // If editing a published course, mark it as having unsaved changes
    if (currentCourse.status === 'published') {
      mappedUpdates.hasUnsavedChanges = true;
      console.log('📝 Published course edited, marking hasUnsavedChanges = true');
    }

    // Manual validation for price/discount fields
    if (mappedUpdates.originalPrice !== undefined && mappedUpdates.price !== undefined) {
      if (mappedUpdates.originalPrice < mappedUpdates.price) {
        throw new Error('Original price must be greater than or equal to current price');
      }
    }

    if (mappedUpdates.discountPercentage !== undefined &&
      mappedUpdates.originalPrice !== undefined &&
      mappedUpdates.price !== undefined) {
      const calculatedPrice = mappedUpdates.originalPrice * (1 - mappedUpdates.discountPercentage / 100);
      if (Math.abs(calculatedPrice - mappedUpdates.price) >= 1000) {
        throw new Error(
          `Discount percentage does not match price calculation. ` +
          `Expected price: ${calculatedPrice.toFixed(0)}, Got: ${mappedUpdates.price}`
        );
      }
    }

    // Debug logging for important fields
    console.log('🔍 Update Course - Mapped Updates:', {
      originalPrice: mappedUpdates.originalPrice,
      discountPercentage: mappedUpdates.discountPercentage,
      maxStudents: mappedUpdates.maxStudents,
      certificate: mappedUpdates.certificate,
      benefits: mappedUpdates.benefits,
      isFree: mappedUpdates.isFree
    });

    // Use $set to update fields properly, especially nested ones
    // Note: runValidators is set to false because validation runs on OLD document context
    // which causes issues with price/discount validation
    const course = await CourseModel.findOneAndUpdate(
      { _id: courseId, instructorId: teacherId },
      { $set: mappedUpdates },
      { new: true, runValidators: false }
    );

    if (!course) {
      throw new Error('Course not found or you do not have permission to update this course');
    }

    return course;
  }

  /**
   * Delete course
   */
  static async deleteCourse(courseId: string, teacherId: string) {
    // Check if course has enrollments
    const enrollmentCount = await EnrollmentModel.countDocuments({ courseId });

    if (enrollmentCount > 0) {
      throw {
        statusCode: 400,
        message: 'Cannot delete course with active enrollments'
      };
    }

    const result = await CourseModel.deleteOne({
      _id: courseId,
      instructorId: teacherId
    });

    if (result.deletedCount === 0) {
      throw {
        statusCode: 404,
        message: 'Course not found or you do not have permission to delete it'
      };
    }

    return true;
  }

  /**
   * Update course status
   */
  static async updateCourseStatus(courseId: string, teacherId: string, status: string) {
    // Find course first to validate current status
    const course = await CourseModel.findOne({
      _id: courseId,
      instructorId: teacherId
    });

    if (!course) {
      throw new Error('Course not found or you do not have permission to update this course');
    }

    console.log('🔍 UpdateCourseStatus:', {
      courseId,
      currentStatus: course.status,
      requestedStatus: status,
      title: course.title
    });

    const updates: any = {};

    // Handle submit for review
    if (status === 'submit' || status === 'submitted') {
      const currentStatus = course.status || 'draft'; // Default to draft if undefined
      console.log('🔍 Submit Debug:', {
        courseId,
        currentStatus,
        requestedStatus: status,
        courseStatus: course.status,
        submittedForReview: course.submittedForReview,
        submittedAt: course.submittedAt
      });

      // Allowed statuses for submission:
      // - draft: Initial submission (one-time only)
      // - published: Resubmission after editing
      // - rejected: Resubmission after admin rejected
      // - needs_revision: Resubmission after admin requested changes
      const allowedStatuses = ['draft', 'published', 'rejected', 'needs_revision'];

      if (!allowedStatuses.includes(currentStatus)) {
        throw new Error(`Cannot submit course with status "${currentStatus}". Only draft, published, rejected, or needs_revision courses can be submitted for review.`);
      }

      // For published courses, require unsaved changes
      if (currentStatus === 'published') {
        if (!course.hasUnsavedChanges) {
          throw new Error('Cannot resubmit published course without any changes. Please edit the course first.');
        }

        updates.status = 'submitted';
        updates.submittedAt = new Date();
        updates.submittedForReview = true;
        updates.isPublished = false; // Unpublish when resubmitting
        updates.hasUnsavedChanges = false; // Reset after submitting
        console.log('📝 Published course resubmission');
      }
      // For rejected or needs_revision courses, allow resubmission
      else if (currentStatus === 'rejected' || currentStatus === 'needs_revision') {
        updates.status = 'submitted';
        updates.submittedAt = new Date();
        updates.submittedForReview = true;
        updates.hasUnsavedChanges = false;
        console.log(`📝 ${currentStatus} course resubmission`);
      }
      // For draft courses, one-time submission only
      else {
        // For draft courses (including undefined status), check if already submitted (one-time submission)
        if (course.submittedForReview === true || course.submittedAt) {
          throw new Error('This course has already been submitted for review. You can only submit each draft course once.');
        }

        updates.status = 'submitted';
        updates.submittedAt = new Date();
        updates.submittedForReview = true;
        updates.hasUnsavedChanges = false; // Reset after submitting
        console.log('📝 Draft course submission');
      }
    }
    // Handle withdraw submission (revert to draft)
    // DISABLED: One-time submission policy - courses cannot be withdrawn once submitted
    else if (status === 'withdraw' || (status === 'draft' && course.status === 'submitted')) {
      throw new Error('Cannot withdraw submission. Each course can only be submitted once for review.');
    }
    // Block publish/unpublish actions for teachers
    else if (status === 'publish' || status === 'unpublish') {
      throw new Error('Teachers cannot publish or unpublish courses. This action is reserved for administrators.');
    }
    // Invalid status
    else {
      throw new Error(`Invalid status update: ${status}. Teachers can only submit courses for review or withdraw submissions.`);
    }

    const updatedCourse = await CourseModel.findByIdAndUpdate(
      courseId,
      updates,
      { new: true }
    ).populate('instructorId', 'name email avatar');

    console.log('✅ Course status updated:', {
      courseId,
      newStatus: updatedCourse?.status,
      submittedAt: updatedCourse?.submittedAt,
      submittedForReview: updatedCourse?.submittedForReview,
      hasUnsavedChanges: updatedCourse?.hasUnsavedChanges
    });

    if (!updatedCourse) {
      throw new Error('Failed to update course status');
    }

    return updatedCourse;
  }
}
