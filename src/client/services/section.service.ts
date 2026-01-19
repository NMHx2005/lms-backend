import { Section as SectionModel, Lesson as LessonModel, Enrollment as EnrollmentModel, LessonProgress as LessonProgressModel, Course as CourseModel } from '../../shared/models';
import { ISection } from '../../shared/models/core/Section';

export class ClientSectionService {
  // Get sections by course (for enrolled students and course instructors)
  // Supports preview mode: if not enrolled, returns only preview lessons
  static async getSectionsByCourse(courseId: string, userId: string, previewMode: boolean = false): Promise<ISection[]> {
    // Check if user is the course instructor
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const isInstructor = course && course.instructorId.toString() === userId;

    // Check if user is enrolled (if not instructor)
    let isEnrolled = false;
    if (!isInstructor) {
      const enrollment = await EnrollmentModel.findOne({
        courseId,
        studentId: userId,
        isActive: true
      });

      isEnrolled = !!enrollment;

      // If not enrolled and not in preview mode, throw error
      if (!isEnrolled && !previewMode) {
        throw new Error('You must be enrolled to access course sections');
      }
    } else {
      isEnrolled = true; // Instructors are considered "enrolled"
    }

    // Get sections with lessons
    // Instructors see all sections, students only see visible ones
    const query: any = { courseId };
    if (!isInstructor) {
      query.isVisible = true;
    }

    // Debug: Check if sections exist at all
    const allSectionsCount = await SectionModel.countDocuments({ courseId });
    const visibleSectionsCount = await SectionModel.countDocuments({ courseId, isVisible: true });
    console.log('📋 Sections debug:', {
      allSectionsCount,
      visibleSectionsCount,
      query,
      isInstructor
    });

    // Populate lessons - different logic for enrolled vs preview mode
    let lessonMatch: any = {};
    if (isInstructor) {
      // Instructors see all lessons
      lessonMatch = {};
    } else if (isEnrolled) {
      // Enrolled students see visible lessons
      lessonMatch = { isVisible: true };
    } else {
      // Preview mode: only show preview lessons
      lessonMatch = { isVisible: true, isPreview: true };
    }

    console.log('🔍 getSectionsByCourse debug:', {
      courseId,
      userId,
      previewMode,
      isInstructor,
      isEnrolled,
      lessonMatch
    });

    // First, check if there are any preview lessons in the course
    if (previewMode && !isEnrolled) {
      const mongoose = require('mongoose');

      // Try querying with string courseId first (in case it's stored as string)
      const allLessonsCountString = await LessonModel.countDocuments({
        courseId: courseId
      });

      // Try querying with ObjectId
      const allLessonsCountObjectId = await LessonModel.countDocuments({
        courseId: new mongoose.Types.ObjectId(courseId)
      });

      // Check visible lessons (string)
      const visibleLessonsCountString = await LessonModel.countDocuments({
        courseId: courseId,
        isVisible: true
      });

      // Check visible lessons (ObjectId)
      const visibleLessonsCountObjectId = await LessonModel.countDocuments({
        courseId: new mongoose.Types.ObjectId(courseId),
        isVisible: true
      });

      // Check preview lessons (with isVisible, string)
      const previewLessonsCountString = await LessonModel.countDocuments({
        courseId: courseId,
        isVisible: true,
        isPreview: true
      });

      // Check preview lessons (with isVisible, ObjectId)
      const previewLessonsCountObjectId = await LessonModel.countDocuments({
        courseId: new mongoose.Types.ObjectId(courseId),
        isVisible: true,
        isPreview: true
      });

      // Check preview lessons (without isVisible filter, string)
      const previewLessonsCountNoVisibleString = await LessonModel.countDocuments({
        courseId: courseId,
        isPreview: true
      });

      // Check preview lessons (without isVisible filter, ObjectId)
      const previewLessonsCountNoVisibleObjectId = await LessonModel.countDocuments({
        courseId: new mongoose.Types.ObjectId(courseId),
        isPreview: true
      });

      // Get a sample of lessons to see what courseIds exist
      const sampleLessons = await LessonModel.find({}).limit(5).select('_id title courseId sectionId isPreview isVisible').lean();

      // Get all unique courseIds in lessons
      const allCourseIds = await LessonModel.distinct('courseId');

      console.log('👁️ Preview lessons debug:', {
        courseId,
        allLessonsCountString,
        allLessonsCountObjectId,
        visibleLessonsCountString,
        visibleLessonsCountObjectId,
        previewLessonsCountString,
        previewLessonsCountObjectId,
        previewLessonsCountNoVisibleString,
        previewLessonsCountNoVisibleObjectId,
        sampleLessons,
        allCourseIds: allCourseIds.map((id: any) => id.toString()),
        note: 'Checking both string and ObjectId formats'
      });

      // Also check lessons by section to debug
      const allSections = await SectionModel.find({ courseId }).select('_id title isVisible');
      console.log(`📚 Found ${allSections.length} sections in course`);

      for (const sec of allSections) {
        const allLessonsInSection = await LessonModel.countDocuments({ sectionId: sec._id });
        const visibleLessonsInSection = await LessonModel.countDocuments({
          sectionId: sec._id,
          isVisible: true
        });
        const previewCount = await LessonModel.countDocuments({
          sectionId: sec._id,
          isVisible: true,
          isPreview: true
        });
        const previewCountNoVisible = await LessonModel.countDocuments({
          sectionId: sec._id,
          isPreview: true
        });

        console.log(`  - Section "${sec.title}" (visible: ${sec.isVisible}):`, {
          allLessons: allLessonsInSection,
          visibleLessons: visibleLessonsInSection,
          previewLessons: previewCount,
          previewLessonsNoVisible: previewCountNoVisible
        });
      }
    }

    // Get sections first
    const sections = await SectionModel.find(query).sort({ order: 1 });

    // For preview mode, manually populate lessons to ensure proper filtering
    let sectionsWithPopulatedLessons;
    if (previewMode && !isEnrolled) {
      // Manually query and attach preview lessons
      sectionsWithPopulatedLessons = await Promise.all(
        sections.map(async (section: any) => {
          const lessons = await LessonModel.find({
            sectionId: section._id,
            ...lessonMatch
          })
            .select('title type order estimatedTime isPreview isRequired duration isPublished videoUrl externalLink')
            .sort({ order: 1 })
            .lean();

          // Debug: Log videoUrl for preview lessons
          if (lessons.length > 0) {
            console.log('📹 Preview lessons videoUrl (backend):', lessons.map((l: any) => ({
              id: l._id,
              title: l.title,
              type: l.type,
              videoUrl: l.videoUrl || '(empty or undefined)',
              externalLink: l.externalLink || '(empty or undefined)',
              hasVideoUrl: !!l.videoUrl,
              allFields: Object.keys(l) // Show all fields that were returned
            })));

            // Also check directly from database
            for (const lesson of lessons) {
              const fullLesson = await LessonModel.findById(lesson._id).select('videoUrl externalLink').lean();
              if (fullLesson) {
                console.log(`  - Lesson "${lesson.title}":`, {
                  videoUrl: fullLesson.videoUrl || '(empty)',
                  externalLink: fullLesson.externalLink || '(empty)'
                });
              }
            }
          }

          // Convert section to plain object safely
          const sectionObj = typeof section.toObject === 'function' ? section.toObject() : { ...section };

          // Ensure videoUrl and externalLink are included even if undefined/null
          // Mongoose .lean() might omit undefined fields, so we need to explicitly include them
          sectionObj.lessons = lessons.map((lesson: any) => ({
            ...lesson,
            videoUrl: lesson.videoUrl || undefined, // Explicitly include, even if empty
            externalLink: lesson.externalLink || undefined // Explicitly include, even if empty
          }));

          return sectionObj;
        })
      );
    } else {
      // Use normal populate for enrolled users (or instructors in preview mode)
      // For preview mode with instructors, still need to include videoUrl for YouTube videos
      const lessonSelect = previewMode
        ? 'title type order estimatedTime isPreview isRequired duration isPublished videoUrl externalLink'
        : 'title type order estimatedTime isPreview isRequired duration isPublished';

      sectionsWithPopulatedLessons = await SectionModel.find(query)
        .populate({
          path: 'lessons',
          match: lessonMatch,
          select: lessonSelect,
          options: { sort: { order: 1 } }
        })
        .sort({ order: 1 })
        .lean()
        .then(sections => sections.map((s: any) => typeof s.toObject === 'function' ? s.toObject() : s));

      // For preview mode, filter to only show preview lessons (even for instructors)
      if (previewMode) {
        sectionsWithPopulatedLessons = sectionsWithPopulatedLessons.map((section: any) => {
          const previewLessons = (section.lessons || []).filter((l: any) => l.isPreview === true);
          return {
            ...section,
            lessons: previewLessons
          };
        }).filter((section: any) => section.lessons && section.lessons.length > 0);
      }
    }

    console.log('📊 Sections found:', {
      totalSections: sectionsWithPopulatedLessons.length,
      sectionsWithLessons: sectionsWithPopulatedLessons.map((s: any) => ({
        id: s._id,
        title: s.title,
        lessonsCount: s.lessons?.length || 0,
        lessons: s.lessons?.map((l: any) => ({
          id: l._id,
          title: l.title,
          isPreview: l.isPreview
        })) || []
      }))
    });

    // Filter out sections with no lessons (in preview mode)
    const sectionsWithLessons = sectionsWithPopulatedLessons.filter((section: any) =>
      section.lessons && section.lessons.length > 0
    );

    console.log('✅ Filtered sections:', {
      beforeFilter: sections.length,
      afterFilter: sectionsWithLessons.length
    });

    // Add progress information to each section (only if enrolled)
    const sectionsWithProgress = await Promise.all(
      sectionsWithLessons.map(async (section: any) => {
        let progress: any = isEnrolled
          ? await this.calculateSectionProgress(section._id.toString(), userId)
          : {
            totalLessons: 0,
            completedLessons: 0,
            percentage: 0,
            estimatedTime: 0,
            remainingTime: 0
          };
        const sectionObj = typeof section.toObject === 'function' ? section.toObject() : { ...section };
        return {
          ...sectionObj,
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

    const sectionObj = typeof section.toObject === 'function' ? section.toObject() : { ...section };
    return {
      ...sectionObj,
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

    const nextSectionObj = typeof nextSection.toObject === 'function' ? nextSection.toObject() : { ...nextSection };
    return {
      ...nextSectionObj,
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

    const previousSectionObj = typeof previousSection.toObject === 'function' ? previousSection.toObject() : { ...previousSection };
    return {
      ...previousSectionObj,
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
        const sectionObj = typeof section.toObject === 'function' ? section.toObject() : { ...section };
        return {
          ...sectionObj,
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

    // Count completed required lessons using LessonProgress
    const lessonIds = lessons.filter((l: any) => l.isRequired).map((l: any) => l._id);
    const totalLessons = lessonIds.length;
    const completedLessons = totalLessons
      ? await LessonProgressModel.countDocuments({ studentId: userId, lessonId: { $in: lessonIds }, isCompleted: true })
      : 0;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Calculate estimated time
    const estimatedTime = lessons.reduce((sum: number, lesson: any) => sum + (lesson.estimatedTime || 0), 0);
    const remainingTime = totalLessons > 0 ? estimatedTime * (1 - completedLessons / totalLessons) : estimatedTime;

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

  // ========== TEACHER CRUD OPERATIONS ==========

  // Create section (for course instructors)
  static async createSection(courseId: string, userId: string, data: any): Promise<ISection> {
    // Verify user is the course instructor
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to create sections for this course');
    }

    const section = await SectionModel.create({
      courseId,
      title: data.title,
      description: data.description,
      order: data.order || 1,
      isVisible: true
    });

    return section;
  }

  // Update section (for course instructors)
  static async updateSection(sectionId: string, userId: string, updates: any): Promise<ISection> {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Verify user is the course instructor
    const course = await CourseModel.findById(section.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to update this section');
    }

    const updatedSection = await SectionModel.findByIdAndUpdate(
      sectionId,
      { $set: updates },
      { new: true, runValidators: false }
    );

    return updatedSection!;
  }

  // Delete section (for course instructors)
  static async deleteSection(sectionId: string, userId: string): Promise<void> {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Verify user is the course instructor
    const course = await CourseModel.findById(section.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to delete this section');
    }

    // Delete all lessons in this section
    await LessonModel.deleteMany({ sectionId });

    // Delete the section
    await SectionModel.findByIdAndDelete(sectionId);
  }

  // Reorder sections (for course instructors)
  static async reorderSections(courseId: string, userId: string, sections: any[]): Promise<ISection[]> {
    // Verify user is the course instructor
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.instructorId.toString() !== userId) {
      throw new Error('You do not have permission to reorder sections for this course');
    }

    // Update order for each section
    await Promise.all(
      sections.map(({ sectionId, newOrder }) =>
        SectionModel.findByIdAndUpdate(sectionId, { order: newOrder })
      )
    );

    // Return updated sections
    const updatedSections = await SectionModel.find({ courseId }).sort({ order: 1 });
    return updatedSections;
  }

  // ========== PUBLIC PREVIEW OPERATIONS ==========

  // Get sections for preview (public - no enrollment required)
  static async getSectionsForPreview(courseId: string): Promise<any[]> {
    // Verify course exists and is published
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Only allow preview of published and approved courses
    if (!course.isPublished || !course.isApproved) {
      throw new Error('This course is not available for preview');
    }

    // Get visible sections with limited lesson information (for preview only)
    const sections = await SectionModel.find({
      courseId,
      isVisible: true
    })
      .populate({
        path: 'lessons',
        match: { isVisible: true },
        // Only show basic info for preview - NO video URLs or content
        select: 'title type order estimatedTime isPreview duration',
        options: { sort: { order: 1 } }
      })
      .sort({ order: 1 });

    // Format response for preview with lesson count and total duration
    const sectionsForPreview = sections.map((section: any) => {
      const sectionObj = typeof section.toObject === 'function' ? section.toObject() : { ...section };
      const lessons = sectionObj.lessons || [];

      return {
        _id: sectionObj._id,
        title: sectionObj.title,
        description: sectionObj.description,
        order: sectionObj.order,
        totalLessons: lessons.length,
        totalDuration: lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || lesson.estimatedTime || 0), 0),
        lessons: lessons.map((lesson: any) => ({
          _id: lesson._id,
          title: lesson.title,
          type: lesson.type,
          order: lesson.order,
          duration: lesson.duration || lesson.estimatedTime || 0,
          isPreview: lesson.isPreview || false,
          // NO videoUrl, content, fileUrl for security
        }))
      };
    });

    return sectionsForPreview;
  }
}
