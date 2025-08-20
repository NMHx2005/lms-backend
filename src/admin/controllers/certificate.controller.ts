import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { CertificateService } from '../../shared/services';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import Certificate from '../../shared/models/core/Certificate';
import User from '../../shared/models/core/User';
import Course from '../../shared/models/core/Course';

/**
 * Get all certificates with filtering and pagination
 */
export const getAllCertificates = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const courseId = req.query.courseId as string;
  const studentId = req.query.studentId as string;

  // Build filter object
  const filter: any = {};
  if (status) filter.status = status;
  if (courseId) filter.courseId = courseId;
  if (studentId) filter.studentId = studentId;

  // Build aggregation pipeline
  const pipeline: any[] = [
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$student' },
    { $unwind: '$course' }
  ];

  // Add search filter if provided
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'student.firstName': { $regex: search, $options: 'i' } },
          { 'student.lastName': { $regex: search, $options: 'i' } },
          { 'course.title': { $regex: search, $options: 'i' } },
          { certificateId: { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  // Add pagination
  const skip = (page - 1) * limit;
  pipeline.push(
    { $sort: { issueDate: -1 } },
    { $skip: skip },
    { $limit: limit }
  );

  // Execute aggregation
  const certificates = await Certificate.aggregate(pipeline);

  // Get total count for pagination
  const totalPipeline = [...pipeline.slice(0, -3)]; // Remove sort, skip, limit
  totalPipeline.push({ $count: 'total' });
  const totalResult = await Certificate.aggregate(totalPipeline);
  const total = totalResult[0]?.total || 0;

  res.json({
    success: true,
    data: certificates,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get certificate statistics
 */
export const getCertificateStatistics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const stats = await Certificate.aggregate([
    {
      $group: {
        _id: null,
        totalCertificates: { $sum: 1 },
        activeCertificates: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        revokedCertificates: {
          $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] }
        },
        totalDownloads: { $sum: '$downloadCount' },
        totalVerifications: { $sum: '$verificationCount' }
      }
    }
  ]);

  // Certificate type distribution
  const typeDistribution = await Certificate.aggregate([
    {
      $group: {
        _id: '$certificateType',
        count: { $sum: 1 }
      }
    }
  ]);

  // Level distribution
  const levelDistribution = await Certificate.aggregate([
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 }
      }
    }
  ]);

  // Monthly issuance
  const monthlyIssuance = await Certificate.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$issueDate' },
          month: { $month: '$issueDate' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalCertificates: 0,
        activeCertificates: 0,
        revokedCertificates: 0,
        totalDownloads: 0,
        totalVerifications: 0
      },
      typeDistribution,
      levelDistribution,
      monthlyIssuance
    }
  });
});

/**
 * Get certificate by ID
 */
export const getCertificate = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { id } = req.params;

  const certificate = await Certificate.findById(id)
    .populate('studentId', 'firstName lastName email')
    .populate('courseId', 'title description thumbnail')
    .populate('instructorId', 'firstName lastName');

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  res.json({
    success: true,
    data: certificate
  });
});

/**
 * Revoke certificate
 */
export const revokeCertificate = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  if (!reason) {
    throw new AppError('Revocation reason is required', 400);
  }

  await CertificateService.revokeCertificate(id, reason, adminId);

  res.json({
    success: true,
    message: 'Certificate revoked successfully'
  });
});

/**
 * Bulk revoke certificates
 */
export const bulkRevokeCertificates = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { certificateIds, reason } = req.body;
  const adminId = req.user.id;

  if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
    throw new AppError('Certificate IDs are required', 400);
  }

  if (!reason) {
    throw new AppError('Revocation reason is required', 400);
  }

  const results = [];
  for (const certId of certificateIds) {
    try {
      await CertificateService.revokeCertificate(certId, reason, adminId);
      results.push({ certificateId: certId, success: true });
    } catch (error) {
      results.push({ 
        certificateId: certId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  res.json({
    success: true,
    message: 'Bulk revocation completed',
    data: results
  });
});

/**
 * Generate certificate manually
 */
export const generateCertificate = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { studentId, courseId, templateId } = req.body;

  if (!studentId || !courseId) {
    throw new AppError('Student ID and Course ID are required', 400);
  }

  const certificate = await CertificateService.generateCertificate(studentId, courseId, {
    templateId,
    sendEmail: true,
    generatePDF: true
  });

  res.status(201).json({
    success: true,
    message: 'Certificate generated successfully',
    data: certificate
  });
});

/**
 * Auto-generate certificates for completed courses
 */
export const autoGenerateCertificates = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  await CertificateService.autoGenerateCertificates();

  res.json({
    success: true,
    message: 'Auto-generation process completed'
  });
});

/**
 * Export certificates to CSV
 */
export const exportCertificates = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { status, startDate, endDate } = req.query;

  // Build filter
  const filter: any = {};
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.issueDate = {};
    if (startDate) filter.issueDate.$gte = new Date(startDate as string);
    if (endDate) filter.issueDate.$lte = new Date(endDate as string);
  }

  const certificates = await Certificate.find(filter)
    .populate('studentId', 'firstName lastName email')
    .populate('courseId', 'title')
    .sort({ issueDate: -1 });

  // Convert to CSV format
  const csvHeaders = [
    'Certificate ID',
    'Student Name',
    'Student Email',
    'Course Title',
    'Issue Date',
    'Status',
    'Final Score',
    'Time Spent (hours)',
    'Level',
    'Grade'
  ];

  const csvRows = certificates.map(cert => [
    cert.certificateId,
    `${(cert.studentId as any).firstName} ${(cert.studentId as any).lastName}`,
    (cert.studentId as any).email,
    (cert.courseId as any).title,
    cert.issueDate.toISOString().split('T')[0],
    cert.status,
    cert.finalScore,
    Math.round(cert.timeSpent / 3600 * 100) / 100,
    cert.level,
    cert.grade
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=certificates.csv');
  res.send(csvContent);
});
