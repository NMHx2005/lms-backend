import { Types } from 'mongoose';
import TeacherScore, { ITeacherScore } from '../../models/core/TeacherScore';
import TeacherRating, { ITeacherRating } from '../../models/core/TeacherRating';
import User, { IUser } from '../../models/core/User';
import Course, { ICourse } from '../../models/core/Course';
import Enrollment from '../../models/core/Enrollment';
import CourseReview from '../../models/core/CourseReview';

export interface TeacherPerformanceMetrics {
  studentRating: {
    score: number;
    averageRating: number;
    totalRatings: number;
    responseRate: number;
  };
  coursePerformance: {
    score: number;
    completionRate: number;
    averageGrade: number;
    dropoutRate: number;
    passRate: number;
  };
  engagement: {
    score: number;
    responseTime: number;
    forumParticipation: number;
    assignmentFeedbackQuality: number;
    availabilityHours: number;
  };
  development: {
    score: number;
    coursesCreated: number;
    contentUpdates: number;
    skillsImprovement: number;
    certificationEarned: number;
  };
}

export interface TeacherAnalytics {
  coursesActive: number;
  coursesCompleted: number;
  totalStudents: number;
  totalEnrollments: number;
  averageClassSize: number;
  feedback: {
    positive: number;
    neutral: number;
    negative: number;
    commonCompliments: string[];
    commonComplaints: string[];
    improvementSuggestions: string[];
  };
  trends: {
    enrollmentTrend: 'increasing' | 'stable' | 'decreasing';
    ratingTrend: 'improving' | 'stable' | 'declining';
    completionTrend: 'improving' | 'stable' | 'declining';
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
  };
  ranking: {
    overallRank: number;
    departmentRank: number;
    categoryRank: number;
    totalTeachers: number;
    percentile: number;
  };
}

export interface ScoreCalculationOptions {
  periodStart: Date;
  periodEnd: Date;
  periodType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  weights?: {
    studentRating?: number;
    coursePerformance?: number;
    engagement?: number;
    development?: number;
  };
}

class TeacherAnalyticsService {
  private static instance: TeacherAnalyticsService;

  public static getInstance(): TeacherAnalyticsService {
    if (!TeacherAnalyticsService.instance) {
      TeacherAnalyticsService.instance = new TeacherAnalyticsService();
    }
    return TeacherAnalyticsService.instance;
  }

  /**
   * Calculate comprehensive teacher performance score
   */
  async calculateTeacherScore(
    teacherId: Types.ObjectId,
    options: ScoreCalculationOptions
  ): Promise<ITeacherScore> {
    const { periodStart, periodEnd, periodType } = options;
    const weights = options.weights || {
      studentRating: 0.40,
      coursePerformance: 0.30,
      engagement: 0.20,
      development: 0.10
    };

    // Calculate metrics
    const metrics = await this.calculatePerformanceMetrics(teacherId, periodStart, periodEnd);
    const analytics = await this.calculateTeacherAnalytics(teacherId, periodStart, periodEnd);

    // Calculate overall score
    const overallScore = Math.round(
      (metrics.studentRating.score * weights.studentRating!) +
      (metrics.coursePerformance.score * weights.coursePerformance!) +
      (metrics.engagement.score * weights.engagement!) +
      (metrics.development.score * weights.development!)
    );

    // Get previous score for comparison
    const previousScore = await this.getPreviousScore(teacherId, periodStart, periodType);

    // Create new teacher score
    const teacherScore = new TeacherScore({
      teacherId,
      periodType,
      periodStart,
      periodEnd,
      overallScore,
      previousScore: previousScore?.overallScore,
      scoreChange: previousScore ? overallScore - previousScore.overallScore : 0,
      metrics,
      analytics,
      goals: {
        targetScore: this.calculateTargetScore(overallScore, previousScore?.overallScore),
        targetAchieved: false,
        improvementAreas: this.identifyImprovementAreas(metrics),
        strengthAreas: this.identifyStrengthAreas(metrics),
        actionPlan: await this.generateActionPlan(metrics),
        nextReviewDate: this.calculateNextReviewDate(periodType)
      },
      achievements: await this.calculateAchievements(teacherId, metrics, analytics),
      status: 'active',
      metadata: {
        generatedBy: 'system',
        version: '1.0',
        calculationMethod: 'weighted_average',
        dataSource: ['student_ratings', 'course_performance', 'engagement_metrics', 'development_data'],
        confidenceLevel: this.calculateConfidenceLevel(analytics.totalStudents, analytics.coursesActive)
      }
    });

    // Update ranking
    await this.updateTeacherRanking(teacherScore);

    return teacherScore;
  }

