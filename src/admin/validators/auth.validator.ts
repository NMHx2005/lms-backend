import { body } from 'express-validator';
import { commonValidations, customValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const adminAuthValidation = {
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
    body('profile.avatar').optional(),
    commonValidations.url('profile.avatar'),
    body('profile.phone').optional(),
    commonValidations.phone('profile.phone'),
    body('profile.address').optional(),
    body('profile.address').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_ADDRESS }).withMessage(`Address must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_ADDRESS} characters`),
    body('profile.country').optional(),
    body('profile.country').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME }).withMessage(`Country must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME} characters`),
    body('profile.bio').optional(),
    body('profile.bio').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO }).withMessage(`Bio must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO} characters`),
  ],

  updateUser: [
    body('name').optional(),
    commonValidations.name('name'),
    body('roles').optional(),
    commonValidations.roles('roles'),
    body('isActive').optional(),
    commonValidations.boolean('isActive'),
    body('profile.avatar').optional(),
    commonValidations.url('profile.avatar'),
    body('profile.phone').optional(),
    commonValidations.phone('profile.phone'),
    body('profile.address').optional(),
    body('profile.address').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_ADDRESS }).withMessage(`Address must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_ADDRESS} characters`),
    body('profile.country').optional(),
    body('profile.country').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME }).withMessage(`Country must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME} characters`),
    body('profile.bio').optional(),
    body('profile.bio').isLength({ max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO }).withMessage(`Bio must be less than ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_BIO} characters`),
  ],

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

  // Query parameters for user listing
  queryParams: [
    ...commonValidations.pagination(),
    commonValidations.search('search'),
    body('roles').optional(),
    body('roles').isArray().withMessage('Roles must be an array'),
    body('isActive').optional(),
    commonValidations.boolean('isActive'),
    body('createdAtFrom').optional(),
    commonValidations.date('createdAtFrom'),
    body('createdAtTo').optional(),
    commonValidations.date('createdAtTo'),
  ],
};
