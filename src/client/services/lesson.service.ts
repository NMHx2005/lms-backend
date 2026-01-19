import { Lesson as LessonModel, Section as SectionModel, Enrollment as EnrollmentModel, LessonProgress as LessonProgressModel, Course as CourseModel, User as UserModel } from '../../shared/models';
import { ILesson } from '../../shared/models/core/Lesson';

export class ClientLessonService {
  // Get lesson by ID (for enrolled students and course instructors)
  static async getLessonById(lessonId: string, userId: string): Promise<ILesson> {
    // Check if user is enrolled in the course
    const lesson = await LessonModel.findById(lessonId)
      .populate('sectionId', 'title order')
      .populate('courseId', 'title domain level');

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if user is the course instructor
    const course = await CourseModel.findById(lesson.courseId);
    const isInstructor = course && course.instructorId.toString() === userId;

    // Check enrollment (if not instructor)
    if (!isInstructor) {
      const enrollment = await EnrollmentModel.findOne({
        courseId: lesson.courseId,
        studentId: userId,
        isActive: true
      });

      if (!enrollment) {
        throw new Error('You must be enrolled to access this lesson');
      }
    }

    return lesson;
  }

  // Get lessons by section (for enrolled students and course instructors)
  static async getLessonsBySection(sectionId: string, userId: string): Promise<ILesson[]> {
    // Check if user is enrolled in the course
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Check if user is the course instructor
    const course = await CourseModel.findById(section.courseId);
    const isInstructor = course && course.instructorId.toString() === userId;

    // Check enrollment (if not instructor)
    if (!isInstructor) {
      const enrollment = await EnrollmentModel.findOne({
        courseId: section.courseId,
        studentId: userId,
        isActive: true
      });

      if (!enrollment) {
        throw new Error('You must be enrolled to access this section');
      }
    }

    // Get lessons with basic info
    // Instructors see all lessons, students only see visible ones
    const query: any = { sectionId };
    if (!isInstructor) {
      query.isVisible = true;
    }

    const lessons = await LessonModel.find(query)
      .select('title type order estimatedTime isPreview isRequired duration isPublished content videoUrl fileUrl externalLink quizQuestions quizSettings assignmentDetails')
      .sort({ order: 1 });

    // Add progress information to each lesson and map fields
    const lessonsWithProgress = await Promise.all(
      lessons.map(async (lesson: any) => {
        const progress = await this.calculateLessonProgress(lesson._id.toString(), userId);
        const lessonObj = lesson.toObject();
        return {
          ...lessonObj,
          duration: lessonObj.estimatedTime || 0, // Map estimatedTime -> duration
          linkUrl: lessonObj.externalLink, // Map externalLink -> linkUrl
          progress
        };
      })
    );

    return lessonsWithProgress;
  }

  // Get lesson content (for enrolled students)
  static async getLessonContent(lessonId: string, userId: string): Promise<any> {
    const lesson = await this.getLessonById(lessonId, userId);

    // Add content-specific information based on lesson type
    const content = {
      ...lesson.toObject(),
      formattedDuration: (lesson as any).getFormattedDuration ? (lesson as any).getFormattedDuration() : 'N/A',
      isAccessible: true, // Could be based on prerequisites
      nextLesson: await this.getNextLesson(lessonId, userId),
      previousLesson: await this.getPreviousLesson(lessonId, userId)
    };

    return content;
  }

