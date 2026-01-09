import { Types } from 'mongoose';
import CourseApproval, { ICourseApproval } from '../../models/core/CourseApproval';
import Course, { ICourse } from '../../models/core/Course';
import User, { IUser } from '../../models/core/User';
import { EmailNotificationService } from '../email/email-notification.service';

export interface ReviewAssignment {
  reviewerType: 'primary' | 'content' | 'technical' | 'quality' | 'final';
  reviewerId: Types.ObjectId;
  priority: number;
  expertise: string[];
}

export interface ApprovalWorkflowConfig {
  stages: {
    name: string;
    requiredReviewers: string[];
    autoAdvance: boolean;
    timeLimit: number; // hours
  }[];
  slaTargets: {
    [priority: string]: number; // hours
  };
  autoAssignment: {
    enabled: boolean;
    criteria: {
      [reviewerType: string]: {
        maxWorkload: number;
        expertise: string[];
        availability: boolean;
      };
    };
  };
}

class CourseApprovalService {
  private static instance: CourseApprovalService;
  private config: ApprovalWorkflowConfig;

  private constructor() {
    this.config = {
      stages: [
        {
          name: 'initial_review',
          requiredReviewers: ['primary'],
          autoAdvance: false,
          timeLimit: 24
        },
        {
          name: 'content_review',
          requiredReviewers: ['content'],
          autoAdvance: false,
          timeLimit: 48
        },
        {
          name: 'quality_assurance',
          requiredReviewers: ['technical', 'quality'],
          autoAdvance: false,
          timeLimit: 24
        },
        {
          name: 'final_approval',
          requiredReviewers: ['final'],
          autoAdvance: true,
          timeLimit: 12
        }
      ],
      slaTargets: {
        low: 120,     // 5 days
        normal: 72,   // 3 days
        high: 48,     // 2 days
        urgent: 24    // 1 day
      },
      autoAssignment: {
        enabled: true,
        criteria: {
          primary: {
            maxWorkload: 10,
            expertise: ['general'],
            availability: true
          },
          content: {
            maxWorkload: 8,
            expertise: ['content_design', 'instructional_design'],
            availability: true
          },
          technical: {
            maxWorkload: 6,
            expertise: ['video_production', 'audio_engineering', 'platform_technical'],
            availability: true
          },
          quality: {
            maxWorkload: 8,
            expertise: ['quality_assurance', 'user_experience'],
            availability: true
          },
          final: {
            maxWorkload: 5,
            expertise: ['management', 'business_approval'],
            availability: true
          }
        }
      }
    };
  }

  public static getInstance(): CourseApprovalService {
    if (!CourseApprovalService.instance) {
      CourseApprovalService.instance = new CourseApprovalService();
    }
    return CourseApprovalService.instance;
  }

