import { Request } from 'express';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { AppError, ErrorFactory } from '../utils/errors';
import { cloudinaryUtils, CLOUDINARY_UPLOAD_OPTIONS } from '../config/cloudinary';

// File upload result interface
export interface FileUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  originalName: string;
  mimeType: string;
  folder: string;
  uploadedAt: Date;
}

// Batch upload result interface
export interface BatchUploadResult {
  successful: FileUploadResult[];
  failed: Array<{
    originalName: string;
    error: string;
    details?: any;
  }>;
  totalFiles: number;
  successCount: number;
  failureCount: number;
}

// Cloudinary upload service
export class CloudinaryService {
  // Upload single file
  static async uploadFile(
    file: Express.Multer.File,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: any[];
      resourceType?: 'image' | 'video' | 'raw';
      userId?: string;
    } = {}
  ): Promise<FileUploadResult> {
    try {
      const {
        folder,
        publicId,
        transformation,
        resourceType,
        userId,
      } = options;

      // Get upload options based on file type
      const uploadOptions = cloudinaryUtils.getUploadOptions(file.mimetype);
      const fileCategory = cloudinaryUtils.getFileTypeCategory(file.mimetype);
      
      // Generate unique filename if not provided
      const finalPublicId = publicId || cloudinaryUtils.generateUniqueFilename(file.originalname, userId);
      
      // Prepare upload parameters
      const uploadParams: any = {
        resource_type: resourceType || uploadOptions.resource_type,
        folder: folder || uploadOptions.folder,
        public_id: finalPublicId,
        overwrite: false,
        invalidate: true,
      };

      // Add transformation if available and not raw resource type
      if (transformation && uploadOptions.resource_type !== 'raw') {
        uploadParams.transformation = transformation;
      } else if (uploadOptions.resource_type !== 'raw' && 'transformation' in uploadOptions) {
        uploadParams.transformation = uploadOptions.transformation;
      }

      // Add specific options for images
      if (fileCategory === 'image') {
        uploadParams.eager = [
          { width: 300, height: 300, crop: 'fill', quality: 'auto:good' },
          { width: 800, height: 600, crop: 'limit', quality: 'auto:good' },
        ];
        uploadParams.eager_async = true;
      }

      // Add specific options for videos
      if (fileCategory === 'video') {
        uploadParams.eager = [
          { width: 640, height: 480, crop: 'scale', quality: 'auto:good' },
        ];
        uploadParams.eager_async = true;
        uploadParams.video_codec = 'auto';
      }

      // Upload to Cloudinary
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadParams,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error('Upload failed with no result'));
            }
          }
        );

        uploadStream.end(file.buffer);
      });

      // Format response
      const uploadResult: FileUploadResult = {
        publicId: result.public_id,
        url: result.secure_url,
        secureUrl: result.secure_url,
        format: result.format,
        resourceType: result.resource_type,
        size: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        thumbnailUrl: result.thumbnail_url,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: result.folder,
        uploadedAt: new Date(),
      };

      return uploadResult;
    } catch (error) {
      throw ErrorFactory.fileUpload(
        `Failed to upload file: ${file.originalname}`,
        {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: {
      folder?: string;
      transformation?: any[];
      resourceType?: 'image' | 'video' | 'raw';
      userId?: string;
      maxConcurrent?: number;
    } = {}
  ): Promise<BatchUploadResult> {
    const {
      folder,
      transformation,
      resourceType,
      userId,
      maxConcurrent = 3,
    } = options;

    const result: BatchUploadResult = {
      successful: [],
      failed: [],
      totalFiles: files.length,
      successCount: 0,
      failureCount: 0,
    };

    // Process files in batches to avoid overwhelming Cloudinary
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (file) => {
        try {
          const uploadResult = await this.uploadFile(file, {
            folder,
            transformation,
            resourceType,
            userId,
          });
          
          result.successful.push(uploadResult);
          result.successCount++;
          
          return uploadResult;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          result.failed.push({
            originalName: file.originalname,
            error: errorMessage,
            details: error instanceof AppError ? error.details : undefined,
          });
          
          result.failureCount++;
          
          throw error;
        }
      });

      try {
        await Promise.allSettled(batchPromises);
      } catch (error) {
        // Continue with next batch even if current batch fails
        console.error(`Batch upload failed:`, error);
      }
    }

    return result;
  }

  // Delete file from Cloudinary
  static async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      return result.result === 'ok';
    } catch (error) {
      throw ErrorFactory.fileUpload(
        `Failed to delete file: ${publicId}`,
        {
          publicId,
          resourceType,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  // Delete multiple files
  static async deleteMultipleFiles(
    files: Array<{ publicId: string; resourceType?: 'image' | 'video' | 'raw' }>
  ): Promise<{ successful: string[]; failed: Array<{ publicId: string; error: string }> }> {
    const result = {
      successful: [] as string[],
      failed: [] as Array<{ publicId: string; error: string }>,
    };

    const deletePromises = files.map(async (file) => {
      try {
        const deleted = await this.deleteFile(
          file.publicId,
          file.resourceType || 'image'
        );
        
        if (deleted) {
          result.successful.push(file.publicId);
        } else {
          result.failed.push({
            publicId: file.publicId,
            error: 'Delete operation returned false',
          });
        }
      } catch (error) {
        result.failed.push({
          publicId: file.publicId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.allSettled(deletePromises);
    return result;
  }

  // Get file information
  static async getFileInfo(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error) {
      throw ErrorFactory.fileUpload(
        `Failed to get file info: ${publicId}`,
        {
          publicId,
          resourceType,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  // Generate signed upload URL for direct uploads
  static generateSignedUploadUrl(
    params: {
      folder?: string;
      resourceType?: 'image' | 'video' | 'raw';
      transformation?: any[];
      expiresIn?: number;
    } = {}
  ): string {
    const {
      folder = 'lms/uploads',
      resourceType = 'image',
      transformation = [],
      expiresIn = 3600, // 1 hour
    } = params;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        resource_type: resourceType,
        transformation: JSON.stringify(transformation),
      },
      process.env.CLOUDINARY_API_SECRET || ''
    );

    return `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload?api_key=${process.env.CLOUDINARY_API_KEY}&timestamp=${timestamp}&signature=${signature}&folder=${folder}`;
  }

  // Optimize image for web
  static getOptimizedImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
      crop?: string;
    } = {}
  ): string {
    const {
      width,
      height,
      quality = 'auto:good',
      format = 'auto',
      crop = 'limit',
    } = options;

    let transformation = '';

    if (width || height) {
      transformation += `w_${width || 'auto'},h_${height || 'auto'},c_${crop},`;
    }

    transformation += `q_${quality},f_${format}`;

    return cloudinary.url(publicId, {
      transformation: transformation,
      secure: true,
    });
  }

  // Generate video thumbnail
  static getVideoThumbnailUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
      time?: string;
    } = {}
  ): string {
    const {
      width = 300,
      height = 200,
      quality = 'auto:good',
      format = 'jpg',
      time = '00:00:01',
    } = options;

    const transformation = `w_${width},h_${height},c_fill,q_${quality},f_${format}`;

    return cloudinary.url(publicId, {
      transformation: transformation,
      secure: true,
      resource_type: 'video',
    });
  }
}

export default CloudinaryService;
