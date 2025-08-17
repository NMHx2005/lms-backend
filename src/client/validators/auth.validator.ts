import { body } from 'express-validator';
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';

export const clientAuthValidation = {
  updateProfile: [
    body('name').optional(),
    commonValidations.name('name'),
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

  // Query parameters for dashboard and other endpoints
  queryParams: [
    ...commonValidations.pagination(),
    commonValidations.search('search'),
    body('status').optional(),
    body('status').isIn(['active', 'completed', 'cancelled', 'suspended']).withMessage('Invalid status'),
    body('category').optional(),
    body('category').isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters'),
  ],
};
