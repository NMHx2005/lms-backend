import { Lesson as LessonModel, Section as SectionModel, Enrollment as EnrollmentModel, LessonProgress as LessonProgressModel, Course as CourseModel, User as UserModel } from '../../shared/models';

export class ProgressService {
    // Mark lesson as completed
    static async markLessonCompleted(courseId: string, lessonId: string, userId: string) {
        // Check enrollment
        const enrollment = await EnrollmentModel.findOne({
            courseId,
            studentId: userId,
            isActive: true
        });

        if (!enrollment) {
            throw new Error('You must be enrolled to access this lesson');
        }

        // Check if lesson exists
        const lesson = await LessonModel.findById(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        // Verify lesson belongs to the course
        if (lesson.courseId.toString() !== courseId) {
            throw new Error('Lesson does not belong to this course');
        }

        // Upsert lesson progress and mark completed
        await LessonProgressModel.findOneAndUpdate(
            { studentId: userId, lessonId, courseId, sectionId: lesson.sectionId },
            { $setOnInsert: { firstAccessedAt: new Date() }, $set: { isCompleted: true, lastAccessedAt: new Date() } },
            { upsert: true }
        );

        // Auto-calculate enrollment progress
        const course = await CourseModel.findById(courseId).select('totalLessons certificate');
        if (course && course.totalLessons > 0) {
            // Count total completed lessons for this course
            const completedLessonsCount = await LessonProgressModel.countDocuments({
                studentId: userId,
                courseId,
                isCompleted: true
            });

            // Calculate progress percentage (cap at 100 to prevent validation errors)
            const progressPercentage = Math.min(100, Math.round((completedLessonsCount / course.totalLessons) * 100));

            // Update enrollment progress
            enrollment.progress = progressPercentage;
            enrollment.lastActivityAt = new Date();

            // Auto-complete course if progress >= 100
            if (progressPercentage >= 100 && !enrollment.isCompleted) {
                enrollment.isCompleted = true;
                enrollment.completedAt = new Date();

                // Update user stats
                await UserModel.findByIdAndUpdate(userId, {
                    $inc: { 'stats.totalCoursesCompleted': 1 }
                });
            }

            // Auto-issue certificate if completed (check separately to handle edge cases)
            if (progressPercentage >= 100 && course.certificate && !enrollment.certificateIssued) {
                try {
                    // Import CertificateService to generate certificate
                    const CertificateService = (await import('../../shared/services/certificates/certificate.service')).default;

                    // Generate certificate (this creates the Certificate record)
                    await CertificateService.generateCertificate(
                        userId,
                        courseId,
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

    // Get lesson progress
    static async getLessonProgress(courseId: string, lessonId: string, userId: string) {
        // Check enrollment
        const enrollment = await EnrollmentModel.findOne({
            courseId,
            studentId: userId,
            isActive: true
        });

        if (!enrollment) {
            throw new Error('You must be enrolled to access this lesson');
        }

        // Check if lesson exists
        const lesson = await LessonModel.findById(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        // Verify lesson belongs to the course
        if (lesson.courseId.toString() !== courseId) {
            throw new Error('Lesson does not belong to this course');
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

    // Get course progress
    static async getCourseProgress(courseId: string, userId: string) {
        // Check enrollment
        const enrollment = await EnrollmentModel.findOne({
            courseId,
            studentId: userId,
            isActive: true
        });

        if (!enrollment) {
            throw new Error('You must be enrolled to access this course');
        }

        // Get course info
        const course = await CourseModel.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        // Get all sections and their lessons
        const sections = await SectionModel.find({ courseId, isVisible: true }).sort({ order: 1 });

        const sectionsWithProgress = await Promise.all(
            sections.map(async (section) => {
                const lessons = await LessonModel.find({
                    sectionId: section._id,
                    isVisible: true
                }).sort({ order: 1 });

                const lessonsWithProgress = await Promise.all(
                    lessons.map(async (lesson) => {
                        const progress = await this.calculateLessonProgress(lesson._id.toString(), userId);
                        return {
                            ...lesson.toObject(),
                            progress
                        };
                    })
                );

                return {
                    ...section.toObject(),
                    lessons: lessonsWithProgress
                };
            })
        );

        return {
            courseId,
            userId,
            progress: enrollment.progress,
            isCompleted: enrollment.isCompleted,
            totalTimeSpent: enrollment.totalTimeSpent,
            lastActivityAt: enrollment.lastActivityAt,
            sections: sectionsWithProgress
        };
    }

    // Add time spent on lesson
    static async addTimeSpent(courseId: string, lessonId: string, userId: string, seconds: number) {
        // Check enrollment
        const enrollment = await EnrollmentModel.findOne({
            courseId,
            studentId: userId,
            isActive: true
        });

        if (!enrollment) {
            throw new Error('You must be enrolled to access this lesson');
        }

        // Check if lesson exists
        const lesson = await LessonModel.findById(lessonId);
        if (!lesson) {
            throw new Error('Lesson not found');
        }

        // Verify lesson belongs to the course
        if (lesson.courseId.toString() !== courseId) {
            throw new Error('Lesson does not belong to this course');
        }

        const progress = await LessonProgressModel.findOneAndUpdate(
            { studentId: userId, lessonId, courseId, sectionId: lesson.sectionId },
            { $setOnInsert: { firstAccessedAt: new Date() }, $set: { lastAccessedAt: new Date() }, $inc: { timeSpentSeconds: Math.max(0, seconds || 0) } },
            { upsert: true, new: true }
        );

        // Update enrollment aggregate time
        await EnrollmentModel.updateOne(
            { _id: enrollment._id },
            {
                $inc: { totalTimeSpent: Math.max(0, seconds || 0) },
                $set: {
                    lastActivityAt: new Date(),
                    currentLesson: lesson._id,
                    currentSection: lesson.sectionId
                }
            }
        );

        return {
            lessonId,
            userId,
            addedSeconds: Math.max(0, seconds || 0),
            totalTimeSpent: progress?.timeSpentSeconds || 0
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
}
