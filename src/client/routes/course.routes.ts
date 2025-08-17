import express from 'express';
import { Course, Section, Lesson, User } from '../../shared/models';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get all published courses with pagination and filters
router.get('/', optionalAuth, async (req: any, res) => {
  try {
    const { page = 1, limit = 12, domain, level, search, sort = 'newest' } = req.query;
    
    const filter: any = {
      isPublished: true,
      isApproved: true
    };
    
    if (domain) filter.domain = domain;
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') sortOption = { totalStudents: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };
    if (sort === 'price') sortOption = { price: 1 };
    
    const courses = await Course.find(filter)
      .populate('instructorId', 'name avatar')
      .select('-isPublished -isApproved -approvedBy -approvedAt')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortOption);

    const total = await Course.countDocuments(filter);

    // Check if user is enrolled in each course
    let coursesWithEnrollment = courses;
    if (req.user) {
      coursesWithEnrollment = courses.map(course => ({
        ...course.toObject(),
        isEnrolled: false // This would be checked against enrollment collection
      }));
    }

    res.json({
      success: true,
      data: coursesWithEnrollment,
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

// Get course by ID with detailed information
router.get('/:id', optionalAuth, async (req: any, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isPublished: true,
      isApproved: true
    })
      .populate('instructorId', 'name avatar bio socialLinks')
      .select('-isPublished -isApproved -approvedBy -approvedAt');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Get course sections and lessons
    const sections = await Section.find({ 
      courseId: req.params.id,
      isVisible: true 
    })
      .sort({ order: 1 });

    const lessons = await Lesson.find({ 
      courseId: req.params.id 
    })
      .sort({ order: 1 });

    // Check if user is enrolled
    let enrollmentStatus = null;
    if (req.user) {
      // This would check enrollment collection
      enrollmentStatus = {
        isEnrolled: false,
        progress: 0,
        currentLesson: null
      };
    }

    res.json({
      success: true,
      data: {
        course,
        sections,
        lessons,
        enrollmentStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get course content (sections and lessons)
router.get('/:id/content', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isPublished: true,
      isApproved: true
    }).select('title');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    const sections = await Section.find({ 
      courseId: req.params.id,
      isVisible: true 
    })
      .sort({ order: 1 });

    const lessons = await Lesson.find({ 
      courseId: req.params.id 
    })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: {
        course,
        sections,
        lessons
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get lesson content
router.get('/:courseId/lessons/:lessonId', async (req, res) => {
  try {
    const lesson = await Lesson.findOne({
      _id: req.params.lessonId,
      courseId: req.params.courseId
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get course categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'IT', name: 'Information Technology', icon: '💻' },
      { id: 'Economics', name: 'Economics', icon: '📊' },
      { id: 'Law', name: 'Law', icon: '⚖️' },
      { id: 'Marketing', name: 'Marketing', icon: '📈' },
      { id: 'Design', name: 'Design', icon: '🎨' },
      { id: 'Language', name: 'Language', icon: '🌍' },
      { id: 'Science', name: 'Science', icon: '🔬' },
      { id: 'Arts', name: 'Arts', icon: '🎭' },
      { id: 'Business', name: 'Business', icon: '💼' },
      { id: 'Other', name: 'Other', icon: '📚' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Search courses
router.get('/search', optionalAuth, async (req: any, res) => {
  try {
    const { q, domain, level, price, rating } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const filter: any = {
      isPublished: true,
      isApproved: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (domain) filter.domain = domain;
    if (level) filter.level = level;
    if (price) {
      const [min, max] = price.toString().split('-').map(Number);
      if (min !== undefined) filter.price = { $gte: min };
      if (max !== undefined) filter.price = { ...filter.price, $lte: max };
    }
    if (rating) filter.averageRating = { $gte: Number(rating) };

    const courses = await Course.find(filter)
      .populate('instructorId', 'name avatar')
      .select('-isPublished -isApproved -approvedBy -approvedAt')
      .limit(20)
      .sort({ averageRating: -1 });

    res.json({
      success: true,
      data: courses,
      total: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
