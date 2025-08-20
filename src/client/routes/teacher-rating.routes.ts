import { Router } from 'express';
import * as teacherRatingController from '../controllers/teacher-rating.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/client/teacher-ratings/submit
 * @desc    Submit teacher rating by student
 * @access  Student
 */
router.post(
  '/submit',
  [
    body('teacherId').isMongoId().withMessage('Valid teacher ID is required'),
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('ratings').isObject().withMessage('Ratings object is required'),
    body('ratings.teachingQuality').isObject().withMessage('Teaching quality ratings required'),
    body('ratings.teachingQuality.clarity')
      .isInt({ min: 1, max: 5 })
      .withMessage('Clarity rating must be 1-5'),
    body('ratings.teachingQuality.organization')
      .isInt({ min: 1, max: 5 })
      .withMessage('Organization rating must be 1-5'),
    body('ratings.teachingQuality.preparation')
      .isInt({ min: 1, max: 5 })
      .withMessage('Preparation rating must be 1-5'),
    body('ratings.teachingQuality.knowledgeDepth')
      .isInt({ min: 1, max: 5 })
      .withMessage('Knowledge depth rating must be 1-5'),
    body('ratings.communication').isObject().withMessage('Communication ratings required'),
    body('ratings.communication.responsiveness')
      .isInt({ min: 1, max: 5 })
      .withMessage('Responsiveness rating must be 1-5'),
    body('ratings.communication.helpfulness')
      .isInt({ min: 1, max: 5 })
      .withMessage('Helpfulness rating must be 1-5'),
    body('ratings.communication.availability')
      .isInt({ min: 1, max: 5 })
      .withMessage('Availability rating must be 1-5'),
    body('ratings.communication.feedbackQuality')
      .isInt({ min: 1, max: 5 })
      .withMessage('Feedback quality rating must be 1-5'),
    body('ratings.engagement').isObject().withMessage('Engagement ratings required'),
    body('ratings.engagement.enthusiasm')
      .isInt({ min: 1, max: 5 })
      .withMessage('Enthusiasm rating must be 1-5'),
    body('ratings.engagement.studentEngagement')
      .isInt({ min: 1, max: 5 })
      .withMessage('Student engagement rating must be 1-5'),
    body('ratings.engagement.interactivity')
      .isInt({ min: 1, max: 5 })
      .withMessage('Interactivity rating must be 1-5'),
    body('ratings.engagement.inspiration')
      .isInt({ min: 1, max: 5 })
      .withMessage('Inspiration rating must be 1-5'),
    body('ratings.professionalism').isObject().withMessage('Professionalism ratings required'),
    body('ratings.professionalism.fairness')
      .isInt({ min: 1, max: 5 })
      .withMessage('Fairness rating must be 1-5'),
    body('ratings.professionalism.respect')
      .isInt({ min: 1, max: 5 })
      .withMessage('Respect rating must be 1-5'),
    body('ratings.professionalism.punctuality')
      .isInt({ min: 1, max: 5 })
      .withMessage('Punctuality rating must be 1-5'),
    body('ratings.professionalism.professionalism')
      .isInt({ min: 1, max: 5 })
      .withMessage('Professionalism rating must be 1-5'),
    body('feedback').isObject().withMessage('Feedback object is required'),
    body('feedback.positiveAspects')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Positive aspects must be max 1000 characters'),
    body('feedback.improvementAreas')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Improvement areas must be max 1000 characters'),
    body('feedback.additionalComments')
      .optional()
      .isString()
      .isLength({ max: 1500 })
      .withMessage('Additional comments must be max 1500 characters'),
    body('feedback.courseContent.rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Course content rating must be 1-5'),
    body('feedback.courseDifficulty.rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Course difficulty rating must be 1-5'),
    body('feedback.courseLoad.rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Course load rating must be 1-5'),
    body('feedback.wouldRecommend')
      .isBoolean()
      .withMessage('Would recommend must be boolean'),
    body('feedback.wouldTakeAgain')
      .isBoolean()
      .withMessage('Would take again must be boolean'),
    body('courseContext').isObject().withMessage('Course context is required'),
    body('courseContext.attendanceRate')
      .isInt({ min: 0, max: 100 })
      .withMessage('Attendance rate must be 0-100'),
    body('courseContext.assignmentsCompleted')
      .isInt({ min: 0 })
      .withMessage('Assignments completed must be non-negative'),
    body('courseContext.totalAssignments')
      .isInt({ min: 0 })
      .withMessage('Total assignments must be non-negative'),
    body('isAnonymous').optional().isBoolean().withMessage('Is anonymous must be boolean'),
    validateRequest
  ],
  teacherRatingController.submitTeacherRating
);

