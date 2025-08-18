import { Lesson as LessonModel, Section as SectionModel, Enrollment as EnrollmentModel } from '../../shared/models';
import { ILesson } from '../../shared/models/core/Lesson';

export class ClientLessonService {
  // Get lesson by ID (for enrolled students)
  static async getLessonById(lessonId: string, userId: string): Promise<ILesson> {
    // Check if user is enrolled in the course
    const lesson = await LessonModel.findById(lessonId)
      .populate('sectionId', 'title order')
      .populate('courseId', 'title domain level');
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check enrollment
    const enrollment = await EnrollmentModel.findOne({
      courseId: lesson.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this lesson');
    }

    return lesson;
  }

  // Get lessons by section (for enrolled students)
  static async getLessonsBySection(sectionId: string, userId: string): Promise<ILesson[]> {
    // Check if user is enrolled in the course
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    const enrollment = await EnrollmentModel.findOne({
      courseId: section.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this section');
    }

    // Get visible lessons with basic info
    const lessons = await LessonModel.find({ 
      sectionId, 
      isVisible: true 
    })
      .select('title type order estimatedTime isPreview isRequired')
      .sort({ order: 1 });

    // Add progress information to each lesson
    const lessonsWithProgress = await Promise.all(
      lessons.map(async (lesson: any) => {
        const progress = await this.calculateLessonProgress(lesson._id.toString(), userId);
        return {
          ...lesson.toObject(),
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

    // This would typically update a lesson completion tracking system
    // For now, we'll just return success
    // In a real implementation, you'd have a LessonCompletion model
    
    return {
      lessonId,
      userId,
      completed: true,
      completedAt: new Date(),
      message: 'Lesson marked as completed'
    };
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
    // This would typically check the user's lesson completion status
    // For now, we'll simulate this - in a real implementation, you'd have a lesson completion table
    
    const isCompleted = false; // Placeholder - implement actual lesson completion tracking
    const timeSpent = 0; // Placeholder - implement actual time tracking
    const lastAccessed = null; // Placeholder - implement actual access tracking

    return {
      isCompleted,
      timeSpent,
      lastAccessed,
      percentage: isCompleted ? 100 : 0
    };
  }
}