  /**
   * Submit course for approval
   */
  async submitCourseForApproval(
    courseId: Types.ObjectId,
    submissionType: 'new_course' | 'course_update' | 'content_revision' | 'resubmission' = 'new_course',
    targetPublishDate?: Date
  ): Promise<ICourseApproval> {
    try {
      // Get course details
      const course = await Course.findById(courseId).populate('instructorId');
      if (!course) {
        throw new Error('Course not found');
      }

      const instructor = course.instructorId as unknown as IUser;

      // Check if there's already a pending approval
      const existingApproval = await CourseApproval.findOne({
        courseId,
        status: { $in: ['pending', 'under_review', 'revision_required'] }
      });

      if (existingApproval && submissionType !== 'resubmission') {
        throw new Error('Course already has a pending approval');
      }

      // Determine priority based on instructor tier and course type
      const priority = this.calculatePriority(instructor, submissionType, targetPublishDate);

      // Perform initial content analysis
      const contentAnalysis = await this.analyzeContent(course);

      // Create approval record
      const approval = new CourseApproval({
        courseId,
        instructorId: instructor._id,
        submissionType,
        priority,
        targetPublishDate,
        contentAnalysis,
        sla: {
          targetReviewTime: this.config.slaTargets[priority]
        },
        analytics: {
          instructorReliability: await this.calculateInstructorReliability(instructor._id),
          marketPotential: await this.calculateMarketPotential(course),
          categoryAverage: await this.getCategoryAverage((course as any).category),
          platformAverage: await this.getPlatformAverage()
        }
      });

      // Add initial audit log
      approval.auditLog.push({
        action: 'course_submitted',
        timestamp: new Date(),
        userId: instructor._id,
        userRole: 'instructor',
        details: `Course submitted for ${submissionType}`
      });

      // Auto-assign reviewers if enabled
      if (this.config.autoAssignment.enabled) {
        await this.autoAssignReviewers(approval);
      }

      // Run AI pre-review if available
      await this.runAIPreReview(approval);

      await approval.save();

      // Update course status
      (course as any).approvalStatus = 'pending_approval';
      (course as any).approvalId = approval._id;
      await course.save();

      // Send notifications
      await this.sendSubmissionNotifications(approval);

      return approval;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Assign reviewer to approval
   */
  async assignReviewer(
    approvalId: Types.ObjectId,
    reviewerType: string,
    reviewerId: Types.ObjectId,
    assignedBy: Types.ObjectId
  ): Promise<ICourseApproval> {
    const approval = await CourseApproval.findById(approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    // Check reviewer availability and workload
    const reviewer = await User.findById(reviewerId);
    if (!reviewer || !reviewer.roles.includes('admin')) {
      throw new Error('Invalid reviewer');
    }

    const currentWorkload = await this.getReviewerWorkload(reviewerId);
    const maxWorkload = this.config.autoAssignment.criteria[reviewerType]?.maxWorkload || 10;

    if (currentWorkload >= maxWorkload) {
      throw new Error(`Reviewer workload exceeds maximum (${currentWorkload}/${maxWorkload})`);
    }

    // Assign reviewer
    (approval as any).assignReviewer(reviewerType, reviewerId);
    
    // Update status if this is the first assignment
    if (approval.status === 'pending') {
      approval.status = 'under_review';
      approval.reviewProcess.currentStage = 'initial_review';
      approval.reviewTeam.reviewStartDate = new Date();
    }

    (approval as any).addAuditLog(
      'reviewer_assigned',
      assignedBy,
      'admin',
      `${reviewerType} reviewer assigned: ${reviewer.firstName} ${reviewer.lastName}`
    );

    await approval.save();

    // Send notification to reviewer
    await this.sendReviewerAssignmentNotification(approval, reviewerId, reviewerType);

    return approval;
  }

  /**
   * Submit review feedback
   */
  async submitReview(
    approvalId: Types.ObjectId,
    reviewerId: Types.ObjectId,
    reviewData: {
      reviewerType: 'content' | 'technical' | 'quality' | 'admin';
      score: number;
      category: string;
      feedback: string;
      issues: Array<{
        severity: 'low' | 'medium' | 'high' | 'critical';
        category: string;
        description: string;
        location?: string;
        suggestion?: string;
      }>;
      approved: boolean;
      criteriaChecklist?: any;
    }
  ): Promise<ICourseApproval> {
    const approval = await CourseApproval.findById(approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    // Verify reviewer is assigned to this approval
    const reviewerAssigned = this.isReviewerAssigned(approval, reviewerId);
    if (!reviewerAssigned) {
      throw new Error('Reviewer not assigned to this approval');
    }

    // Add review to feedback
    approval.feedback.reviews.push({
      reviewerId,
      reviewerType: reviewData.reviewerType,
      reviewDate: new Date(),
      score: reviewData.score,
      category: reviewData.category,
      feedback: reviewData.feedback,
      issues: reviewData.issues.map(issue => ({
        ...issue,
        resolved: false
      })),
      approved: reviewData.approved
    });

    // Update criteria checklist if provided
    if (reviewData.criteriaChecklist) {
      this.updateCriteriaChecklist(approval, reviewData.criteriaChecklist);
    }

    // Calculate new overall score
    approval.feedback.overallScore = (approval as any).calculateOverallScore();

    // Check if stage can advance
    const canAdvance = this.checkStageCompletion(approval);
    if (canAdvance) {
      (approval as any).moveToNextStage();
    }

    // Auto-approve/reject based on score and criteria
    const autoDecision = this.calculateAutoDecision(approval);
    if (autoDecision) {
      approval.status = autoDecision;
      approval.feedback.recommendation = autoDecision === 'approved' ? 'approve' : 'reject';
    }

    (approval as any).addAuditLog(
      'review_submitted',
      reviewerId,
      'reviewer',
      `Review submitted with score ${reviewData.score}/100`
    );

    await approval.save();

    // Send notifications based on review outcome
    await this.sendReviewNotifications(approval, reviewData);

    return approval;
  }

  /**
   * Make final approval decision
   */
  async makeFinalDecision(
    approvalId: Types.ObjectId,
    decision: 'approved' | 'rejected',
    decisionMaker: Types.ObjectId,
    reason?: string,
    conditions?: string[]
  ): Promise<ICourseApproval> {
    const approval = await CourseApproval.findById(approvalId)
      .populate('courseId')
      .populate('instructorId');

    if (!approval) {
      throw new Error('Approval not found');
    }

    const course = approval.courseId as ICourse;
    const instructor = approval.instructorId as IUser;

    // Update approval decision
    approval.decision = {
      finalDecision: decision,
      decisionDate: new Date(),
      decisionMaker,
      decisionReason: reason,
      conditions: conditions || []
    };

    approval.status = decision;
    approval.reviewProcess.currentStage = 'completed';
    approval.reviewTeam.reviewCompletionDate = new Date();

    // Calculate final analytics
    const reviewTime = (Date.now() - approval.submissionDate.getTime()) / (1000 * 60 * 60);
    approval.analytics.totalReviewTime = reviewTime;
    approval.sla.actualReviewTime = reviewTime;

    if (decision === 'approved') {
      // Update course status
      (course as any).approvalStatus = 'approved';  
      (course as any).status = 'approved';
      
      // Set publish date if not specified
      if (!approval.decision.publishDate) {
        approval.decision.publishDate = new Date();
      }
      
      await course.save();
    } else {
      // Update course status for rejection
      (course as any).approvalStatus = 'rejected';
      
      // Set resubmission guidelines
      approval.decision.resubmissionAllowed = true;
      approval.decision.appealEligible = true;
      approval.decision.resubmissionGuidelines = this.generateResubmissionGuidelines(approval);
      
      await course.save();
    }

    (approval as any).addAuditLog(
      'final_decision',
      decisionMaker,
      'admin',
      `Course ${decision}: ${reason || 'No reason provided'}`
    );

    await approval.save();

    // Send final notifications
    await this.sendFinalDecisionNotifications(approval, decision);

    // Update instructor statistics
    await this.updateInstructorStats(instructor._id, decision);

    return approval;
  }

  /**
   * Get approval dashboard data
   */
  async getApprovalDashboard(reviewerId?: Types.ObjectId) {
    // Get queue statistics
    const queueStats = await CourseApproval.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageScore: { $avg: '$feedback.overallScore' },
          averageReviewTime: { $avg: '$analytics.totalReviewTime' }
        }
      }
    ]);

    // Get reviewer workload
    let reviewerStats = null;
    if (reviewerId) {
      reviewerStats = await this.getReviewerStats(reviewerId);
    }

    // Get SLA performance
    const slaStats = await CourseApproval.aggregate([
      {
        $group: {
          _id: '$sla.slaStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await CourseApproval.find({
      $or: [
        { status: { $in: ['pending', 'under_review'] } },
        { lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    })
      .populate('courseId', 'title thumbnail')
      .populate('instructorId', 'firstName lastName')
      .sort({ lastUpdated: -1 })
      .limit(20);

    // Get priority distribution
    const priorityStats = await CourseApproval.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'under_review', 'revision_required'] }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      queueStats,
      reviewerStats,
      slaStats,
      recentActivity,
      priorityStats,
      summary: {
        totalPending: queueStats.find(s => s._id === 'pending')?.count || 0,
        totalUnderReview: queueStats.find(s => s._id === 'under_review')?.count || 0,
        totalRevisionRequired: queueStats.find(s => s._id === 'revision_required')?.count || 0,
        slaOnTrack: slaStats.find(s => s._id === 'on_track')?.count || 0,
        slaBreached: slaStats.find(s => s._id === 'breached')?.count || 0
      }
    };
  }

  /**
   * Calculate priority based on various factors
   */
  private calculatePriority(
    instructor: IUser,
    submissionType: string,
    targetPublishDate?: Date
  ): 'low' | 'normal' | 'high' | 'urgent' {
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

    // Check instructor tier
    if ((instructor as any).subscriptionTier === 'enterprise') {
      priority = 'high';
    } else if ((instructor as any).subscriptionTier === 'premium') {
      priority = 'normal';
    }

    // Check target publish date
    if (targetPublishDate) {
      const daysUntilTarget = (targetPublishDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilTarget <= 2) {
        priority = 'urgent';
      } else if (daysUntilTarget <= 7) {
        priority = 'high';
      }
    }

    // Check submission type
    if (submissionType === 'resubmission') {
      priority = priority;
    }

    return priority;
  }

  /**
   * Analyze course content automatically
   */
  private async analyzeContent(course: ICourse): Promise<any> {
    // This would integrate with AI services for content analysis
    // For now, return basic analysis based on course structure

    const sections = (course as any).sections || [];
    const totalLectures = sections.reduce((total: number, section: any) => total + (section.lessons?.length || 0), 0);
    const totalDuration = sections.reduce((total: number, section: any) => 
      total + (section.lessons?.reduce((sectionTotal: number, lesson: any) => sectionTotal + (lesson.duration || 0), 0) || 0), 0);

    return {
      hasLearningObjectives: !!course.learningObjectives && course.learningObjectives.length > 0,
      hasCourseSyllabus: !!course.description && course.description.length > 100,
      hasAssessments: sections.some((section: any) => 
        section.lessons?.some((lesson: any) => lesson.type === 'quiz' || lesson.type === 'assignment')
      ),
      hasResources: sections.some((section: any) => 
        section.lessons?.some((lesson: any) => lesson.resources && lesson.resources.length > 0)
      ),
      lectureCount: totalLectures,
      totalDuration: totalDuration,
      videoQuality: 'medium', // Would be determined by video analysis
      audioQuality: 'medium', // Would be determined by audio analysis
      contentOriginality: 85, // Would be determined by plagiarism check
      grammarScore: 90, // Would be determined by grammar analysis
      technicalAccuracy: 88, // Would be determined by subject matter expert review
      interactivityLevel: totalLectures > 0 ? 'medium' : 'low',
      practicalExamples: course.description?.includes('example') || false,
      realWorldApplications: course.description?.includes('real-world') || false,
      studentEngagementPotential: 75, // Would be calculated based on content analysis
      copyrightCompliance: true, // Would be checked against copyright databases
      contentAppropriate: true, // Would be checked for inappropriate content
      accessibilityCompliant: false, // Would be checked for accessibility standards
      platformGuidelinesCompliant: true // Would be checked against platform guidelines
    };
  }

  /**
   * Auto-assign reviewers based on workload and expertise
   */
  private async autoAssignReviewers(approval: ICourseApproval): Promise<void> {
    const reviewerTypes = ['primary', 'content', 'technical', 'quality'];

    for (const reviewerType of reviewerTypes) {
      const availableReviewers = await this.findAvailableReviewers(reviewerType);
      
      if (availableReviewers.length > 0) {
        // Select reviewer with lowest workload
        const selectedReviewer = availableReviewers[0];
        (approval as any).assignReviewer(reviewerType, selectedReviewer._id);
      }
    }
  }

  /**
   * Find available reviewers for a specific type
   */
  private async findAvailableReviewers(reviewerType: string): Promise<IUser[]> {
    const criteria = this.config.autoAssignment.criteria[reviewerType];
    if (!criteria) return [];

    // Get all admin users with required expertise
    const potentialReviewers = await User.find({
      roles: 'admin',
      isActive: true,
      // Add expertise matching logic here
    });

    // Calculate current workload for each reviewer
    const reviewersWithWorkload = await Promise.all(
      potentialReviewers.map(async (reviewer) => {
        const workload = await this.getReviewerWorkload(reviewer._id);
        return { reviewer, workload };
      })
    );

    // Filter by workload and sort by availability
    return reviewersWithWorkload
      .filter(({ workload }) => workload < criteria.maxWorkload)
      .sort((a, b) => a.workload - b.workload)
      .map(({ reviewer }) => reviewer);
  }

  /**
   * Get reviewer's current workload
   */
  private async getReviewerWorkload(reviewerId: Types.ObjectId): Promise<number> {
    return await CourseApproval.countDocuments({
      $or: [
        { 'reviewTeam.primaryReviewer': reviewerId },
        { 'reviewTeam.contentReviewer': reviewerId },
        { 'reviewTeam.technicalReviewer': reviewerId },
        { 'reviewTeam.qualityAssuranceReviewer': reviewerId },
        { 'reviewTeam.finalApprover': reviewerId }
      ],
      status: { $in: ['pending', 'under_review', 'revision_required'] }
    });
  }

  /**
   * Run AI pre-review analysis
   */
  private async runAIPreReview(approval: ICourseApproval): Promise<void> {
    // This would integrate with AI services for automated content review
    // For now, simulate AI analysis

    const course = await Course.findById(approval.courseId);
    if (!course) return;

    const aiScore = Math.floor(Math.random() * 40) + 60; // Random score 60-100
    const recommendations = [
      'Add more interactive elements',
      'Improve video quality',
      'Include practical exercises',
      'Clarify learning objectives'
    ];

    approval.automation.aiPreReview = {
      completed: true,
      score: aiScore,
      recommendations: recommendations.slice(0, Math.floor(Math.random() * 3) + 1),
      flaggedIssues: aiScore < 80 ? ['Video quality needs improvement'] : [],
      confidenceLevel: Math.floor(Math.random() * 30) + 70
    };

    approval.automation.automatedChecksCompleted = true;
  }

  /**
   * Check if reviewer is assigned to approval
   */
  private isReviewerAssigned(approval: ICourseApproval, reviewerId: Types.ObjectId): boolean {
    const team = approval.reviewTeam;
    return [
      team.primaryReviewer,
      team.contentReviewer,
      team.technicalReviewer,
      team.qualityAssuranceReviewer,
      team.finalApprover
    ].some(id => id && id.toString() === reviewerId.toString());
  }

  /**
   * Check if current stage is complete and can advance
   */
  private checkStageCompletion(approval: ICourseApproval): boolean {
    const currentStage = approval.reviewProcess.currentStage;
    const stageConfig = this.config.stages.find(s => s.name === currentStage);
    
    if (!stageConfig) return false;

    // Check if all required reviewers have submitted reviews
    const requiredReviewers = stageConfig.requiredReviewers;
    const submittedReviews = approval.feedback.reviews.map(r => r.reviewerType);

    return requiredReviewers.every(type => submittedReviews.includes(type as any));
  }

  /**
   * Calculate auto decision based on scores and criteria
   */
  private calculateAutoDecision(approval: ICourseApproval): 'approved' | 'rejected' | null {
    const overallScore = approval.feedback.overallScore;
    const criticalIssues = approval.feedback.reviews.some(review =>
      review.issues.some(issue => issue.severity === 'critical')
    );

    if (criticalIssues) {
      return 'rejected';
    }

    if (overallScore >= 90) {
      return 'approved';
    }

    if (overallScore < 60) {
      return 'rejected';
    }

    return null; // Requires manual decision
  }

  /**
   * Update criteria checklist based on review
   */
  private updateCriteriaChecklist(approval: ICourseApproval, checklist: any): void {
    // Update criteria based on reviewer feedback
    Object.keys(checklist).forEach(category => {
      if (approval.criteria[category as keyof typeof approval.criteria]) {
        Object.assign(approval.criteria[category as keyof typeof approval.criteria], checklist[category]);
      }
    });
  }

  /**
   * Generate resubmission guidelines
   */
  private generateResubmissionGuidelines(approval: ICourseApproval): string[] {
    const guidelines: string[] = [];
    const issues = approval.feedback.reviews.flatMap(review => review.issues);

    // Group issues by category and generate specific guidelines
    const issueCategories = [...new Set(issues.map(issue => issue.category))];
    
    issueCategories.forEach(category => {
      const categoryIssues = issues.filter(issue => issue.category === category);
      const highSeverityIssues = categoryIssues.filter(issue => 
        issue.severity === 'high' || issue.severity === 'critical'
      );

      if (highSeverityIssues.length > 0) {
        guidelines.push(`Address ${category} issues: ${highSeverityIssues[0].description}`);
      }
    });

    return guidelines;
  }

  /**
   * Calculate instructor reliability score
   */
  private async calculateInstructorReliability(instructorId: Types.ObjectId): Promise<number> {
    const approvals = await CourseApproval.find({
      instructorId,
      status: { $in: ['approved', 'rejected'] }
    });

    if (approvals.length === 0) return 50;

    const approvedCount = approvals.filter(a => a.status === 'approved').length;
    const averageScore = approvals.reduce((sum, a) => sum + a.feedback.overallScore, 0) / approvals.length;

    return Math.round((approvedCount / approvals.length) * 0.6 * 100 + averageScore * 0.4);
  }

  /**
   * Calculate market potential for course
   */
  private async calculateMarketPotential(course: ICourse): Promise<number> {
    // This would analyze market demand, competition, pricing, etc.
    // For now, return a simulated score
    return Math.floor(Math.random() * 40) + 60;
  }

  /**
   * Get category average score
   */
  private async getCategoryAverage(category: string): Promise<number> {
    const result = await CourseApproval.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $match: { 'course.category': category, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$feedback.overallScore' }
        }
      }
    ]);

    return result[0]?.averageScore || 75;
  }

  /**
   * Get platform average score
   */
  private async getPlatformAverage(): Promise<number> {
    const result = await CourseApproval.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$feedback.overallScore' }
        }
      }
    ]);

    return result[0]?.averageScore || 75;
  }

  /**
   * Get reviewer statistics
   */
  private async getReviewerStats(reviewerId: Types.ObjectId) {
    const workload = await this.getReviewerWorkload(reviewerId);
    
    const completedReviews = await CourseApproval.find({
      'feedback.reviews.reviewerId': reviewerId,
      status: { $in: ['approved', 'rejected'] }
    });

    const averageScore = completedReviews.length > 0 
      ? completedReviews.reduce((sum, approval) => {
          const review = approval.feedback.reviews.find(r => r.reviewerId.toString() === reviewerId.toString());
          return sum + (review?.score || 0);
        }, 0) / completedReviews.length
      : 0;

    return {
      currentWorkload: workload,
      completedReviews: completedReviews.length,
      averageScore: Math.round(averageScore),
      approvalRate: completedReviews.length > 0 
        ? completedReviews.filter(a => a.status === 'approved').length / completedReviews.length * 100
        : 0
    };
  }

  /**
   * Update instructor statistics after approval decision
   */
  private async updateInstructorStats(instructorId: Types.ObjectId, decision: string): Promise<void> {
    // Update instructor's approval statistics
    const instructor = await User.findById(instructorId);
    if (!instructor) return;

    if (!(instructor as any).instructorStats) {
      (instructor as any).instructorStats = {
        totalCourses: 0,
        approvedCourses: 0,
        rejectedCourses: 0,
        averageApprovalTime: 0,
        lastApprovalDate: new Date()
      };
    }

    (instructor as any).instructorStats.totalCourses += 1;
    if (decision === 'approved') {
      (instructor as any).instructorStats.approvedCourses += 1;
    } else {
      (instructor as any).instructorStats.rejectedCourses += 1;
    }
    (instructor as any).instructorStats.lastApprovalDate = new Date();

    await instructor.save();
  }

  /**
   * Send submission notifications
   */
  private async sendSubmissionNotifications(approval: ICourseApproval): Promise<void> {
    const course = await Course.findById(approval.courseId);
    const instructor = await User.findById(approval.instructorId);

    if (!course || !instructor) return;

    // Send confirmation to instructor
    await EmailNotificationService.getInstance().sendEmail({
      to: instructor.email,
      subject: 'Course Submitted for Review',
      html: `<p>Dear ${instructor.firstName},</p><p>Your course "${course.title}" has been submitted for review.</p>`,
      type: 'course_enrollment',
      templateData: {
        instructorName: `${instructor.firstName} ${instructor.lastName}`,
        courseTitle: course.title,
        approvalId: approval.approvalId,
        expectedReviewTime: `${approval.sla.targetReviewTime} hours`
      }
    });

    // Notify admin team
    await EmailNotificationService.getInstance().sendEmail({
      to: 'admin@lms.com',
      subject: 'New Course Submission',
      html: `<p>New course submission: "${course.title}" by ${instructor.firstName} ${instructor.lastName}</p>`,
      type: 'course_enrollment'
    });
  }

  /**
   * Send reviewer assignment notifications
   */
  private async sendReviewerAssignmentNotification(
    approval: ICourseApproval,
    reviewerId: Types.ObjectId,
    reviewerType: string
  ): Promise<void> {
    const reviewer = await User.findById(reviewerId);
    const course = await Course.findById(approval.courseId);

    if (!reviewer || !course) return;

    await EmailNotificationService.getInstance().sendEmail({
      to: reviewer.email,
      subject: 'Course Review Assignment',
      html: `<p>Dear ${reviewer.firstName},</p><p>You have been assigned to review course: "${course.title}"</p>`,
      type: 'course_enrollment'
    });
  }

  /**
   * Send review notifications
   */
  private async sendReviewNotifications(approval: ICourseApproval, reviewData: any): Promise<void> {
    const instructor = await User.findById(approval.instructorId);
    const course = await Course.findById(approval.courseId);

    if (!instructor || !course) return;

    if (!reviewData.approved) {
      // Send revision request to instructor
      await EmailNotificationService.getInstance().sendEmail({
        to: instructor.email,
        subject: 'Course Review Feedback - Revisions Required',
        html: `<p>Dear ${instructor.firstName},</p><p>Your course "${course.title}" requires revisions. Score: ${reviewData.score}/100</p>`,
        type: 'course_enrollment'
      });
    }
  }

  /**
   * Send final decision notifications
   */
  private async sendFinalDecisionNotifications(approval: ICourseApproval, decision: string): Promise<void> {
    const instructor = await User.findById(approval.instructorId);
    const course = await Course.findById(approval.courseId);

    if (!instructor || !course) return;

    const template = decision === 'approved' ? 'course_approved' : 'course_rejected';
    const subject = decision === 'approved' ? 'Course Approved!' : 'Course Review Decision';

    await EmailNotificationService.getInstance().sendEmail({
      to: instructor.email,
      subject,
      html: `<p>Dear ${instructor.firstName},</p><p>Your course "${course.title}" has been ${decision}.</p>`,
      type: 'course_enrollment'
    });
  }
}

export default CourseApprovalService.getInstance();