/**
 * @route   PUT /api/client/teacher-ratings/:ratingId
 * @desc    Update existing teacher rating
 * @access  Student (Own rating only)
 */
router.put(
  '/:ratingId',
  [
    param('ratingId').isString().withMessage('Rating ID is required'),
    body('ratings').optional().isObject().withMessage('Ratings must be an object'),
    body('feedback').optional().isObject().withMessage('Feedback must be an object'),
    validateRequest
  ],
  teacherRatingController.updateTeacherRating
);

/**
 * @route   GET /api/client/teacher-ratings/my-ratings
 * @desc    Get student's teacher ratings
 * @access  Student
 */
router.get(
  '/my-ratings',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validateRequest
  ],
  teacherRatingController.getMyTeacherRatings
);

/**
 * @route   GET /api/client/teacher-ratings/courses/:courseId
 * @desc    Get teacher ratings for a specific course (public view)
 * @access  Authenticated Users
 */
router.get(
  '/courses/:courseId',
  [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('sortBy')
      .optional()
      .isIn(['date', 'rating', 'helpful'])
      .withMessage('Sort by must be date, rating, or helpful'),
    query('filterBy')
      .optional()
      .isIn(['high_rating', 'low_rating', 'recent', 'helpful'])
      .withMessage('Filter by must be high_rating, low_rating, recent, or helpful'),
    validateRequest
  ],
  teacherRatingController.getCourseTeacherRatings
);

/**
 * @route   POST /api/client/teacher-ratings/:ratingId/vote
 * @desc    Vote on rating helpfulness
 * @access  Authenticated Users
 */
router.post(
  '/:ratingId/vote',
  [
    param('ratingId').isString().withMessage('Rating ID is required'),
    body('isHelpful').isBoolean().withMessage('Is helpful must be boolean'),
    validateRequest
  ],
  teacherRatingController.voteOnRating
);

/**
 * @route   POST /api/client/teacher-ratings/:ratingId/report
 * @desc    Report inappropriate rating
 * @access  Authenticated Users
 */
router.post(
  '/:ratingId/report',
  [
    param('ratingId').isString().withMessage('Rating ID is required'),
    body('reason')
      .isString()
      .isIn(['spam', 'inappropriate_language', 'off_topic', 'fake_review', 'harassment', 'other'])
      .withMessage('Invalid report reason'),
    body('details')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Details must be max 500 characters'),
    validateRequest
  ],
  teacherRatingController.reportRating
);

/**
 * @route   GET /api/client/teacher-ratings/teachers/:teacherId/stats
 * @desc    Get teacher rating statistics
 * @access  Authenticated Users
 */
router.get(
  '/teachers/:teacherId/stats',
  [
    param('teacherId').isMongoId().withMessage('Invalid teacher ID'),
    validateRequest
  ],
  teacherRatingController.getTeacherRatingStats
);

/**
 * @route   GET /api/client/teacher-ratings/courses-for-rating
 * @desc    Get courses available for rating by student
 * @access  Student
 */
router.get('/courses-for-rating', teacherRatingController.getCoursesForRating);

/**
 * @route   GET /api/client/teacher-ratings/form-data/:courseId
 * @desc    Get rating form data for a specific course
 * @access  Student
 */
router.get(
  '/form-data/:courseId',
  [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    validateRequest
  ],
  teacherRatingController.getRatingFormData
);

export default router;
