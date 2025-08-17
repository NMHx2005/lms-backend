import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

// Cloudinary upload options
export const CLOUDINARY_UPLOAD_OPTIONS = {
  // Image upload options
  image: {
    folder: 'lms/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image' as const,
  },
  
  // Video upload options
  video: {
    folder: 'lms/videos',
    allowed_formats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'video' as const,
  },
  
  // Document upload options
  document: {
    folder: 'lms/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    resource_type: 'raw' as const,
  },
  
  // Audio upload options
  audio: {
    folder: 'lms/audio',
    allowed_formats: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'video' as const, // Cloudinary treats audio as video
  },
  
  // Archive upload options
  archive: {
    folder: 'lms/archives',
    allowed_formats: ['zip', 'rar', '7z', 'tar', 'gz'],
    resource_type: 'raw' as const,
  },
};

// Cloudinary utility functions
export const cloudinaryUtils = {
  // Get upload options by file type
  getUploadOptions: (fileType: string) => {
    if (fileType.startsWith('image/')) return CLOUDINARY_UPLOAD_OPTIONS.image;
    if (fileType.startsWith('video/')) return CLOUDINARY_UPLOAD_OPTIONS.video;
    if (fileType.startsWith('audio/')) return CLOUDINARY_UPLOAD_OPTIONS.audio;
    if (fileType.includes('pdf') || fileType.includes('document')) return CLOUDINARY_UPLOAD_OPTIONS.document;
    if (fileType.includes('archive') || fileType.includes('compressed')) return CLOUDINARY_UPLOAD_OPTIONS.archive;
    return CLOUDINARY_UPLOAD_OPTIONS.document; // Default to document
  },
  
  // Generate unique filename
  generateUniqueFilename: (originalName: string, userId?: string) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const userIdSuffix = userId ? `_${userId}` : '';
    return `${timestamp}_${randomString}${userIdSuffix}.${extension}`;
  },
  
  // Get file type category
  getFileTypeCategory: (mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('archive') || mimeType.includes('compressed')) return 'archive';
    return 'document';
  },
  
  // Validate file format
  validateFileFormat: (mimeType: string, allowedFormats: string[]): boolean => {
    const fileExtension = mimeType.split('/')[1];
    return allowedFormats.includes(fileExtension);
  },
};

export default cloudinary;
