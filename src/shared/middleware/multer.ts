import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorFactory } from '../utils/errors';
import { cloudinaryUtils, CLOUDINARY_UPLOAD_OPTIONS } from '../config/cloudinary';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 524288000,             // 500MB (for video lessons)
  audio: 20 * 1024 * 1024,     // 20MB
  document: 10 * 1024 * 1024,  // 10MB
  archive: 50 * 1024 * 1024,   // 50MB
  default: 10 * 1024 * 1024,   // 10MB
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  video: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/quicktime',
  ],
  audio: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
  ],
  document: [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
    'application/vnd.ms-excel', // Excel .xls
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint .pptx
    'application/vnd.ms-powerpoint', // PowerPoint .ppt
    'text/plain', // .txt
    'text/csv', // CSV files
    'text/rtf', // .rtf
    'text/markdown', // .md
    'text/html', // .html
    'application/vnd.oasis.opendocument.text', // .odt
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
    'application/vnd.oasis.opendocument.presentation', // .odp
    'application/rtf', // Alternative RTF MIME type
    'application/x-rtf', // Another RTF variant
  ],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ],
} as const;

// File filter function
const fileFilter = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      // Check file size
      if (file.size && file.size > maxSize) {
        const error = ErrorFactory.fileUpload(
          `File size exceeds limit. Maximum allowed: ${Math.round(maxSize / (1024 * 1024))}MB`,
          {
            fileName: file.originalname,
            fileSize: file.size,
            maxSize,
            fileType: file.mimetype,
          }
        );
        return cb(error);
      }

      // Check MIME type
      if (!allowedTypes.includes(file.mimetype)) {
        const error = ErrorFactory.fileUpload(
          `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          {
            fileName: file.originalname,
            fileType: file.mimetype,
            allowedTypes,
          }
        );
        return cb(error);
      }

      // Check file extension
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      const allowedExtensions = allowedTypes.map(type => type.split('/')[1]);
      
      if (fileExtension && !allowedExtensions.includes(fileExtension)) {
        const error = ErrorFactory.fileUpload(
          `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
          {
            fileName: file.originalname,
            fileExtension,
            allowedExtensions,
          }
        );
        return cb(error);
      }

      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  };
};

// Multer storage configuration
const storage = multer.memoryStorage();

// Create multer instances for different file types
export const createMulterUpload = (
  fileType: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'mixed',
  maxFiles: number = 1,
  customFilter?: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => void
) => {
  let allowedTypes: string[] = [];
  let maxSize: number = FILE_SIZE_LIMITS.default;

  if (fileType === 'mixed') {
    allowedTypes = [
      ...ALLOWED_MIME_TYPES.image,
      ...ALLOWED_MIME_TYPES.video,
      ...ALLOWED_MIME_TYPES.audio,
      ...ALLOWED_MIME_TYPES.document,
      ...ALLOWED_MIME_TYPES.archive,
    ] as string[];
    maxSize = Math.max(...Object.values(FILE_SIZE_LIMITS));
  } else {
    allowedTypes = [...ALLOWED_MIME_TYPES[fileType]] as string[];
    maxSize = FILE_SIZE_LIMITS[fileType];
  }

  const filter = customFilter || fileFilter(allowedTypes, maxSize);

  return multer({
    storage,
    fileFilter: filter,
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
  });
};

