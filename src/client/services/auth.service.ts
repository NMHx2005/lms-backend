import { AuthService as BaseAuthService } from '../../shared/services/auth.service';
import { User, Course, Enrollment } from '../../shared/models';
import { AuthenticationError, ValidationError, NotFoundError } from '../../shared/utils/errors';

export interface ClientProfileUpdateData {
  name?: string;
  profile?: {
    avatar?: string;
    phone?: string;
    address?: string;
    country?: string;
    bio?: string;
  };
}

export interface ClientDashboardData {
  user: any;
  enrolledCourses: any[];
  recentActivity: any[];
  upcomingAssignments: any[];
  courseProgress: any[];
}

export class ClientAuthService extends BaseAuthService {
  /**
   * Update client profile
   */
  static async updateProfile(userId: string, data: ClientProfileUpdateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update basic name
    if (data.name !== undefined) user.name = data.name;

    // Update nested profile fields and sync to top-level schema fields
    if (data.profile) {
      const { avatar, phone, address, country, bio } = data.profile;

      // Preserve any existing nested object if present (future-proof)
      (user as any).profile = { ...(user as any).profile, ...data.profile };

      if (avatar !== undefined) user.avatar = avatar;
      if (phone !== undefined) (user as any).phone = phone;
      if (address !== undefined) (user as any).address = address;
      if (country !== undefined) (user as any).country = country;
      if (bio !== undefined) (user as any).bio = bio;
    }

    user.updatedAt = new Date();
    await user.save();

    // Return sanitized user (without password)
    const safe = user.toObject();
    if (safe.password) delete (safe as any).password;
    return safe;
  }

  /**
   * Get client dashboard data
   */
  static async getDashboardData(userId: string): Promise<ClientDashboardData> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get enrolled courses (only active enrollments)
    const enrollments = await Enrollment.find({
      studentId: userId,
      isActive: true  // Only show active enrollments (exclude refunded/cancelled)
    })
      .populate({
        path: 'courseId',
        select: 'title description thumbnail totalLessons totalDuration instructorId',
        populate: {
          path: 'instructorId',
          select: 'name firstName lastName avatar'
        }
      })
      .sort({ enrolledAt: -1 })
      .limit(5);

    // Recent activity: lấy từ enrollment và gần đây (đơn giản hoá)
    const recentActivity = enrollments.map((e: any) => ({
      type: 'course_enrolled',
      message: `Enrolled in ${(e.courseId as any).title || 'Course'}`,
      timestamp: e.enrolledAt,
      courseId: e.courseId?._id || e.courseId
    }));

    // Upcoming assignments: trong 14 ngày tới theo course đã ghi danh
    const courseIds = enrollments.map((e: any) => e.courseId?._id || e.courseId);
    const now = new Date();
    const in14 = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    const upcomingAssignments = await (await import('../../shared/models')).Assignment.find({
      courseId: { $in: courseIds },
      dueDate: { $gte: now, $lte: in14 },
      isActive: true
    }).select('title dueDate courseId');

    // Get course progress
    const courseProgress = enrollments.map(enrollment => ({
      courseId: enrollment.courseId._id,
      courseName: (enrollment.courseId as any).title,
      progress: enrollment.progress || 0,
      completedLessons: (enrollment as any).completedLessons || 0,
      totalLessons: (enrollment.courseId as any).totalLessons || 0,
    }));

    // Calculate real-time stats from active enrollments
    const completedCount = await Enrollment.countDocuments({
      studentId: userId,
      isActive: true,
      isCompleted: true
    });