  /**
   * Calculate detailed performance metrics
   */
  private async calculatePerformanceMetrics(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<TeacherPerformanceMetrics> {
    // Student Rating Metrics
    const studentRating = await this.calculateStudentRatingMetrics(teacherId, periodStart, periodEnd);
    
    // Course Performance Metrics
    const coursePerformance = await this.calculateCoursePerformanceMetrics(teacherId, periodStart, periodEnd);
    
    // Engagement Metrics
    const engagement = await this.calculateEngagementMetrics(teacherId, periodStart, periodEnd);
    
    // Development Metrics
    const development = await this.calculateDevelopmentMetrics(teacherId, periodStart, periodEnd);

    return {
      studentRating,
      coursePerformance,
      engagement,
      development
    };
  }

  /**
   * Calculate student rating metrics (40% weight)
   */
  private async calculateStudentRatingMetrics(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ) {
    const ratings = await TeacherRating.find({
      teacherId,
      'ratingContext.ratingDate': { $gte: periodStart, $lte: periodEnd },
      status: 'active',
      'verification.moderationStatus': 'approved'
    });

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, rating) => sum + rating.overallRating, 0) / totalRatings 
      : 0;

    // Calculate response rate (ratings vs total completed enrollments)
    const completedEnrollments = await Enrollment.countDocuments({
      'course.instructorId': teacherId,
      status: 'completed',
      completedAt: { $gte: periodStart, $lte: periodEnd }
    });

    const responseRate = completedEnrollments > 0 ? (totalRatings / completedEnrollments) * 100 : 0;

    // Convert to 0-100 score
    const score = Math.min(100, Math.round(
      (averageRating / 5 * 70) + // Base score from rating (0-70)
      (responseRate / 100 * 20) + // Response rate bonus (0-20)
      (totalRatings >= 10 ? 10 : totalRatings) // Volume bonus (0-10)
    ));

