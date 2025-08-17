import { Request, Response, NextFunction } from 'express';
import { VALIDATION_CONSTANTS } from './constants';

// File upload validation middleware
export class FileValidator {
  /**
   * Validate image file upload
   */
  static validateImage(fieldName: string = 'image') {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: `${fieldName} is required`,
        });
      }

      const file = req.file;
      const limits = VALIDATION_CONSTANTS.FILE_LIMITS.IMAGE;

      // Check file size
      if (file.size > limits.MAX_SIZE) {
        return res.status(400).json({
          success: false,
          error: `File size must be less than ${limits.MAX_SIZE / (1024 * 1024)}MB`,
        });
      }

      // Check file type
      if (!limits.ALLOWED_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File type not allowed. Allowed types: ${limits.ALLOWED_TYPES.join(', ')}`,
        });
      }

      // Check file dimensions for images
      if (file.mimetype.startsWith('image/')) {
        // Note: This would require additional processing to get actual dimensions
        // For now, we'll just validate the basic requirements
      }

      next();
    };
  }

  /**
   * Validate document file upload
   */
  static validateDocument(fieldName: string = 'document') {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: `${fieldName} is required`,
        });
      }

      const file = req.file;
      const limits = VALIDATION_CONSTANTS.FILE_LIMITS.DOCUMENT;

      // Check file size
      if (file.size > limits.MAX_SIZE) {
        return res.status(400).json({
          success: false,
          error: `File size must be less than ${limits.MAX_SIZE / (1024 * 1024)}MB`,
        });
      }

      // Check file type
      if (!limits.ALLOWED_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File type not allowed. Allowed types: ${limits.ALLOWED_TYPES.join(', ')}`,
        });
      }

      next();
    };
  }

  /**
   * Validate video file upload
   */
  static validateVideo(fieldName: string = 'video') {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: `${fieldName} is required`,
        });
      }

      const file = req.file;
      const limits = VALIDATION_CONSTANTS.FILE_LIMITS.VIDEO;

      // Check file size
      if (file.size > limits.MAX_SIZE) {
        return res.status(400).json({
          success: false,
          error: `File size must be less than ${limits.MAX_SIZE / (1024 * 1024)}MB`,
        });
      }

      // Check file type
      if (!limits.ALLOWED_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File type not allowed. Allowed types: ${limits.ALLOWED_TYPES.join(', ')}`,
        });
      }

      next();
    };
  }

  /**
   * Validate multiple files
   */
  static validateMultipleFiles(
    fieldName: string = 'files',
    maxFiles: number = 5,
    fileType: 'image' | 'document' | 'video' = 'image'
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: `At least one ${fieldName} is required`,
        });
      }

      if (req.files.length > maxFiles) {
        return res.status(400).json({
          success: false,
          error: `Maximum ${maxFiles} files allowed`,
        });
      }

      const limits = VALIDATION_CONSTANTS.FILE_LIMITS[fileType.toUpperCase() as keyof typeof VALIDATION_CONSTANTS.FILE_LIMITS];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i] as Express.Multer.File;

        // Check file size
        if (file.size > limits.MAX_SIZE) {
          return res.status(400).json({
            success: false,
            error: `File ${i + 1} size must be less than ${limits.MAX_SIZE / (1024 * 1024)}MB`,
          });
        }

        // Check file type
        if (!limits.ALLOWED_TYPES.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: `File ${i + 1} type not allowed. Allowed types: ${limits.ALLOWED_TYPES.join(', ')}`,
          });
        }
      }

      next();
    };
  }

  /**
   * Validate file size only
   */
  static validateFileSize(maxSize: number, fieldName: string = 'file') {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: `${fieldName} is required`,
        });
      }

      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        });
      }

      next();
    };
  }

  /**
   * Validate file type only
   */
  static validateFileType(allowedTypes: string[], fieldName: string = 'file') {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: `${fieldName} is required`,
        });
      }

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      next();
    };
  }

  /**
   * Optional file validation (file can be missing)
   */
  static validateOptionalFile(
    fileType: 'image' | 'document' | 'video' = 'image',
    fieldName: string = 'file'
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        // File is optional, continue
        return next();
      }

      const limits = VALIDATION_CONSTANTS.FILE_LIMITS[fileType.toUpperCase() as keyof typeof VALIDATION_CONSTANTS.FILE_LIMITS];

      // Check file size
      if (req.file.size > limits.MAX_SIZE) {
        return res.status(400).json({
          success: false,
          error: `File size must be less than ${limits.MAX_SIZE / (1024 * 1024)}MB`,
        });
      }

      // Check file type
      if (!limits.ALLOWED_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File type not allowed. Allowed types: ${limits.ALLOWED_TYPES.join(', ')}`,
        });
      }

      next();
    };
  }
}

// Export individual validation functions for convenience
export const {
  validateImage,
  validateDocument,
  validateVideo,
  validateMultipleFiles,
  validateFileSize,
  validateFileType,
  validateOptionalFile,
} = FileValidator;