    const totalStudyTimeResult = await Enrollment.aggregate([
      { $match: { studentId: userId, isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalTimeSpent' } } }
    ]);

    // Override user stats with real-time data
    const userObj = user.toObject();
    userObj.stats = {
      totalCoursesEnrolled: enrollments.length,  // Count active enrollments
      totalCoursesCompleted: completedCount,
      totalAssignmentsSubmitted: userObj.stats?.totalAssignmentsSubmitted || 0,
      averageScore: userObj.stats?.averageScore || 0,
      totalLearningTime: totalStudyTimeResult[0]?.total || 0
    };

    return {
      user: userObj,
      enrolledCourses: enrollments.map(e => {
        const course = e.courseId as any;
        return {
          ...course.toObject(),
          instructor: course.instructorId
        };
      }),
      recentActivity,
      upcomingAssignments,
      courseProgress,
    };
  }

  /**
   * Get user's enrolled courses
   */
  static async getEnrolledCourses(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string;
      search?: string;
      category?: string;
    } = {}
  ) {
    const skip = (page - 1) * limit;
    const query: any = {
      studentId: userId,
      isActive: true  // Only return active enrollments (exclude refunded/cancelled)
    };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { 'courseId.title': { $regex: filters.search, $options: 'i' } },
        { 'courseId.description': { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.category) {
      query['courseId.category'] = filters.category;
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate({
          path: 'courseId',
          select: 'title description thumbnail totalLessons totalDuration category price instructorId domain level',
          populate: {
            path: 'instructorId',
            select: 'name firstName lastName avatar'
          }
        })
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(query),
    ]);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's course progress
   */
  static async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await Enrollment.findOne({
      studentId: userId,
      courseId,
      isActive: true  // Only active enrollments (exclude refunded)
    }).populate('courseId', 'title totalLessons totalDuration');

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    const course = enrollment.courseId as any;
    const progress = enrollment.progress || 0;
    const completedLessons = (enrollment as any).completedLessons || 0;
    const totalLessons = course.totalLessons || 0;

    return {
      courseId,
      courseName: course.title,
      progress,
      completedLessons,
      totalLessons,
      estimatedTimeRemaining: this.calculateTimeRemaining(progress, course.totalDuration),
      lastActivity: enrollment.lastActivityAt,
      enrolledAt: enrollment.enrolledAt,
    };
  }

  /**
   * Get user's learning statistics
   */
  static async getLearningStatistics(userId: string) {
    const [
      totalEnrollments,
      activeEnrollments,
      completedCourses,
      totalStudyTime,
      averageProgress,
    ] = await Promise.all([
      // Total = All active enrollments (exclude refunded/cancelled)
      Enrollment.countDocuments({ studentId: userId, isActive: true }),
      // Active = In-progress (active but not completed)
      Enrollment.countDocuments({ studentId: userId, isActive: true, isCompleted: false }),
      // Completed = Finished courses (still active)
      Enrollment.countDocuments({ studentId: userId, isActive: true, isCompleted: true }),
      Enrollment.aggregate([
        { $match: { studentId: userId, isActive: true } },  // Only active enrollments
        { $group: { _id: null, total: { $sum: '$totalStudyTime' } } },
      ]),
      Enrollment.aggregate([
        { $match: { studentId: userId, isActive: true } },  // Only active enrollments
        { $group: { _id: null, avg: { $avg: '$progress' } } },
      ]),
    ]);

    return {
      totalEnrollments,
      activeEnrollments,
      completedCourses,
      totalStudyTime: totalStudyTime[0]?.total || 0,
      averageProgress: Math.round((averageProgress[0]?.avg || 0) * 100) / 100,
    };
  }

  /**
   * Get user's recent activity
   */
  static async getRecentActivity(userId: string, limit: number = 10) {
    // This would typically integrate with an activity log system
    // For now, return placeholder data
    return [
      {
        id: '1',
        type: 'course_enrolled',
        message: 'Enrolled in Advanced JavaScript Course',
        timestamp: new Date(),
        metadata: { courseId: 'course123', courseName: 'Advanced JavaScript' },
      },
      {
        id: '2',
        type: 'lesson_completed',
        message: 'Completed lesson: Introduction to ES6',
        timestamp: new Date(Date.now() - 3600000),
        metadata: { lessonId: 'lesson456', lessonName: 'Introduction to ES6' },
      },
    ];
  }

