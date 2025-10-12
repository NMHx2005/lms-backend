import { body, param } from 'express-validator';

export const clientProgressValidation = {
    markLessonCompleted: [
        param('courseId').isMongoId().withMessage('Course ID must be a valid MongoDB ObjectId'),
        param('lessonId').isMongoId().withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    ],

    getLessonProgress: [
        param('courseId').isMongoId().withMessage('Course ID must be a valid MongoDB ObjectId'),
        param('lessonId').isMongoId().withMessage('Lesson ID must be a valid MongoDB ObjectId'),
    ],

    getCourseProgress: [
        param('courseId').isMongoId().withMessage('Course ID must be a valid MongoDB ObjectId'),
    ],

    addTimeSpent: [
        param('courseId').isMongoId().withMessage('Course ID must be a valid MongoDB ObjectId'),
        param('lessonId').isMongoId().withMessage('Lesson ID must be a valid MongoDB ObjectId'),
        body('seconds').isNumeric().withMessage('Seconds must be a number'),
    ],
};
