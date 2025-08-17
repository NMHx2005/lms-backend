import { body, query, param } from 'express-validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const clientUserValidation = {
  // Profile Management
  updateProfile: [
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('bio')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    
    body('phone')
      .optional()
      .isString()
      .trim()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Please enter a valid phone number'),
    
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Please enter a valid date'),
    
    body('country')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    
    body('avatar')
      .optional()
      .isURL()
      .withMessage('Please enter a valid avatar URL'),
    
    body('socialLinks')
      .optional()
      .isObject()
      .withMessage('Social links must be an object'),
    
    body('socialLinks.linkedin')
      .optional()
      .isURL()
      .withMessage('Please enter a valid LinkedIn URL'),
    
    body('socialLinks.twitter')
      .optional()
      .isURL()
      .withMessage('Please enter a valid Twitter URL'),
    
    body('socialLinks.github')
      .optional()
      .isURL()
      .withMessage('Please enter a valid GitHub URL'),
    
    body('socialLinks.youtube')
      .optional()
      .isURL()
      .withMessage('Please enter a valid YouTube URL'),
    
    body('socialLinks.website')
      .optional()
      .isURL()
      .withMessage('Please enter a valid website URL'),
    
    body('socialLinks.portfolio')
      .optional()
      .isURL()
      .withMessage('Please enter a valid portfolio URL'),
    
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
    
    body('preferences.language')
      .optional()
      .isString()
      .isIn(['en', 'vi', 'ja', 'ko', 'zh'])
      .withMessage('Please select a valid language'),
    
    body('preferences.timezone')
      .optional()
      .isString()
      .withMessage('Please enter a valid timezone'),
    
    body('preferences.theme')
      .optional()
      .isString()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Theme must be light, dark, or auto'),
    
    body('preferences.learningGoals')
      .optional()
      .isArray()
      .withMessage('Learning goals must be an array'),
    
    body('preferences.learningGoals.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Each learning goal must be between 5 and 200 characters'),
    
    body('preferences.accessibility')
      .optional()
      .isObject()
      .withMessage('Accessibility settings must be an object'),
    
    body('preferences.accessibility.highContrast')
      .optional()
      .isBoolean()
      .withMessage('High contrast must be a boolean'),
    
    body('preferences.accessibility.largeText')
      .optional()
      .isBoolean()
      .withMessage('Large text must be a boolean'),
    
    body('preferences.accessibility.screenReader')
      .optional()
      .isBoolean()
      .withMessage('Screen reader must be a boolean'),
    
    body('preferences.accessibility.keyboardNavigation')
      .optional()
      .isBoolean()
      .withMessage('Keyboard navigation must be a boolean'),
    
    body('preferences.accessibility.reducedMotion')
      .optional()
      .isBoolean()
      .withMessage('Reduced motion must be a boolean'),
    
    body('preferences.accessibility.colorBlindFriendly')
      .optional()
      .isBoolean()
      .withMessage('Color blind friendly must be a boolean'),
    
    body('preferences.privacy')
      .optional()
      .isObject()
      .withMessage('Privacy settings must be an object'),
    
    body('preferences.privacy.profileVisibility')
      .optional()
      .isString()
      .isIn(['public', 'private', 'friends'])
      .withMessage('Profile visibility must be public, private, or friends'),
    
    body('preferences.privacy.showEmail')
      .optional()
      .isBoolean()
      .withMessage('Show email must be a boolean'),
    
    body('preferences.privacy.showPhone')
      .optional()
      .isBoolean()
      .withMessage('Show phone must be a boolean'),
    
    body('preferences.privacy.showLocation')
      .optional()
      .isBoolean()
      .withMessage('Show location must be a boolean'),
    
    body('preferences.privacy.showLearningProgress')
      .optional()
      .isBoolean()
      .withMessage('Show learning progress must be a boolean'),
    
    body('preferences.privacy.allowDataAnalytics')
      .optional()
      .isBoolean()
      .withMessage('Allow data analytics must be a boolean'),
    
    body('preferences.privacy.allowMarketing')
      .optional()
      .isBoolean()
      .withMessage('Allow marketing must be a boolean'),
  ],

  // Password Management
  changePassword: [
    body('currentPassword')
      .isString()
      .trim()
      .isLength({ min: 8 })
      .withMessage('Current password must be at least 8 characters'),
    
    body('newPassword')
      .isString()
      .trim()
      .isLength({ min: 8, max: 128 })
      .matches(VALIDATION_CONSTANTS.PATTERNS.PASSWORD)
      .withMessage('New password must be at least 8 characters and contain uppercase, lowercase, number, and special character'),
  ],

  requestPasswordReset: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
  ],

  resetPassword: [
    body('token')
      .isString()
      .trim()
      .isLength({ min: 32, max: 64 })
      .withMessage('Invalid reset token'),
    
    body('newPassword')
      .isString()
      .trim()
      .isLength({ min: 8, max: 128 })
      .matches(VALIDATION_CONSTANTS.PATTERNS.PASSWORD)
      .withMessage('New password must be at least 8 characters and contain uppercase, lowercase, number, and special character'),
  ],

  // Email Verification
  verifyEmail: [
    param('token')
      .isString()
      .trim()
      .isLength({ min: 32, max: 64 })
      .withMessage('Invalid verification token'),
  ],

  // Preferences and Settings
  updatePreferences: [
    body('preferences')
      .isObject()
      .withMessage('Preferences must be an object'),
    
    body('preferences.language')
      .optional()
      .isString()
      .isIn(['en', 'vi', 'ja', 'ko', 'zh'])
      .withMessage('Please select a valid language'),
    
    body('preferences.timezone')
      .optional()
      .isString()
      .withMessage('Please enter a valid timezone'),
    
    body('preferences.theme')
      .optional()
      .isString()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Theme must be light, dark, or auto'),
    
    body('preferences.learningGoals')
      .optional()
      .isArray()
      .withMessage('Learning goals must be an array'),
    
    body('preferences.learningGoals.*')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Each learning goal must be between 5 and 200 characters'),
  ],

  updateNotificationSettings: [
    body('notifications')
      .isObject()
      .withMessage('Notification settings must be an object'),
    
    body('notifications.email')
      .isBoolean()
      .withMessage('Email notifications must be a boolean'),
    
    body('notifications.push')
      .isBoolean()
      .withMessage('Push notifications must be a boolean'),
    
    body('notifications.sms')
      .isBoolean()
      .withMessage('SMS notifications must be a boolean'),
    
    body('notifications.courseUpdates')
      .isBoolean()
      .withMessage('Course updates must be a boolean'),
    
    body('notifications.assignmentReminders')
      .isBoolean()
      .withMessage('Assignment reminders must be a boolean'),
    
    body('notifications.achievementNotifications')
      .isBoolean()
      .withMessage('Achievement notifications must be a boolean'),
    
    body('notifications.marketingEmails')
      .isBoolean()
      .withMessage('Marketing emails must be a boolean'),
    
    body('notifications.weeklyDigest')
      .isBoolean()
      .withMessage('Weekly digest must be a boolean'),
    
    body('notifications.monthlyReport')
      .isBoolean()
      .withMessage('Monthly report must be a boolean'),
  ],

  updateSocialLinks: [
    body('socialLinks')
      .isObject()
      .withMessage('Social links must be an object'),
    
    body('socialLinks.linkedin')
      .optional()
      .isURL()
      .withMessage('Please enter a valid LinkedIn URL'),
    
    body('socialLinks.twitter')
      .optional()
      .isURL()
      .withMessage('Please enter a valid Twitter URL'),
    
    body('socialLinks.github')
      .optional()
      .isURL()
      .withMessage('Please enter a valid GitHub URL'),
    
    body('socialLinks.youtube')
      .optional()
      .isURL()
      .withMessage('Please enter a valid YouTube URL'),
    
    body('socialLinks.website')
      .optional()
      .isURL()
      .withMessage('Please enter a valid website URL'),
    
    body('socialLinks.portfolio')
      .optional()
      .isURL()
      .withMessage('Please enter a valid portfolio URL'),
  ],

  // Activity Log
  getActivityLog: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  // Account Deletion
  deleteAccount: [
    body('password')
      .isString()
      .trim()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
};

export default clientUserValidation;