  /**
   * Calculate estimated time remaining based on progress
   */
  private static calculateTimeRemaining(progress: number, totalDuration: number): number {
    if (progress >= 100) return 0;
    const remainingProgress = 100 - progress;
    return Math.round((remainingProgress / 100) * totalDuration);
  }

  /**
   * Get user's learning goals
   */
  static async getLearningGoals(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // This would typically come from a separate LearningGoals model
    // For now, return mock data
    return [
      { id: '1', title: 'Complete JavaScript Fundamentals', targetDate: new Date('2024-12-31'), progress: 75 },
      { id: '2', title: 'Learn React Basics', targetDate: new Date('2024-11-30'), progress: 30 },
      { id: '3', title: 'Master Node.js', targetDate: new Date('2025-01-31'), progress: 10 },
    ];
  }

  /**
   * Get user's certificates
   */
  static async getCertificates(userId: string) {
    // This would typically query a separate Certificates model
    // For now, return mock data based on completed enrollments
    const enrollments = await Enrollment.find({
      studentId: userId,
      status: 'completed',
      certificateIssued: true,
    }).populate('courseId', 'title description thumbnail');

    return enrollments.map(enrollment => ({
      id: enrollment._id.toString(),
      courseId: enrollment.courseId._id,
      courseName: (enrollment.courseId as any).title,
      courseDescription: (enrollment.courseId as any).description,
      courseThumbnail: (enrollment.courseId as any).thumbnail,
      issuedAt: enrollment.completedAt,
      certificateUrl: (enrollment as any).certificateUrl || null,
      score: (enrollment as any).score || null,
    }));
  }

  /**
   * Get user's achievements
   */
  static async getAchievements(userId: string) {
    // This would typically query a separate Achievements model
    // For now, return mock data based on user stats
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const achievements = [];

    // Course completion achievements
    if (user.stats?.totalCoursesCompleted) {
      if (user.stats.totalCoursesCompleted >= 1) {
        achievements.push({
          id: 'first_course',
          title: 'First Steps',
          description: 'Complete your first course',
          icon: '🎯',
          earnedAt: user.createdAt,
          type: 'course_completion',
        });
      }
      if (user.stats.totalCoursesCompleted >= 5) {
        achievements.push({
          id: 'course_master',
          title: 'Course Master',
          description: 'Complete 5 courses',
          icon: '🏆',
          earnedAt: new Date(),
          type: 'course_completion',
        });
      }
    }

    // Learning streak achievements (using mock data for now)
    const mockCurrentStreak = 7; // This would come from actual calculation
    if (mockCurrentStreak >= 7) {
      achievements.push({
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        earnedAt: new Date(),
        type: 'streak',
      });
    }

    // Assignment achievements
    if (user.stats?.totalAssignmentsSubmitted) {
      if (user.stats.totalAssignmentsSubmitted >= 10) {
        achievements.push({
          id: 'assignment_expert',
          title: 'Assignment Expert',
          description: 'Submit 10 assignments',
          icon: '📝',
          earnedAt: new Date(),
          type: 'assignment',
        });
      }
    }

    return achievements;
  }

  /**
   * Get user's study schedule
   */
  static async getStudySchedule(userId: string) {
    // This would typically query a separate StudySchedule model
    // For now, return mock data
    const schedule = [
      {
        id: '1',
        day: 'Monday',
        timeSlots: [
          { time: '09:00', duration: 60, type: 'course_work', courseId: 'course1' },
          { time: '14:00', duration: 45, type: 'assignment', courseId: 'course2' },
        ],
      },
      {
        id: '2',
        day: 'Wednesday',
        timeSlots: [
          { time: '10:00', duration: 90, type: 'course_work', courseId: 'course1' },
          { time: '16:00', duration: 30, type: 'review', courseId: 'course3' },
        ],
      },
      {
        id: '3',
        day: 'Friday',
        timeSlots: [
          { time: '11:00', duration: 60, type: 'course_work', courseId: 'course2' },
          { time: '15:00', duration: 45, type: 'practice', courseId: 'course1' },
        ],
      },
    ];

    return schedule;
  }
}
