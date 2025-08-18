import express from 'express';
import { Enrollment, Course, User, UserActivityLog } from '../../shared/models';

const router = express.Router();

// Get user enrollments
router.get('/', async (req: any, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter: any = { studentId: req.user.id };
    if (status === 'active') filter.isActive = true;
    if (status === 'completed') filter.isCompleted = true;
    if (status === 'inactive') filter.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);
    
    const enrollments = await Enrollment.find(filter)
      .populate('courseId', 'title thumbnail totalLessons totalDuration averageRating')
      .populate('instructorId', 'name avatar')
      .skip(skip)
      .limit(Number(limit))
      .sort({ enrolledAt: -1 });

    const total = await Enrollment.countDocuments(filter);

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Enroll in a course
router.post('/', async (req: any, res) => {
  try {
    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    // Check if course exists and is published
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
      isApproved: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or not available'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: req.user.id,
      courseId: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      studentId: req.user.id,
      courseId: courseId,
      instructorId: course.instructorId,
      enrolledAt: new Date(),
      progress: 0,
      isActive: true,
      isCompleted: false
    });

    await enrollment.save();
    // activity log
    UserActivityLog.create({ userId: req.user.id, action: 'course_enroll', resource: 'enrollment', resourceId: enrollment._id, courseId: courseId });

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalStudents: 1 },
      $push: { enrolledStudents: req.user.id }
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalCoursesEnrolled': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get enrollment by ID
router.get('/:id', async (req: any, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      studentId: req.user.id
    })
      .populate('courseId', 'title thumbnail totalLessons totalDuration')
      .populate('instructorId', 'name avatar');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update enrollment progress
router.put('/:id/progress', async (req: any, res) => {
  try {
    const { progress, currentLesson, currentSection, timeSpent } = req.body;
    
    const updateData: any = {};
    if (progress !== undefined) updateData.progress = progress;
    if (currentLesson) updateData.currentLesson = currentLesson;
    if (currentSection) updateData.currentSection = currentSection;
    if (timeSpent) updateData.totalTimeSpent = timeSpent;
    
    updateData.lastActivityAt = new Date();

    const enrollment = await Enrollment.findOneAndUpdate(
      {
        _id: req.params.id,
        studentId: req.user.id
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Check if course is completed
    if (progress >= 100 && !enrollment.isCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
      await enrollment.save();
      // activity log
      UserActivityLog.create({ userId: req.user.id, action: 'course_complete', resource: 'course', resourceId: enrollment.courseId, courseId: enrollment.courseId });

      // Update user stats
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.totalCoursesCompleted': 1 }
      });
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark lesson as completed
router.post('/:id/lessons/:lessonId/complete', async (req: any, res) => {
  try {
    const { lessonId } = req.params;
    
    // This would typically update a lesson progress collection
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Lesson marked as completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Cancel enrollment
router.delete('/:id', async (req: any, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      {
        _id: req.params.id,
        studentId: req.user.id
      },
      { isActive: false },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Update course enrollment count
    await Course.findByIdAndUpdate(enrollment.courseId, {
      $inc: { totalStudents: -1 },
      $pull: { enrolledStudents: req.user.id }
    });
    UserActivityLog.create({ userId: req.user.id, action: 'course_unenroll', resource: 'enrollment', resourceId: enrollment._id, courseId: enrollment.courseId });

    res.json({
      success: true,
      message: 'Enrollment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get enrollment statistics
router.get('/stats', async (req: any, res) => {
  try {
    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalTimeSpent,
      averageProgress
    ] = await Promise.all([
      Enrollment.countDocuments({ studentId: req.user.id }),
      Enrollment.countDocuments({ studentId: req.user.id, isActive: true }),
      Enrollment.countDocuments({ studentId: req.user.id, isCompleted: true }),
      Enrollment.aggregate([
        { $match: { studentId: req.user.id } },
        { $group: { _id: null, total: { $sum: '$totalTimeSpent' } } }
      ]),
      Enrollment.aggregate([
        { $match: { studentId: req.user.id } },
        { $group: { _id: null, average: { $avg: '$progress' } } }
      ])
    ]);

    const timeSpent = totalTimeSpent[0]?.total || 0;
    const avgProgress = averageProgress[0]?.average || 0;

    res.json({
      success: true,
      data: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalTimeSpent: timeSpent,
        averageProgress: Math.round(avgProgress * 100) / 100,
        completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