    return {
      score,
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings,
      responseRate: Math.round(responseRate * 100) / 100
    };
  }

  /**
   * Calculate course performance metrics (30% weight)
   */
  private async calculateCoursePerformanceMetrics(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get enrollments for teacher's courses in the period
    const enrollments = await Enrollment.aggregate([
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
          enrolledAt: { $gte: periodStart, $lte: periodEnd }
        }
      }
    ]);

    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const droppedEnrollments = enrollments.filter(e => e.status === 'dropped').length;
    const passedEnrollments = enrollments.filter(e => e.finalGrade && e.finalGrade >= 60).length;

    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
    const dropoutRate = totalEnrollments > 0 ? (droppedEnrollments / totalEnrollments) * 100 : 0;
    const passRate = completedEnrollments > 0 ? (passedEnrollments / completedEnrollments) * 100 : 0;
    
    const averageGrade = completedEnrollments > 0
      ? enrollments
          .filter(e => e.finalGrade)
          .reduce((sum, e) => sum + e.finalGrade, 0) / completedEnrollments
      : 0;

    // Calculate performance score
    const score = Math.round(
      (completionRate * 0.4) + // Completion rate (40%)
      (averageGrade * 0.3) + // Average grade (30%)
      ((100 - dropoutRate) * 0.2) + // Retention rate (20%)
      (passRate * 0.1) // Pass rate (10%)
    );

    return {
      score: Math.min(100, score),
      completionRate: Math.round(completionRate * 100) / 100,
      averageGrade: Math.round(averageGrade * 100) / 100,
      dropoutRate: Math.round(dropoutRate * 100) / 100,
      passRate: Math.round(passRate * 100) / 100
    };
  }

  /**
   * Calculate engagement metrics (20% weight)
   */
  private async calculateEngagementMetrics(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ) {
    // This would need to be calculated based on actual engagement data
    // For now, we'll use simulated values that would come from real analytics

    // Simulated response time analysis (would come from message/forum data)
    const responseTime = Math.random() * 24; // Hours

    // Simulated forum participation (would come from forum analytics)
    const forumParticipation = Math.random() * 100;

    // Simulated assignment feedback quality (would come from feedback analysis)
    const assignmentFeedbackQuality = 70 + Math.random() * 30;

    // Simulated availability hours per week
    const availabilityHours = 40 + Math.random() * 20;

    // Calculate engagement score
    const responseTimeScore = Math.max(0, 100 - (responseTime * 4)); // Penalty for slow response
    const participationScore = forumParticipation;
    const feedbackScore = assignmentFeedbackQuality;
    const availabilityScore = Math.min(100, (availabilityHours / 60) * 100);

    const score = Math.round(
      (responseTimeScore * 0.3) +
      (participationScore * 0.3) +
      (feedbackScore * 0.2) +
      (availabilityScore * 0.2)
    );

    return {
      score,
      responseTime: Math.round(responseTime * 100) / 100,
      forumParticipation: Math.round(forumParticipation * 100) / 100,
      assignmentFeedbackQuality: Math.round(assignmentFeedbackQuality * 100) / 100,
      availabilityHours: Math.round(availabilityHours * 100) / 100
    };
  }

  /**
   * Calculate development metrics (10% weight)
   */
  private async calculateDevelopmentMetrics(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Courses created in period
    const coursesCreated = await Course.countDocuments({
      instructorId: teacherId,
      createdAt: { $gte: periodStart, $lte: periodEnd }
    });

    // Content updates (would come from course modification tracking)
    const contentUpdates = Math.floor(Math.random() * 20);

    // Skills improvement (would come from teacher profile updates)
    const skillsImprovement = 60 + Math.random() * 40;

    // Certifications earned (would come from teacher achievements)
    const certificationEarned = Math.floor(Math.random() * 3);

    // Calculate development score
    const score = Math.round(
      (coursesCreated * 20) + // New courses (0-100+)
      (contentUpdates * 2) + // Updates (0-40+)
      (skillsImprovement * 0.4) + // Skills (0-40)
      (certificationEarned * 10) // Certifications (0-30)
    );

    return {
      score: Math.min(100, score),
      coursesCreated,
      contentUpdates,
      skillsImprovement: Math.round(skillsImprovement * 100) / 100,
      certificationEarned
    };
  }

  /**
   * Calculate teacher analytics data
   */
  private async calculateTeacherAnalytics(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<TeacherAnalytics> {
    // Course statistics
    const coursesActive = await Course.countDocuments({
      instructorId: teacherId,
      status: 'published',
      isActive: true
    });

    const coursesCompleted = await Course.countDocuments({
      instructorId: teacherId,
      status: 'completed'
    });

    // Student statistics
    const enrollmentStats = await Enrollment.aggregate([
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
          enrolledAt: { $gte: periodStart, $lte: periodEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          uniqueStudents: { $addToSet: '$studentId' },
          averageClassSize: { $avg: '$course.enrollmentCount' }
        }
      }
    ]);

    const stats = enrollmentStats[0] || {
      totalEnrollments: 0,
      uniqueStudents: [],
      averageClassSize: 0
    };

    // Feedback analysis
    const feedback = await this.analyzeFeedback(teacherId, periodStart, periodEnd);

    // Trends analysis
    const trends = await this.calculateTrends(teacherId, periodStart, periodEnd);

    return {
      coursesActive,
      coursesCompleted,
      totalStudents: stats.uniqueStudents.length,
      totalEnrollments: stats.totalEnrollments,
      averageClassSize: Math.round(stats.averageClassSize * 100) / 100,
      feedback,
      trends,
      ranking: {
        overallRank: 0, // Will be calculated later
        departmentRank: 0,
        categoryRank: 0,
        totalTeachers: 0,
        percentile: 0
      }
    };
  }

  /**
   * Analyze feedback sentiment and content
   */
  private async analyzeFeedback(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ) {
    const ratings = await TeacherRating.find({
      teacherId,
      'ratingContext.ratingDate': { $gte: periodStart, $lte: periodEnd },
      status: 'active'
    });

    let positive = 0;
    let neutral = 0;
    let negative = 0;
    const compliments: string[] = [];
    const complaints: string[] = [];
    const suggestions: string[] = [];

    ratings.forEach(rating => {
      // Categorize by overall rating
      if (rating.overallRating >= 4) positive++;
      else if (rating.overallRating >= 3) neutral++;
      else negative++;

      // Extract feedback text (simplified)
      if (rating.feedback.positiveAspects) {
        compliments.push(rating.feedback.positiveAspects);
      }
      if (rating.feedback.improvementAreas) {
        complaints.push(rating.feedback.improvementAreas);
      }
      if (rating.feedback.additionalComments) {
        suggestions.push(rating.feedback.additionalComments);
      }
    });

    return {
      positive,
      neutral,
      negative,
      commonCompliments: this.extractCommonTerms(compliments),
      commonComplaints: this.extractCommonTerms(complaints),
      improvementSuggestions: this.extractCommonTerms(suggestions)
    };
  }

  /**
   * Calculate performance trends
   */
  private async calculateTrends(
    teacherId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ) {
    // This would involve comparing current period with previous periods
    // For now, returning simulated trends
    
    return {
      enrollmentTrend: 'increasing' as const,
      ratingTrend: 'improving' as const,
      completionTrend: 'stable' as const,
      engagementTrend: 'increasing' as const
    };
  }

  /**
   * Update teacher ranking compared to other teachers
   */
  private async updateTeacherRanking(teacherScore: ITeacherScore): Promise<void> {
    // Get all active teacher scores for the same period type
    const allScores = await TeacherScore.find({
      periodType: teacherScore.periodType,
      status: 'active'
    }).sort({ overallScore: -1 });

    const totalTeachers = allScores.length;
    const currentRank = allScores.findIndex(score => 
      score.teacherId.toString() === teacherScore.teacherId.toString()
    ) + 1;

    teacherScore.analytics.ranking = {
      overallRank: currentRank,
      departmentRank: currentRank,
      categoryRank: currentRank,
      totalTeachers: totalTeachers,
      percentile: Math.round(((totalTeachers - currentRank + 1) / totalTeachers) * 100)
    };
  }

  /**
   * Helper methods
   */
  private async getPreviousScore(
    teacherId: Types.ObjectId,
    currentPeriodStart: Date,
    periodType: string
  ): Promise<ITeacherScore | null> {
    return TeacherScore.findOne({
      teacherId,
      periodType,
      periodEnd: { $lt: currentPeriodStart }
    }).sort({ periodEnd: -1 });
  }

  private calculateTargetScore(currentScore: number, previousScore?: number): number {
    if (!previousScore) return Math.min(100, currentScore + 10);
    
    const improvement = currentScore - previousScore;
    if (improvement >= 0) {
      return Math.min(100, currentScore + 5);
    } else {
      return Math.min(100, previousScore);
    }
  }

  private identifyImprovementAreas(metrics: TeacherPerformanceMetrics): string[] {
    const areas: string[] = [];
    
    if (metrics.studentRating.score < 70) areas.push('Student Satisfaction');
    if (metrics.coursePerformance.score < 70) areas.push('Course Performance');
    if (metrics.engagement.score < 70) areas.push('Student Engagement');
    if (metrics.development.score < 70) areas.push('Professional Development');
    
    return areas;
  }

  private identifyStrengthAreas(metrics: TeacherPerformanceMetrics): string[] {
    const areas: string[] = [];
    
    if (metrics.studentRating.score >= 80) areas.push('Student Satisfaction');
    if (metrics.coursePerformance.score >= 80) areas.push('Course Performance');
    if (metrics.engagement.score >= 80) areas.push('Student Engagement');
    if (metrics.development.score >= 80) areas.push('Professional Development');
    
    return areas;
  }

  private async generateActionPlan(metrics: TeacherPerformanceMetrics): Promise<string[]> {
    const plan: string[] = [];
    
    if (metrics.studentRating.score < 70) {
      plan.push('Improve response time to student questions');
      plan.push('Enhance course content clarity');
    }
    
    if (metrics.coursePerformance.score < 70) {
      plan.push('Review course structure and pacing');
      plan.push('Implement additional student support measures');
    }
    
    if (metrics.engagement.score < 70) {
      plan.push('Increase forum participation');
      plan.push('Improve assignment feedback quality');
    }
    
    if (metrics.development.score < 70) {
      plan.push('Attend professional development workshops');
      plan.push('Update course content regularly');
    }
    
    return plan;
  }

  private calculateNextReviewDate(periodType: string): Date {
    const nextReview = new Date();
    
    switch (periodType) {
      case 'monthly':
        nextReview.setMonth(nextReview.getMonth() + 1);
        break;
      case 'quarterly':
        nextReview.setMonth(nextReview.getMonth() + 3);
        break;
      case 'yearly':
        nextReview.setFullYear(nextReview.getFullYear() + 1);
        break;
      default:
        nextReview.setMonth(nextReview.getMonth() + 1);
    }
    
    return nextReview;
  }

  private async calculateAchievements(
    teacherId: Types.ObjectId,
    metrics: TeacherPerformanceMetrics,
    analytics: TeacherAnalytics
  ) {
    const achievements = {
      badges: [] as string[],
      milestones: [] as string[],
      recognitions: [] as string[],
      awards: [] as string[]
    };

    // Badges based on performance
    if (metrics.studentRating.averageRating >= 4.5) achievements.badges.push('Top Rated Instructor');
    if (metrics.coursePerformance.completionRate >= 90) achievements.badges.push('High Completion Rate');
    if (analytics.totalStudents >= 1000) achievements.badges.push('Popular Instructor');

    // Milestones
    if (analytics.coursesActive >= 10) achievements.milestones.push('10 Active Courses');
    if (analytics.totalEnrollments >= 5000) achievements.milestones.push('5000 Total Enrollments');

    return achievements;
  }

  private calculateConfidenceLevel(totalStudents: number, activeCourses: number): number {
    // Calculate confidence based on data volume
    let confidence = 50; // Base confidence
    
    confidence += Math.min(30, totalStudents / 10); // Up to 30 points for student volume
    confidence += Math.min(20, activeCourses * 5); // Up to 20 points for course volume
    
    return Math.min(100, Math.round(confidence));
  }

  private extractCommonTerms(texts: string[]): string[] {
    // Simplified term extraction - in reality would use NLP
    const commonTerms = ['excellent', 'helpful', 'clear', 'engaging', 'responsive'];
    return commonTerms.slice(0, 3);
  }

  /**
   * Generate teacher score for specific period
   */
  async generateTeacherScore(
    teacherId: Types.ObjectId,
    periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<ITeacherScore> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (periodType) {
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
    }

    const teacherScore = await this.calculateTeacherScore(teacherId, {
      periodStart,
      periodEnd,
      periodType
    });

    await teacherScore.save();
    return teacherScore;
  }

  /**
   * Get teacher leaderboard
   */
  async getTeacherLeaderboard(
    limit: number = 10,
    periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ) {
    return TeacherScore.find({ 
      periodType, 
      status: 'active' 
    })
      .populate('teacherId', 'firstName lastName')
      .sort({ overallScore: -1 })
      .limit(limit);
  }

  /**
   * Auto-generate scores for all teachers
   */
  async autoGenerateAllTeacherScores(periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<void> {
    const teachers = await User.find({ roles: 'teacher', isActive: true });
    
    for (const teacher of teachers) {
      try {
        await this.generateTeacherScore(teacher._id, periodType);
      } catch (error) {

      }
    }
  }
}

export default TeacherAnalyticsService.getInstance();
