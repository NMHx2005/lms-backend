import { Course as CourseModel, User as UserModel, Enrollment as EnrollmentModel, Bill as BillModel } from '../../shared/models';
import { TeacherPackageSubscription } from '../../shared/models/extended/TeacherPackage';
import {
  CreateCourseRequest,
  UpdateCourseRequest,
  CourseListResponse,
  CourseStats,
  CourseSearchFilters,
  Course
} from '../interfaces/course.interface';
import { DEFAULT_COURSE_LIMIT, COURSE_SORT_FIELDS, COURSE_SORT_ORDERS } from '../constants/course.constants';

export class CourseService {
  // Create a new course
  static async createCourse(courseData: CreateCourseRequest) {
    // Check if instructor exists
    const instructor = await UserModel.findById(courseData.instructorId);
    if (!instructor) {
      throw new Error('Instructor not found');
    }

    // Check if instructor has teacher role
    if (!instructor.roles.includes('teacher')) {
      throw new Error('User must have teacher role to create courses');
    }

    // Enforce package quota for teacher
    const now = new Date();
    const activeSubscription = await TeacherPackageSubscription.findOne({
      teacherId: instructor._id,
      status: 'active',
      endAt: { $gt: now }
    }).sort({ endAt: -1 });

    if (!activeSubscription) {
      throw new Error('No active package subscription for instructor');
    }

    const existingCoursesCount = await CourseModel.countDocuments({ instructorId: instructor._id });
    const maxAllowed = activeSubscription.snapshot?.maxCourses ?? 0;

    if (existingCoursesCount >= maxAllowed) {
      throw new Error('Course creation quota exceeded for current package');
    }

    // Create course
    const course = new CourseModel({
      ...courseData,
      isPublished: false,
      isApproved: false,
      isFeatured: false,
      totalStudents: 0,
      averageRating: 0,
      totalLessons: 0,
      upvotes: 0,
      reports: 0,
      enrolledStudents: [],
      totalRatings: 0,
      completionRate: 0
    });

    return await course.save();
  }

