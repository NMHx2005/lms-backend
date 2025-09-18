import { body, query, param, validationResult } from 'express-validator';
import { VALIDATION_CONSTANTS } from './constants';

// Common validation rules that can be reused across different validators
export const commonValidations = {
  // MongoDB ObjectId validation
  mongoId: (field: string) =>
    param(field)
      .isMongoId()
      .withMessage(`${field} must be a valid MongoDB ObjectId`),

  // Email validation
  email: (field: string = 'email') =>
    body(field)
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),

  // Password validation with strength requirements
  password: (field: string = 'password') =>
    body(field)
      .isLength({
        min: VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_PASSWORD,
        max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_PASSWORD
      })
      .withMessage(`Password must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_PASSWORD} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_PASSWORD} characters`)
      .matches(VALIDATION_CONSTANTS.PATTERNS.PASSWORD)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Name validation
  name: (field: string = 'name') =>
    body(field)
      .isLength({
        min: VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_NAME,
        max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME
      })
      .withMessage(`Name must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_NAME} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_NAME} characters`)
      .trim()
      .escape(),

  // Description validation
  description: (field: string = 'description') =>
    body(field)
      .isLength({
        min: VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_DESCRIPTION,
        max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_DESCRIPTION
      })
      .withMessage(`Description must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_DESCRIPTION} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_DESCRIPTION} characters`)
      .trim()
      .escape(),

  // Phone validation
  phone: (field: string = 'phone') =>
    body(field)
      .matches(VALIDATION_CONSTANTS.PATTERNS.PHONE)
      .withMessage('Please provide a valid phone number')
      .isLength({
        min: VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_PHONE,
        max: VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_PHONE
      })
      .withMessage(`Phone number must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.MIN_PHONE} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.MAX_PHONE} characters`),

  // URL validation
  url: (field: string = 'url') =>
    body(field)
      .matches(VALIDATION_CONSTANTS.PATTERNS.URL)
      .withMessage('Please provide a valid URL'),

  // Price validation
  price: (field: string = 'price') =>
    body(field)
      .isFloat({ min: VALIDATION_CONSTANTS.NUMERIC_RANGES.PRICE.MIN, max: VALIDATION_CONSTANTS.NUMERIC_RANGES.PRICE.MAX })
      .withMessage(`Price must be between ${VALIDATION_CONSTANTS.NUMERIC_RANGES.PRICE.MIN} and ${VALIDATION_CONSTANTS.NUMERIC_RANGES.PRICE.MAX}`),

  // Duration validation (in minutes)
  duration: (field: string = 'duration') =>
    body(field)
      .isInt({ min: VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MIN, max: VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX })
      .withMessage(`Duration must be between ${VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MIN} and ${VALIDATION_CONSTANTS.NUMERIC_RANGES.DURATION.MAX} minutes`),

  // Rating validation (1-5)
  rating: (field: string = 'rating') =>
    body(field)
      .isInt({ min: VALIDATION_CONSTANTS.NUMERIC_RANGES.RATING.MIN, max: VALIDATION_CONSTANTS.NUMERIC_RANGES.RATING.MAX })
      .withMessage(`Rating must be between ${VALIDATION_CONSTANTS.NUMERIC_RANGES.RATING.MIN} and ${VALIDATION_CONSTANTS.NUMERIC_RANGES.RATING.MAX}`),

  // Percentage validation (0-100)
  percentage: (field: string = 'percentage') =>
    body(field)
      .isInt({ min: VALIDATION_CONSTANTS.NUMERIC_RANGES.PERCENTAGE.MIN, max: VALIDATION_CONSTANTS.NUMERIC_RANGES.PERCENTAGE.MAX })
      .withMessage(`Percentage must be between ${VALIDATION_CONSTANTS.NUMERIC_RANGES.PERCENTAGE.MIN} and ${VALIDATION_CONSTANTS.NUMERIC_RANGES.PERCENTAGE.MAX}`),

  // Date validation
  date: (field: string = 'date') =>
    body(field)
      .isISO8601()
      .withMessage('Please provide a valid date in ISO 8601 format')
      .custom((value) => {
        const date = new Date(value);
        if (date < VALIDATION_CONSTANTS.DATE_RANGES.MIN_DATE || date > VALIDATION_CONSTANTS.DATE_RANGES.MAX_DATE) {
          throw new Error('Date is out of valid range');
        }
        return true;
      }),

  // Array validation
  array: (field: string, minLength: number = 0, maxLength?: number) => {
    let validation = body(field)
      .isArray()
      .withMessage(`${field} must be an array`);

    if (minLength > 0) {
      validation = validation.isLength({ min: minLength }).withMessage(`${field} must have at least ${minLength} items`);
    }

    if (maxLength) {
      validation = validation.isLength({ max: maxLength }).withMessage(`${field} must have at most ${maxLength} items`);
    }

    return validation;
  },

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT })
      .withMessage(`Limit must be between 1 and ${VALIDATION_CONSTANTS.PAGINATION.MAX_LIMIT}`)
      .toInt(),
  ],

  // Search validation
  search: (field: string = 'search') =>
    query(field)
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim()
      .escape(),

  // Status validation
  status: (field: string = 'status', allowedStatuses: string[]) =>
    body(field)
      .isIn(allowedStatuses)
      .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`),

  // Role validation
  roles: (field: string = 'roles') =>
    body(field)
      .isArray()
      .withMessage('Roles must be an array')
      .custom((value) => {
        if (!Array.isArray(value)) {
          throw new Error('Roles must be an array');
        }
        for (const role of value) {
          if (!VALIDATION_CONSTANTS.ROLES.ALL.includes(role)) {
            throw new Error(`Invalid role: ${role}. Valid roles are: ${VALIDATION_CONSTANTS.ROLES.ALL.join(', ')}`);
          }
        }
        return true;
      }),

  // Boolean validation
  boolean: (field: string) =>
    body(field)
      .isBoolean()
      .withMessage(`${field} must be a boolean value`),

  // Integer validation
  integer: (field: string, min?: number, max?: number) => {
    let validation = body(field).isInt().withMessage(`${field} must be an integer`);

    if (min !== undefined) {
      validation = validation.isInt({ min }).withMessage(`${field} must be at least ${min}`);
    }

    if (max !== undefined) {
      validation = validation.isInt({ max }).withMessage(`${field} must be at most ${max}`);
    }

    return validation;
  },

  // Float validation
  float: (field: string, min?: number, max?: number) => {
    let validation = body(field).isFloat().withMessage(`${field} must be a number`);

    if (min !== undefined) {
      validation = validation.isFloat({ min }).withMessage(`${field} must be at least ${min}`);
    }

    if (max !== undefined) {
      validation = validation.isFloat({ max }).withMessage(`${field} must be at most ${max}`);
    }

    return validation;
  },
};

// Custom validation functions
export const customValidations = {
  // Check if field exists and is not empty
  required: (field: string) =>
    body(field)
      .notEmpty()
      .withMessage(`${field} is required`),

  // Check if field is optional but valid when provided
  optional: (field: string, validationRule: any) =>
    body(field)
      .optional()
      .custom((value) => {
        if (value !== undefined && value !== null && value !== '') {
          return validationRule.run({ body: { [field]: value } });
        }
        return true;
      }),

  // Validate nested object fields
  nestedObject: (objectField: string, fieldValidations: Record<string, any>) => {
    const validations = [];
    for (const [field, validation] of Object.entries(fieldValidations)) {
      validations.push(
        body(`${objectField}.${field}`)
          .optional()
          .custom((value) => {
            if (value !== undefined) {
              return validation.run({ body: { [field]: value } });
            }
            return true;
          })
      );
    }
    return validations;
  },

  // Validate array of objects
  arrayOfObjects: (field: string, objectValidations: Record<string, any>) =>
    body(field)
      .isArray()
      .withMessage(`${field} must be an array`)
      .custom((value) => {
        if (!Array.isArray(value)) {
          throw new Error(`${field} must be an array`);
        }

        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (typeof item !== 'object' || item === null) {
            throw new Error(`${field}[${i}] must be an object`);
          }

          for (const [prop, validation] of Object.entries(objectValidations)) {
            if (item[prop] !== undefined) {
              try {
                validation.run({ body: { [prop]: item[prop] } });
              } catch (error: any) {
                throw new Error(`${field}[${i}].${prop}: ${error.message}`);
              }
            }
          }
        }
        return true;
      }),
};

// Export validation result handler
export const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err: any) => ({
      field: err?.param ?? err?.path ?? 'unknown',
      message: err?.msg,
      value: err?.value,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages,
    });
  }
  next();
};
