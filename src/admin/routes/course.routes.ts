import express from 'express';
import { CourseController } from '../controllers/course.controller';
import { adminCourseValidation } from '../validators/course.validator';
import { validateRequest } from '../../shared/middleware/validation';

const router = express.Router();

// Get all courses with pagination and filters
router.get('/', validateRequest(adminCourseValidation.queryParams), CourseController.getCourses);

// Get course statistics
router.get('/stats', CourseController.getCourseStats);

// Search courses
router.get('/search', CourseController.searchCourses);

// Create a new course
router.post('/', validateRequest(adminCourseValidation.createCourse), CourseController.createCourse);

// Get course by ID
router.get('/:id', validateRequest(adminCourseValidation.courseId), CourseController.getCourseById);

// Update course
router.put('/:id', validateRequest([...adminCourseValidation.courseId, ...adminCourseValidation.updateCourse]), CourseController.updateCourse);

// Delete course
router.delete('/:id', validateRequest(adminCourseValidation.courseId), CourseController.deleteCourse);

// Approve/reject course
router.patch('/approve', CourseController.approveCourse);

// Bulk update course status
router.patch('/bulk-status', CourseController.bulkUpdateCourseStatus);

export default router;