  // Get course by ID
  static async getCourseById(courseId: string) {
    const course = await CourseModel.findById(courseId)
      .populate('instructorId', 'name email')
      .populate('sections')
      .populate('lessons')
      .populate('assignments');

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  // Get courses with pagination and filters
  static async getCourses(
    page: number = 1,
    limit: number = DEFAULT_COURSE_LIMIT,
    sortBy: string = COURSE_SORT_FIELDS.CREATED_AT,
    sortOrder: string = COURSE_SORT_ORDERS.DESC,
    filters: CourseSearchFilters = {}
  ): Promise<CourseListResponse> {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { domain: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.domain) {
      query.domain = filters.domain;
    }

    if (filters.level) {
      query.level = filters.level;
    }

    if (filters.isPublished !== undefined) {
      query.isPublished = filters.isPublished;
    }

    if (filters.isApproved !== undefined) {
      query.isApproved = filters.isApproved;
    }

    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }

    // Filter by status field (NEW LOGIC)
    if (filters.status) {
      query.status = filters.status;
    }

    // Legacy filter: submittedForReview
    if (filters.submittedForReview !== undefined) {
      if (filters.submittedForReview) {
        // Courses submitted for review: use new status field
        query.status = 'submitted';
      } else {
        // Not submitted courses: draft, approved, published, etc.
        query.status = { $ne: 'submitted' };
      }
    }

    if (filters.instructorId) {
      query.instructorId = filters.instructorId;
    }

    if (filters.instructor) {
      // Search in instructor name (will work after populate)
      // We'll filter this after the query since we need to populate instructorId first
      // For now, we'll handle this in post-processing
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    if (filters.createdAt) {
      query.createdAt = {
        $gte: filters.createdAt.start,
        $lte: filters.createdAt.end
      };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === COURSE_SORT_ORDERS.ASC ? 1 : -1;

    // Debug log
    console.log('🔍 Course query filters:', filters);
    console.log('🔍 MongoDB query:', JSON.stringify(query, null, 2));

    // Execute query
    const [coursesData, total] = await Promise.all([
      CourseModel.find(query)
        .populate('instructorId', 'name fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CourseModel.countDocuments(query)
    ]);

    // Post-process for instructor filter if needed
    let filteredCourses = coursesData;
    if (filters.instructor) {
      filteredCourses = coursesData.filter(course => {
        const instructor = course.instructorId as any;
        if (!instructor) return false;
        const instructorName = instructor.name || instructor.fullName || '';
        return instructorName.toLowerCase().includes(filters.instructor!.toLowerCase());
      });
    }

    // Map to match Course interface
    const courses: Course[] = filteredCourses.map(course => ({
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
      status: course.status || 'draft',
      hasUnsavedChanges: course.hasUnsavedChanges || false,
      isPublished: course.isPublished,
      isApproved: course.isApproved,
      isFeatured: course.isFeatured,
      instructorId: course.instructorId._id.toString(),
      instructorName: (course.instructorId as any).name,
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

  // Update course
  static async updateCourse(courseId: string, updateData: UpdateCourseRequest) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Update course
    Object.assign(course, updateData);
    course.updatedAt = new Date();

    // Set publishedAt if publishing for the first time
    if (updateData.isPublished && !course.isPublished) {
      course.publishedAt = new Date();
    }

    // Set approvedAt if approving for the first time
    if (updateData.isApproved && !course.isApproved) {
      course.approvedAt = new Date();
    }

    return await course.save();
  }

  // Update course status only (without full validation)
  static async updateCourseStatus(courseId: string, statusData: { isPublished?: boolean; isFeatured?: boolean; status?: string }) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Update only status fields
    if (statusData.isPublished !== undefined) {
      course.isPublished = statusData.isPublished;

      // Sync status field with isPublished
      if (statusData.isPublished) {
        course.status = 'published';
        // Set publishedAt if publishing for the first time
        if (!course.publishedAt) {
          course.publishedAt = new Date();
        }
      } else {
        // Unpublish: revert to approved if was approved, otherwise draft
        course.status = course.isApproved ? 'approved' : 'draft';
      }
    }

    if (statusData.isFeatured !== undefined) {
      course.isFeatured = statusData.isFeatured;
    }

    // Allow explicit status override
    if (statusData.status !== undefined) {
      course.status = statusData.status as any;
    }

    course.updatedAt = new Date();

    return await course.save();
  }

  // Delete course
  static async deleteCourse(courseId: string) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if course has enrollments
    const enrollmentCount = await EnrollmentModel.countDocuments({ courseId });
    if (enrollmentCount > 0) {
      throw new Error('Cannot delete course with existing enrollments');
    }

    await CourseModel.findByIdAndDelete(courseId);
    return { message: 'Course deleted successfully' };
  }

  // Get course statistics
  static async getCourseStats(): Promise<CourseStats> {
    const [
      totalCourses,
      publishedCourses,
      pendingApproval,
      draftCourses,
      coursesByDomain,
      coursesByLevel,
      averageRating,
      totalEnrollments,
      totalRevenue
    ] = await Promise.all([
      CourseModel.countDocuments(),
      CourseModel.countDocuments({ status: 'published' }),
      CourseModel.countDocuments({ status: 'submitted' }), // Courses waiting for approval
      CourseModel.countDocuments({ status: 'draft' }),
      CourseModel.aggregate([
        { $group: { _id: '$domain', count: { $sum: 1 } } }
      ]),
      CourseModel.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),
      CourseModel.aggregate([
        { $match: { averageRating: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$averageRating' } } }
      ]),
      EnrollmentModel.countDocuments(),
      BillModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return {
      totalCourses,
      publishedCourses,
      pendingApproval,
      draftCourses,
      coursesByDomain: coursesByDomain.map(item => ({ domain: item._id, count: item.count })),
      coursesByLevel: coursesByLevel.map(item => ({ level: item._id, count: item.count })),
      averageRating: averageRating[0]?.avg || 0,
      totalEnrollments,
      totalRevenue: totalRevenue[0]?.total || 0
    };
  }

  // Approve/reject course
  static async approveCourse(courseId: string, approved: boolean, feedback?: string) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Update status based on approval
    if (approved) {
      course.status = 'published';
      course.isApproved = true;
      course.isPublished = true;
      course.approvedAt = new Date();
      course.publishedAt = new Date();
    } else {
      course.status = 'rejected';
      course.isApproved = false;
      course.isPublished = false;
    }

    course.updatedAt = new Date();

    await course.save();

    return {
      message: `Course ${approved ? 'approved' : 'rejected'} successfully`,
      course,
      feedback
    };
  }

  // Bulk update course status
  static async bulkUpdateCourseStatus(courseIds: string[], isPublished: boolean, isApproved: boolean) {
    const updateData: any = {
      isPublished,
      isApproved,
      updatedAt: new Date()
    };

    if (isPublished) {
      updateData.publishedAt = new Date();
    }

    if (isApproved) {
      updateData.approvedAt = new Date();
    }

    const result = await CourseModel.updateMany(
      { _id: { $in: courseIds } },
      { $set: updateData }
    );

    return {
      message: `Updated ${result.modifiedCount} courses`,
      modifiedCount: result.modifiedCount
    };
  }

  // Search courses
  static async searchCourses(searchTerm: string, limit: number = 10) {
    const courses = await CourseModel.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { domain: { $regex: searchTerm, $options: 'i' } }
      ]
    })
      .populate('instructorId', 'name')
      .limit(limit);

    return courses;
  }

  // Get course enrollment statistics
  static async getCourseEnrollmentStats(courseId: string) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      averageProgress,
      recentEnrollments
    ] = await Promise.all([
      EnrollmentModel.countDocuments({ courseId }),
      EnrollmentModel.countDocuments({ courseId, status: 'active' }),
      EnrollmentModel.countDocuments({ courseId, status: 'completed' }),
      EnrollmentModel.aggregate([
        { $match: { courseId } },
        { $group: { _id: null, avg: { $avg: '$progress' } } }
      ]),
      EnrollmentModel.find({ courseId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
    ]);

    return {
      courseId,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      averageProgress: averageProgress[0]?.avg || 0,
      recentEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0
    };
  }

  // Get pending course approvals
  static async getPendingApprovals(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get courses with status 'submitted' (waiting for admin approval)
    const [courses, total] = await Promise.all([
      CourseModel.find({ status: 'submitted' })
        .populate('instructorId', 'name email')
        .sort({ submittedAt: -1 }) // Sort by submission time
        .skip(skip)
        .limit(limit),
      CourseModel.countDocuments({ status: 'submitted' })
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

  // Get course analytics
  static async getCourseAnalytics(courseId: string, period: string = '30d') {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      enrollmentsInPeriod,
      revenueInPeriod,
      averageRatingInPeriod,
      lessonCompletionsInPeriod
    ] = await Promise.all([
      EnrollmentModel.countDocuments({
        courseId,
        createdAt: { $gte: startDate }
      }),
      BillModel.aggregate([
        { $match: { courseId, status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      EnrollmentModel.aggregate([
        { $match: { courseId, updatedAt: { $gte: startDate } } },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ]),
      EnrollmentModel.aggregate([
        { $match: { courseId, updatedAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: { $size: '$completedLessons' } } } }
      ])
    ]);

    return {
      courseId,
      period,
      startDate,
      endDate: now,
      enrollmentsInPeriod,
      revenueInPeriod: revenueInPeriod[0]?.total || 0,
      averageRatingInPeriod: averageRatingInPeriod[0]?.avg || 0,
      lessonCompletionsInPeriod: lessonCompletionsInPeriod[0]?.total || 0,
      totalEnrollments: course.totalStudents,
      totalRevenue: course.price * course.totalStudents,
      averageRating: course.averageRating
    };
  }
}
