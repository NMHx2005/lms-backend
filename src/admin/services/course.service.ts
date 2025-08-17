import { Course as CourseModel, User as UserModel, Enrollment as EnrollmentModel, Bill as BillModel } from '../../shared/models';
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
    
    if (filters.instructorId) {
      query.instructorId = filters.instructorId;
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

    // Execute query
    const [coursesData, total] = await Promise.all([
      CourseModel.find(query)
        .populate('instructorId', 'name')
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
      CourseModel.countDocuments({ isPublished: true, isApproved: true }),
      CourseModel.countDocuments({ isApproved: false }),
      CourseModel.countDocuments({ isPublished: false, isApproved: false }),
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

    course.isApproved = approved;
    course.updatedAt = new Date();
    
    if (approved) {
      course.approvedAt = new Date();
    }

    await course.save();

    return {
      message: `Course ${approved ? 'approved' : 'rejected'} successfully`,
      course
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
}
