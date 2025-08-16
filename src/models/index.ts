// Export all models from a single file for easier imports
export { default as User } from './User';
export { default as Course } from './Course';
export { default as Section } from './Section';
export { default as Lesson } from './Lesson';
export { default as Assignment } from './Assignment';
export { default as Submission } from './Submission';
export { default as Enrollment } from './Enrollment';
export { default as Bill } from './Bill';
export { default as RefundRequest } from './RefundRequest';
export { default as CourseRating } from './CourseRating';

// Export model interfaces
export type { IUser } from './User';
export type { ICourse } from './Course';
export type { ISection } from './Section';
export type { ILesson } from './Lesson';
export type { IAssignment } from './Assignment';
export type { ISubmission } from './Submission';
export type { IEnrollment } from './Enrollment';
export type { IBill } from './Bill';
export type { IRefundRequest } from './RefundRequest';
export type { ICourseRating } from './CourseRating';
