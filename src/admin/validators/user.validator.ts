import { body, query, param } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const adminUserValidation = {
  // Create user validation
  createUser: [
    body('email').notEmpty().withMessage('Email is required'),
    commonValidations.email('email'),
    body('password').notEmpty().withMessage('Password is required'),
    commonValidations.password('password'),
    body('name').notEmpty().withMessage('Name is required'),
    commonValidations.name('name'),
    body('roles').notEmpty().withMessage('Roles are required'),
    commonValidations.roles('roles'),
    body('isActive').optional(),
    commonValidations.boolean('isActive'),
    body('avatar').optional(),
    commonValidations.url('avatar'),
    body('phone').optional(),
    commonValidations.phone('phone'),
    body('country').optional(),
    body('country').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME }).withMessage(`Country must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME} characters`),
    body('bio').optional(),
    body('bio').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO }).withMessage(`Bio must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO} characters`),
  ],

  // Update user validation
  updateUser: [
    body('name').optional(),
    commonValidations.name('name'),
    body('roles').optional(),
    commonValidations.roles('roles'),
    body('isActive').optional(),
    commonValidations.boolean('isActive'),
    body('avatar').optional().custom((value) => {
      if (value && value !== '') {
        // Only validate if value is provided and not empty
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(value)) {
          throw new Error('Please provide a valid URL');
        }
      }
      return true;
    }),
    body('phone').optional().custom((value) => {
      if (value && value !== '') {
        // Only validate if value is provided and not empty
        const phonePattern = /^[0-9+\-\s()]+$/;
        if (!phonePattern.test(value)) {
          throw new Error('Please provide a valid phone number');
        }
        if (value.length < 10 || value.length > 15) {
          throw new Error('Phone number must be between 10 and 15 characters');
        }
      }
      return true;
    }),
    body('country').optional(),
    body('country').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME }).withMessage(`Country must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME} characters`),
    body('bio').optional(),
    body('bio').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO }).withMessage(`Bio must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO} characters`),
  ],

  // User ID validation
  userId: [
    commonValidations.mongoId('id'),
  ],

  // Query parameters validation
  queryParams: [
    ...commonValidations.pagination(),
    commonValidations.search('search'),
    query('roles').optional().custom((value) => {
      // Accept both string and array for roles
      if (typeof value === 'string' || Array.isArray(value)) {
        return true;
      }
      throw new Error('Roles must be a string or array');
    }),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('createdAtFrom').optional().isISO8601().withMessage('Created at from must be in ISO 8601 format'),
    query('createdAtTo').optional().isISO8601().withMessage('Created at to must be in ISO 8601 format'),
    query('sortBy').optional().isIn(['firstName', 'lastName', 'email', 'createdAt', 'updatedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],

  // Bulk operations
  bulkUpdateRoles: [
    body('userIds').notEmpty().withMessage('User IDs are required'),
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('userIds.*').isMongoId().withMessage('Each user ID must be a valid MongoDB ObjectId'),
    body('roles').notEmpty().withMessage('Roles are required'),
    commonValidations.roles('roles'),
  ],

  bulkUpdateStatus: [
    body('userIds').notEmpty().withMessage('User IDs are required'),
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('userIds.*').isMongoId().withMessage('Each user ID must be a valid MongoDB ObjectId'),
    body('isActive').notEmpty().withMessage('Status is required'),
    commonValidations.boolean('isActive'),
  ],

  // Password operations
  resetPassword: [
    body('newPassword').notEmpty().withMessage('New password is required'),
    commonValidations.password('newPassword'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('currentPassword').isLength({ min: 1 }).withMessage('Current password cannot be empty'),
    body('newPassword').notEmpty().withMessage('New password is required'),
    commonValidations.password('newPassword'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  ],

  // User analytics
  analyticsQuery: [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO 8601 format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO 8601 format'),
    query('roles').optional().custom((value) => {
      // Accept both string and array for roles
      if (typeof value === 'string' || Array.isArray(value)) {
        return true;
      }
      throw new Error('Roles must be a string or array');
    }),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ],
};
