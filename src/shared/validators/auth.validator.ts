import { body } from 'express-validator';

export const authValidation = {
  register: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim()
      .escape(),
    body('roles')
      .optional()
      .isArray()
      .withMessage('Roles must be an array')
      .custom((value) => {
        if (value && !Array.isArray(value)) {
          throw new Error('Roles must be an array');
        }
        if (value) {
          const validRoles = ['admin', 'teacher', 'student'];
          for (const role of value) {
            if (!validRoles.includes(role)) {
              throw new Error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
            }
          }
        }
        return true;
      }),
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],

  resetPassword: [
    body('userId')
      .isMongoId()
      .withMessage('Please provide a valid user ID'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],

  validateToken: [
    body('token')
      .notEmpty()
      .withMessage('Token is required'),
  ],
};
