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

    // Update fields
    if (data.name !== undefined) user.name = data.name;
    if (data.profile) {
      (user as any).profile = { ...(user as any).profile, ...data.profile };
    }

    user.updatedAt = new Date();
    await user.save();

    return user;
  }

  /**
   * Get client dashboard data
   */
  static async getDashboardData(userId: string): Promise<ClientDashboardData> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get enrolled courses
    const enrollments = await Enrollment.find({ studentId: userId, status: 'active' })
      .populate('courseId', 'name description thumbnail totalLessons totalDuration')
      .sort({ enrolledAt: -1 })
      .limit(5);

    // Get recent activity (placeholder - would integrate with activity log)
    const recentActivity = [
      { type: 'course_enrolled', message: 'Enrolled in new course', timestamp: new Date() },
      { type: 'lesson_completed', message: 'Completed lesson', timestamp: new Date() },
    ];

    // Get upcoming assignments (placeholder - would integrate with assignment system)
    const upcomingAssignments = [
      { title: 'Assignment 1', dueDate: new Date(), course: 'Course Name' },
    ];

    // Get course progress
    const courseProgress = enrollments.map(enrollment => ({
      courseId: enrollment.courseId._id,
      courseName: (enrollment.courseId as any).name,
      progress: enrollment.progress || 0,
      completedLessons: (enrollment as any).completedLessons || 0,
      totalLessons: (enrollment.courseId as any).totalLessons || 0,
    }));

    return {
      user,
      enrolledCourses: enrollments.map(e => e.courseId),
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
    const query: any = { studentId: userId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { 'courseId.name': { $regex: filters.search, $options: 'i' } },
        { 'courseId.description': { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.category) {
      query['courseId.category'] = filters.category;
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate('courseId', 'name description thumbnail totalLessons totalDuration category')
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
      status: 'active',
    }).populate('courseId', 'name totalLessons totalDuration');

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    const course = enrollment.courseId as any;
    const progress = enrollment.progress || 0;
    const completedLessons = (enrollment as any).completedLessons || 0;
    const totalLessons = course.totalLessons || 0;

    return {
      courseId,
      courseName: course.name,
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
      Enrollment.countDocuments({ studentId: userId }),
      Enrollment.countDocuments({ studentId: userId, status: 'active' }),
      Enrollment.countDocuments({ studentId: userId, status: 'completed' }),
      Enrollment.aggregate([
        { $match: { studentId: userId } },
        { $group: { _id: null, total: { $sum: '$totalStudyTime' } } },
      ]),
      Enrollment.aggregate([
        { $match: { studentId: userId, status: 'active' } },
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
    }).populate('courseId', 'name description thumbnail');

    return enrollments.map(enrollment => ({
      id: enrollment._id.toString(),
      courseId: enrollment.courseId._id,
      courseName: (enrollment.courseId as any).name,
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
