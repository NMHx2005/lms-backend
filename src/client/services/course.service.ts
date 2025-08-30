import { Course as CourseModel, Enrollment as EnrollmentModel, User as UserModel, Bill as BillModel } from '../../shared/models';
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
  static async getCourseById(courseId: string) {
    const course = await CourseModel.findOne({
      _id: courseId,
      isPublished: true,
      isApproved: true
    })
      .populate('instructorId', 'name email avatar bio')
      .populate('sections')
      .populate('lessons')
      .populate('assignments');

    if (!course) {
      throw new Error('Course not found or not available');
    }

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
    const completedLessons = 0; // Will be implemented when lesson completion tracking is added
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      courseId,
      userId,
      progress,
      completedLessons,
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
}