// Predefined multer instances
export const multerInstances = {
  // Single file uploads
  singleImage: createMulterUpload('image', 1),
  singleVideo: createMulterUpload('video', 1),
  singleAudio: createMulterUpload('audio', 1),
  singleDocument: createMulterUpload('document', 1),
  singleArchive: createMulterUpload('archive', 1),
  
  // Multiple file uploads
  multipleImages: createMulterUpload('image', 10),
  multipleVideos: createMulterUpload('video', 5),
  multipleAudio: createMulterUpload('audio', 10),
  multipleDocuments: createMulterUpload('document', 20),
  multipleArchives: createMulterUpload('archive', 5),
  
  // Mixed file types
  mixedFiles: createMulterUpload('mixed', 20),
  
  // Custom configurations
  courseMaterials: createMulterUpload('mixed', 50, (req, file, cb) => {
    // Custom filter for course materials
    const allowedTypes = [
      ...ALLOWED_MIME_TYPES.image,
      ...ALLOWED_MIME_TYPES.video,
      ...ALLOWED_MIME_TYPES.audio,
      ...ALLOWED_MIME_TYPES.document,
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB for course materials
    
    fileFilter(allowedTypes, maxSize)(req, file, cb);
  }),
  
  profilePictures: createMulterUpload('image', 1, (req, file, cb) => {
    // Custom filter for profile pictures
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB for profile pictures
    
    fileFilter(allowedTypes, maxSize)(req, file, cb);
  }),
  
  courseThumbnails: createMulterUpload('image', 1, (req, file, cb) => {
    // Custom filter for course thumbnails
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 1 * 1024 * 1024; // 1MB for thumbnails
    
    fileFilter(allowedTypes, maxSize)(req, file, cb);
  }),
};

// Error handling middleware for multer
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    let appError: AppError;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        appError = ErrorFactory.fileUpload(
          'File too large',
          {
            error: error.message,
            code: error.code,
            field: error.field,
          }
        );
        break;
        
      case 'LIMIT_FILE_COUNT':
        appError = ErrorFactory.fileUpload(
          'Too many files',
          {
            error: error.message,
            code: error.code,
            field: error.field,
          }
        );
        break;
        
      case 'LIMIT_UNEXPECTED_FILE':
        appError = ErrorFactory.fileUpload(
          'Unexpected file field',
          {
            error: error.message,
            code: error.code,
            field: error.field,
          }
        );
        break;
        
      default:
        appError = ErrorFactory.fileUpload(
          'File upload error',
          {
            error: error.message,
            code: error.code,
            field: error.field,
          }
        );
    }
    
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        message: appError.message,
        code: appError.errorCode,
        statusCode: appError.statusCode,
        details: appError.details,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
      },
    });
  }
  
  next(error);
};

// File validation middleware
export const validateUploadedFiles = (
  requiredFields: string[] = [],
  maxFilesPerField: Record<string, number> = {}
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Handle both array format (from multer.array) and object format (from multer.fields)
      let filesObj: { [fieldname: string]: Express.Multer.File[] } = {};
      
      if (!req.files) {
        // No files at all - this is an error if required fields are specified
        if (requiredFields.length > 0) {
          const error = ErrorFactory.fileUpload(
            `Required file field '${requiredFields[0]}' is missing`,
            {
              requiredFields,
              providedFields: [],
            }
          );
          return res.status(error.statusCode).json({
            success: false,
            error: {
              message: error.message,
              code: error.errorCode,
              statusCode: error.statusCode,
              details: error.details,
              timestamp: new Date().toISOString(),
              path: req.originalUrl || req.url,
            },
          });
        }
        return next();
      }
      
      if (Array.isArray(req.files)) {
        // Direct array from multer.array() - convert to object format with 'files' key
        filesObj = { files: req.files };
      } else if (typeof req.files === 'object') {
        // Object format from multer.fields()
        filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
      }
      
      // Check required fields
      for (const field of requiredFields) {
        if (!filesObj[field] || filesObj[field].length === 0) {
          const error = ErrorFactory.fileUpload(
            `Required file field '${field}' is missing`,
            {
              requiredFields,
              providedFields: Object.keys(filesObj),
            }
          );
          return res.status(error.statusCode).json({
            success: false,
            error: {
              message: error.message,
              code: error.errorCode,
              statusCode: error.statusCode,
              details: error.details,
              timestamp: new Date().toISOString(),
              path: req.originalUrl || req.url,
            },
          });
        }
      }
      
      // Check file count per field
      for (const [field, maxCount] of Object.entries(maxFilesPerField)) {
        if (filesObj[field] && filesObj[field].length > maxCount) {
          const error = ErrorFactory.fileUpload(
            `Too many files for field '${field}'. Maximum allowed: ${maxCount}`,
            {
              field,
              fileCount: filesObj[field].length,
              maxCount,
            }
          );
          return res.status(error.statusCode).json({
            success: false,
            error: {
              message: error.message,
              code: error.errorCode,
              statusCode: error.statusCode,
              details: error.details,
              timestamp: new Date().toISOString(),
              path: req.originalUrl || req.url,
            },
          });
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default multerInstances;
