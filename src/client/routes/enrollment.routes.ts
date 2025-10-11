import express from 'express';
import { Enrollment, Course, User, UserActivityLog, LessonProgress } from '../../shared/models';
import { authenticate } from '../../shared/middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

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

// ========== TEACHER-SPECIFIC ROUTES ==========

// Get enrollments for a course (teacher view)
router.get('/course/:courseId', async (req: any, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20, status, search } = req.query;
    const userId = req.user?._id || req.user?.id;

    // Verify user is the course instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view enrollments for this course'
      });
    }

    // Build query
    const query: any = { courseId };
    if (status && status !== 'all') {
      if (status === 'active') query.isActive = true;
      if (status === 'completed') query.isCompleted = true;
      if (status === 'inactive') query.isActive = false;
    }

    // Search by student name or email
    let studentIds: any[] = [];
    if (search) {
      const students = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      studentIds = students.map(s => s._id);
      if (studentIds.length > 0) {
        query.studentId = { $in: studentIds };
      } else {
        // No students found, return empty
        return res.json({
          success: true,
          data: {
            enrollments: [],
            total: 0,
            page: Number(page),
            limit: Number(limit)
          }
        });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate('studentId', 'firstName lastName email avatar')
        .skip(skip)
        .limit(Number(limit))
        .sort({ enrolledAt: -1 }),
      Enrollment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        enrollments,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get enrollments'
    });
  }
});

// Get enrollment progress details
router.get('/:id/progress', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    const enrollment = await Enrollment.findById(id)
      .populate('studentId', 'firstName lastName email avatar')
      .populate('courseId', 'title sections');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Verify user is the course instructor
    const course = await Course.findById(enrollment.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this enrollment'
      });
    }

    // Get lesson progress
    const lessonProgress = await LessonProgress.find({
      studentId: enrollment.studentId,
      courseId: enrollment.courseId
    });

    res.json({
      success: true,
      data: {
        enrollment,
        lessonProgress
      }
    });
  } catch (error: any) {
    console.error('Get enrollment progress error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get progress'
    });
  }
});

// Get enrollment statistics for a course
router.get('/stats/:courseId', async (req: any, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Verify user is the course instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view stats for this course'
      });
    }

    const [
      totalStudents,
      activeStudents,
      completedStudents,
      avgProgress,
      avgTime
    ] = await Promise.all([
      Enrollment.countDocuments({ courseId }),
      Enrollment.countDocuments({ courseId, isActive: true }),
      Enrollment.countDocuments({ courseId, isCompleted: true }),
      Enrollment.aggregate([
        { $match: { courseId: course._id } },
        { $group: { _id: null, average: { $avg: '$progress' } } }
      ]),
      Enrollment.aggregate([
        { $match: { courseId: course._id, isCompleted: true } },
        { $group: { _id: null, average: { $avg: '$totalTimeSpent' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        completedStudents,
        averageProgress: Math.round((avgProgress[0]?.average || 0) * 100) / 100,
        averageCompletionTime: Math.round(avgTime[0]?.average || 0)
      }
    });
  } catch (error: any) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats'
    });
  }
});

// Send message to student
router.post('/:id/message', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?._id || req.user?.id;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Verify user is the course instructor
    const course = await Course.findById(enrollment.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to message this student'
      });
    }

    // TODO: Implement messaging system
    // For now, just log the activity
    UserActivityLog.create({
      userId,
      action: 'message_sent',
      resource: 'enrollment',
      resourceId: id,
      courseId: enrollment.courseId,
      details: message
    });

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
});

// Get student activity log
router.get('/:id/activity', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
    }

    // Verify user is the course instructor
    const course = await Course.findById(enrollment.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this activity'
      });
    }

    // Get activity logs
    const activities = await UserActivityLog.find({
      userId: enrollment.studentId,
      courseId: enrollment.courseId
    }).sort({ createdAt: -1 }).limit(100);

    res.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get activity'
    });
  }
});

// Export student list
router.post('/export', async (req: any, res) => {
  try {
    const { courseId, format = 'csv' } = req.body;
    const userId = req.user?._id || req.user?.id;

    // Verify user is the course instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to export data for this course'
      });
    }

    // Get all enrollments
    const enrollments = await Enrollment.find({ courseId })
      .populate('studentId', 'firstName lastName email')
      .sort({ enrolledAt: -1 });

    // Format data for export
    const exportData = enrollments.map(e => ({
      'Student Name': `${(e.studentId as any).firstName} ${(e.studentId as any).lastName}`,
      'Email': (e.studentId as any).email,
      'Enrolled Date': new Date(e.enrolledAt).toLocaleDateString(),
      'Progress': `${e.progress}%`,
      'Status': e.isCompleted ? 'Completed' : e.isActive ? 'Active' : 'Inactive',
      'Time Spent (hours)': Math.round((e.totalTimeSpent || 0) / 60)
    }));

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=students-${courseId}.csv`);
      res.send(csv);
    } else {
      // Return JSON for frontend to convert to Excel
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export data'
    });
  }
});

export default router;
