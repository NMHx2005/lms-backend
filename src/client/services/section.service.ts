import { Section as SectionModel, Lesson as LessonModel, Enrollment as EnrollmentModel } from '../../shared/models';
import { ISection } from '../../shared/models/core/Section';

export class ClientSectionService {
  // Get sections by course (for enrolled students)
  static async getSectionsByCourse(courseId: string, userId: string): Promise<ISection[]> {
    // Check if user is enrolled
    const enrollment = await EnrollmentModel.findOne({
      courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access course sections');
    }

    // Get visible sections with lessons
    const sections = await SectionModel.find({ 
      courseId, 
      isVisible: true 
    })
      .populate({
        path: 'lessons',
        match: { isVisible: true },
        select: 'title type order estimatedTime isPreview isRequired',
        options: { sort: { order: 1 } }
      })
      .sort({ order: 1 });

    // Add progress information to each section
    const sectionsWithProgress = await Promise.all(
      sections.map(async (section: any) => {
        const progress = await this.calculateSectionProgress(section._id.toString(), userId);
        return {
          ...section.toObject(),
          progress
        };
      })
    );

    return sectionsWithProgress;
  }

  // Get section by ID with progress
  static async getSectionById(sectionId: string, userId: string): Promise<any> {
    // Check if user is enrolled in the course
    const section = await SectionModel.findById(sectionId)
      .populate('courseId', 'title domain level')
      .populate({
        path: 'lessons',
        match: { isVisible: true },
        select: 'title type order estimatedTime isPreview isRequired content videoUrl fileUrl externalLink attachments',
        options: { sort: { order: 1 } }
      });

    if (!section) {
      throw new Error('Section not found');
    }

    // Check enrollment
    const enrollment = await EnrollmentModel.findOne({
      courseId: section.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this section');
    }

    // Add progress information
    const progress = await this.calculateSectionProgress(sectionId, userId);
    const nextLesson = await this.getNextLessonInSection(sectionId, userId);

    return {
      ...section.toObject(),
      progress,
      nextLesson
    };
  }

  // Get section progress
  static async getSectionProgress(sectionId: string, userId: string) {
    // Check if user is enrolled
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

    const progress = await this.calculateSectionProgress(sectionId, userId);
    
    return {
      sectionId,
      userId,
      ...progress,
      lastAccessed: enrollment.lastActivityAt,
      enrollmentDate: enrollment.enrolledAt
    };
  }

  // Get next section (for navigation)
  static async getNextSection(sectionId: string, userId: string) {
    const currentSection = await SectionModel.findById(sectionId);
    if (!currentSection) {
      throw new Error('Section not found');
    }

    // Check enrollment
    const enrollment = await EnrollmentModel.findOne({
      courseId: currentSection.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this course');
    }

    // Get next section
    const nextSection = await SectionModel.findOne({
      courseId: currentSection.courseId,
      order: { $gt: currentSection.order },
      isVisible: true
    }).sort({ order: 1 });

    if (!nextSection) {
      return null; // No next section
    }

    // Add progress information
    const progress = await this.calculateSectionProgress(nextSection._id.toString(), userId);

    return {
      ...nextSection.toObject(),
      progress
    };
  }

  // Get previous section (for navigation)
  static async getPreviousSection(sectionId: string, userId: string) {
    const currentSection = await SectionModel.findById(sectionId);
    if (!currentSection) {
      throw new Error('Section not found');
    }

    // Check enrollment
    const enrollment = await EnrollmentModel.findOne({
      courseId: currentSection.courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this course');
    }

    // Get previous section
    const previousSection = await SectionModel.findOne({
      courseId: currentSection.courseId,
      order: { $lt: currentSection.order },
      isVisible: true
    }).sort({ order: -1 });

    if (!previousSection) {
      return null; // No previous section
    }

    // Add progress information
    const progress = await this.calculateSectionProgress(previousSection._id.toString(), userId);

    return {
      ...previousSection.toObject(),
      progress
    };
  }

  // Get section overview (summary)
  static async getSectionOverview(courseId: string, userId: string) {
    // Check enrollment
    const enrollment = await EnrollmentModel.findOne({
      courseId,
      studentId: userId,
      isActive: true
    });

    if (!enrollment) {
      throw new Error('You must be enrolled to access this course');
    }

    // Get all visible sections with basic info
    const sections = await SectionModel.find({ 
      courseId, 
      isVisible: true 
    })
      .select('title order totalLessons totalDuration')
      .sort({ order: 1 });

    // Calculate overall progress
    const totalLessons = sections.reduce((sum: number, section: any) => sum + section.totalLessons, 0);
    const totalDuration = sections.reduce((sum: number, section: any) => sum + section.totalDuration, 0);

    // Get user's progress for each section
    const sectionsWithProgress = await Promise.all(
      sections.map(async (section: any) => {
        const progress = await this.calculateSectionProgress(section._id.toString(), userId);
        return {
          ...section.toObject(),
          progress
        };
      })
    );

    // Calculate overall course progress
    const overallProgress = sectionsWithProgress.reduce((sum: number, section: any) => sum + section.progress.percentage, 0) / sections.length;

    return {
      courseId,
      userId,
      sections: sectionsWithProgress,
      totalSections: sections.length,
      totalLessons,
      totalDuration,
      overallProgress: Math.round(overallProgress),
      enrollmentDate: enrollment.enrolledAt,
      lastActivity: enrollment.lastActivityAt
    };
  }

  // Helper method to calculate section progress
  private static async calculateSectionProgress(sectionId: string, userId: string) {
    // Get all lessons in the section
    const lessons = await LessonModel.find({ 
      sectionId, 
      isVisible: true 
    }).select('_id order isRequired');

    if (lessons.length === 0) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        estimatedTime: 0,
        remainingTime: 0
      };
    }

    // Get user's completed lessons (this would typically come from a progress tracking system)
    // For now, we'll simulate this - in a real implementation, you'd have a lesson completion table
    const completedLessons = 0; // Placeholder - implement actual lesson completion tracking
    const totalLessons = lessons.filter((lesson: any) => lesson.isRequired).length;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Calculate estimated time
    const estimatedTime = lessons.reduce((sum: number, lesson: any) => sum + (lesson.estimatedTime || 0), 0);
    const remainingTime = estimatedTime * (1 - completedLessons / totalLessons);

    return {
      totalLessons,
      completedLessons,
      percentage,
      estimatedTime,
      remainingTime
    };
  }

  // Helper method to get next lesson in section
  private static async getNextLessonInSection(sectionId: string, userId: string) {
    // This would typically check the user's current progress and return the next uncompleted lesson
    // For now, return the first lesson
    const nextLesson = await LessonModel.findOne({ 
      sectionId, 
      isVisible: true 
    })
      .select('title type order estimatedTime')
      .sort({ order: 1 });

    return nextLesson;
  }
}
