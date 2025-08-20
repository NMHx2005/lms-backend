// Export all models from a single file for easier imports
export { default as User } from './User';
export { default as Course } from './Course';
export { default as Section } from './Section';
export { default as Lesson } from './Lesson';
export { default as Assignment } from './Assignment';
export { default as Submission } from './Submission';
export { default as Enrollment } from './Enrollment';
export { default as LessonProgress } from './LessonProgress';
export { default as Bill } from './Bill';
export { default as RefundRequest } from './RefundRequest';
export { default as CourseRating } from './CourseRating';
export { default as CourseReview } from './CourseReview';

// Export model interfaces
export type { IUser } from './User';
export type { ICourse } from './Course';
export type { ISection } from './Section';
export type { ILesson } from './Lesson';
export type { IAssignment } from './Assignment';
export type { ISubmission } from './Submission';
export type { IEnrollment } from './Enrollment';
export type { ILessonProgress } from './LessonProgress';
export type { IBill } from './Bill';
export type { IRefundRequest } from './RefundRequest';
export type { ICourseRating } from './CourseRating';
export type { ICourseReview } from './CourseReview';

// Export Extended Models
export { default as Wishlist } from '../extended/Wishlist';
export { default as StudyGroup } from '../extended/StudyGroup';
export { default as CalendarEvent } from '../extended/CalendarEvent';
export { default as Notification } from '../extended/Notification';
export { default as CourseCategory } from '../extended/CourseCategory';

export type { IWishlist } from '../extended/Wishlist';
export type { IStudyGroup } from '../extended/StudyGroup';
export type { ICalendarEvent } from '../extended/CalendarEvent';
export type { INotification } from '../extended/Notification';
export type { ICourseCategory } from '../extended/CourseCategory';

// Export Admin Extended Models
export { default as AdminPermission } from '../admin-extended/AdminPermission';
export { default as AdminRole } from '../admin-extended/AdminRole';

export type { IAdminPermission } from '../admin-extended/AdminPermission';
export type { IAdminRole } from '../admin-extended/AdminRole';

// Export Analytics Models
export { default as UserActivityLog } from '../analytics/UserActivityLog';

export type { IUserActivityLog } from '../analytics/UserActivityLog';

// Export Payment Models
export { default as Subscription } from '../payment/Subscription';

export type { ISubscription } from '../payment/Subscription';