  // Get lesson progress
  static async getLessonProgress(lessonId: string, userId: string) {
    // Check enrollment
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const enrollment = await EnrollmentModel.findOne({
      courseId: lesson.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this lesson');
    }

    const progress = await this.calculateLessonProgress(lessonId, userId);

    return {
      lessonId,
      userId,
      ...progress,
      lastAccessed: enrollment.lastActivityAt,
      enrollmentDate: enrollment.enrolledAt
    };
  }

  // Get next lesson (for navigation)
  static async getNextLesson(lessonId: string, userId: string) {
    const currentLesson = await LessonModel.findById(lessonId);
    if (!currentLesson) {
      throw new Error('Lesson not found');
    }

    // Check enrollment
    const enrollment = await EnrollmentModel.findOne({
      courseId: currentLesson.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this course');
    }

    // Get next lesson in the same section
    let nextLesson = await LessonModel.findOne({
      sectionId: currentLesson.sectionId,
      order: { $gt: currentLesson.order },
      isVisible: true
    }).sort({ order: 1 });

    // If no next lesson in current section, get first lesson of next section
    if (!nextLesson) {
      const currentSection = await SectionModel.findById(currentLesson.sectionId);
      if (currentSection) {
        const nextSection = await SectionModel.findOne({
          courseId: currentLesson.courseId,
          order: { $gt: currentSection.order },
          isVisible: true
        }).sort({ order: 1 });

        if (nextSection) {
          nextLesson = await LessonModel.findOne({
            sectionId: nextSection._id,
            isVisible: true
          }).sort({ order: 1 });
        }
      }
    }

    if (!nextLesson) {
      return null; // No next lesson
    }

    // Add progress information
    const progress = await this.calculateLessonProgress(nextLesson._id.toString(), userId);

    return {
      ...nextLesson.toObject(),
      progress
    };
  }

  // Get previous lesson (for navigation)
  static async getPreviousLesson(lessonId: string, userId: string) {
    const currentLesson = await LessonModel.findById(lessonId);
    if (!currentLesson) {
      throw new Error('Lesson not found');
    }

    // Check enrollment
    const enrollment = await EnrollmentModel.findOne({
      courseId: currentLesson.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this course');
    }

    // Get previous lesson in the same section
    let previousLesson = await LessonModel.findOne({
      sectionId: currentLesson.sectionId,
      order: { $lt: currentLesson.order },
      isVisible: true
    }).sort({ order: -1 });

    // If no previous lesson in current section, get last lesson of previous section
    if (!previousLesson) {
      const currentSection = await SectionModel.findById(currentLesson.sectionId);
      if (currentSection) {
        const previousSection = await SectionModel.findOne({
          courseId: currentLesson.courseId,
          order: { $lt: currentSection.order },
          isVisible: true
        }).sort({ order: -1 });

        if (previousSection) {
          previousLesson = await LessonModel.findOne({
            sectionId: previousSection._id,
            isVisible: true
          }).sort({ order: -1 });
        }
      }
    }

    if (!previousLesson) {
      return null; // No previous lesson
    }

    // Add progress information
    const progress = await this.calculateLessonProgress(previousLesson._id.toString(), userId);

    return {
      ...previousLesson.toObject(),
      progress
    };
  }

  // Mark lesson as completed
  static async markLessonCompleted(lessonId: string, userId: string) {
    // Check enrollment
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const enrollment = await EnrollmentModel.findOne({
      courseId: lesson.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this lesson');
    }

    // Upsert lesson progress and mark completed
    await LessonProgressModel.findOneAndUpdate(
      { studentId: userId, lessonId, courseId: lesson.courseId, sectionId: lesson.sectionId },
      { $setOnInsert: { firstAccessedAt: new Date() }, $set: { isCompleted: true, lastAccessedAt: new Date() } },
      { upsert: true }
    );

    // ========== AUTO-CALCULATE ENROLLMENT PROGRESS ==========
    const course = await CourseModel.findById(lesson.courseId).select('totalLessons certificate');
    if (course && course.totalLessons > 0) {
      // Count total completed lessons for this course
      const completedLessonsCount = await LessonProgressModel.countDocuments({
        studentId: userId,
        courseId: lesson.courseId,
        isCompleted: true
      });

      // Calculate progress percentage (cap at 100 to prevent validation errors)
      const progressPercentage = Math.min(100, Math.round((completedLessonsCount / course.totalLessons) * 100));

      // Update enrollment progress
      enrollment.progress = progressPercentage;
      enrollment.lastActivityAt = new Date();

      // ========== AUTO-ISSUE CERTIFICATE IF COMPLETED ==========
      if (progressPercentage >= 100 && !enrollment.isCompleted) {
        enrollment.isCompleted = true;
        enrollment.completedAt = new Date();

        // Issue certificate if course has certification
        if (course.certificate && !enrollment.certificateIssued) {
          try {
            // Import CertificateService to generate certificate
            const CertificateService = (await import('../../shared/services/certificates/certificate.service')).default;

            // Generate certificate (this creates the Certificate record)
            await CertificateService.generateCertificate(
              userId,
              lesson.courseId.toString(),
              {
                generatePDF: true,
                sendEmail: false // Can set to true if email service is ready
              }
            );

            // Mark certificate as issued
            enrollment.certificateIssued = true;
            enrollment.certificateUrl = `/api/client/certificates/${enrollment._id}/download`;
          } catch (certError: any) {
            // Still mark as completed even if certificate generation fails
            // Certificate can be generated later via manual trigger
          }
        }

        // Update user stats
        await UserModel.findByIdAndUpdate(userId, {
          $inc: { 'stats.totalCoursesCompleted': 1 }
        });
      }

      await enrollment.save();
    }

    return {
      lessonId,
      userId,
      completed: true,
      completedAt: new Date(),
      message: 'Lesson marked as completed',
      progress: enrollment.progress,
      certificateIssued: enrollment.certificateIssued
    };
  }

  // Add time spent on a lesson (seconds)
  static async addTimeSpent(lessonId: string, userId: string, seconds: number) {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const enrollment = await EnrollmentModel.findOne({ courseId: lesson.courseId, studentId: userId, isActive: true });
    if (!enrollment) throw new Error('You must be enrolled to access this lesson');

    const progress = await LessonProgressModel.findOneAndUpdate(
      { studentId: userId, lessonId, courseId: lesson.courseId, sectionId: lesson.sectionId },
      { $setOnInsert: { firstAccessedAt: new Date() }, $set: { lastAccessedAt: new Date() }, $inc: { timeSpentSeconds: Math.max(0, seconds || 0) } },
      { upsert: true, new: true }
    );

    // update enrollment aggregate time
    await EnrollmentModel.updateOne({ _id: enrollment._id }, { $inc: { totalTimeSpent: Math.max(0, seconds || 0) }, $set: { lastActivityAt: new Date(), currentLesson: lesson._id, currentSection: lesson.sectionId } });

    return { lessonId, userId, addedSeconds: Math.max(0, seconds || 0), totalTimeSpent: progress?.timeSpentSeconds || 0 };
  }

  // Get lesson attachments
  static async getLessonAttachments(lessonId: string, userId: string) {
    // Check enrollment
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const enrollment = await EnrollmentModel.findOne({
      courseId: lesson.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this lesson');
    }

    return lesson.attachments || [];
  }

  // Get lesson navigation (previous/next)
  static async getLessonNavigation(lessonId: string, userId: string) {
    const [previousLesson, nextLesson] = await Promise.all([
      this.getPreviousLesson(lessonId, userId),
      this.getNextLesson(lessonId, userId)
    ]);

    return {
      lessonId,
      previous: previousLesson,
      next: nextLesson,
      hasPrevious: !!previousLesson,
      hasNext: !!nextLesson
    };
  }

  // Get lesson summary
  static async getLessonSummary(lessonId: string, userId: string) {
    const lesson = await this.getLessonById(lessonId, userId);
    const progress = await this.calculateLessonProgress(lessonId, userId);
    const navigation = await this.getLessonNavigation(lessonId, userId);

    return {
      lessonId,
      userId,
      title: lesson.title,
      type: lesson.type,
      estimatedTime: lesson.estimatedTime,
      formattedDuration: (lesson as any).getFormattedDuration ? (lesson as any).getFormattedDuration() : 'N/A',
      progress,
      navigation,
      attachments: lesson.attachments || [],
      isPreview: lesson.isPreview,
      isRequired: lesson.isRequired
    };
  }

  // Helper method to calculate lesson progress
  private static async calculateLessonProgress(lessonId: string, userId: string) {
    const progress = await LessonProgressModel.findOne({ studentId: userId, lessonId });
    const isCompleted = !!progress?.isCompleted;
    const timeSpent = progress?.timeSpentSeconds || 0;
    const lastAccessed = progress?.lastAccessedAt || null;
    return { isCompleted, timeSpent, lastAccessed, percentage: isCompleted ? 100 : 0 };
  }

  // ========== TEACHER CRUD OPERATIONS ==========

  // Create lesson (for course instructors)
  static async createLesson(userId: string, data: any): Promise<ILesson> {
    // Verify user is the course instructor
    const course = await CourseModel.findById(data.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to create lessons for this course');
    }

    const lessonData: any = {
      sectionId: data.sectionId,
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      type: data.type,
      content: data.content,
      videoUrl: data.videoUrl,
      fileUrl: data.fileUrl,
      externalLink: data.linkUrl, // Map linkUrl -> externalLink
      estimatedTime: data.duration || 1, // Map duration -> estimatedTime (min 1 minute)
      order: data.order || 1,
      isPublished: data.isPublished || false,
      isFree: data.isFree || false,
      isRequired: data.isRequired || false,
      isVisible: true
    };

    // Add quiz questions if type is quiz
    if (data.type === 'quiz' && data.quizQuestions) {
      lessonData.quizQuestions = data.quizQuestions;
    }

    // Add assignment details if type is assignment
    if (data.type === 'assignment' && data.assignmentDetails) {
      lessonData.assignmentDetails = data.assignmentDetails;
    }

    const lesson = await LessonModel.create(lessonData);

    return lesson;
  }

  // Update lesson (for course instructors)
  static async updateLesson(lessonId: string, userId: string, updates: any): Promise<ILesson> {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Verify user is the course instructor
    const course = await CourseModel.findById(lesson.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to update this lesson');
    }

    // Map frontend fields to backend fields
    const mappedUpdates: any = { ...updates };
    if (updates.duration !== undefined) {
      mappedUpdates.estimatedTime = updates.duration;
      delete mappedUpdates.duration;
    }
    if (updates.linkUrl !== undefined) {
      mappedUpdates.externalLink = updates.linkUrl;
      delete mappedUpdates.linkUrl;
    }
    // Quiz questions are already in correct format, no mapping needed
    if (updates.quizQuestions !== undefined) {
      mappedUpdates.quizQuestions = updates.quizQuestions;
    }
    // Quiz settings (randomize, time limit, etc.)
    if (updates.quizSettings !== undefined) {
      mappedUpdates.quizSettings = updates.quizSettings;
    }
    // Assignment details
    if (updates.assignmentDetails !== undefined) {
      mappedUpdates.assignmentDetails = updates.assignmentDetails;
    }
    // Preview mode (allow non-enrolled users to view)
    if (updates.isPreview !== undefined) {
      mappedUpdates.isPreview = updates.isPreview;
    }

    const updatedLesson = await LessonModel.findByIdAndUpdate(
      lessonId,
      { $set: mappedUpdates },
      { new: true, runValidators: false }
    );

    return updatedLesson!;
  }

  // Delete lesson (for course instructors)
  static async deleteLesson(lessonId: string, userId: string): Promise<void> {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Verify user is the course instructor
    const course = await CourseModel.findById(lesson.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to delete this lesson');
    }

    // Delete lesson progress for all students
    await LessonProgressModel.deleteMany({ lessonId });

    // Delete the lesson
    await LessonModel.findByIdAndDelete(lessonId);
  }

  // Reorder lessons (for course instructors)
  static async reorderLessons(sectionId: string, userId: string, lessons: any[]): Promise<ILesson[]> {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Verify user is the course instructor
    const course = await CourseModel.findById(section.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to reorder lessons for this course');
    }

    // Update order for each lesson
    await Promise.all(
      lessons.map(({ lessonId, newOrder }) =>
        LessonModel.findByIdAndUpdate(lessonId, { order: newOrder })
      )
    );

    // Return updated lessons
    const updatedLessons = await LessonModel.find({ sectionId }).sort({ order: 1 });
    return updatedLessons;
  }
}
