import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { CertificateService } from '../../shared/services';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import Certificate from '../../shared/models/core/Certificate';
import fs from 'fs';
import path from 'path';

/**
 * Get user's certificates
 */
export const getMyCertificates = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const studentId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  // Build filter
  const filter: any = { studentId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const certificates = await Certificate.find(filter)
    .populate('courseId', 'title description thumbnail domain level')
    .populate('instructorId', 'firstName lastName')
    .sort({ issueDate: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Certificate.countDocuments(filter);

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
 * Get certificate by ID (user's own certificate)
 */
export const getCertificate = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { id } = req.params;
  const studentId = req.user.id;

  const certificate = await Certificate.findOne({ _id: id, studentId })
    .populate('courseId', 'title description thumbnail domain level')
    .populate('instructorId', 'firstName lastName');

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  // Increment view count
  await certificate.incrementView();

  res.json({
    success: true,
    data: certificate
  });
});

/**
 * Download certificate PDF
 */
export const downloadCertificate = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { id } = req.params;
  const studentId = req.user.id;

  const certificate = await Certificate.findOne({ _id: id, studentId });

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  if (!certificate.pdfPath || !fs.existsSync(certificate.pdfPath)) {
    throw new AppError('Certificate PDF not available', 404);
  }

  // Increment download count
  await certificate.incrementDownload();

  const filename = path.basename(certificate.pdfPath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.sendFile(path.resolve(certificate.pdfPath));
});

/**
 * Check certificate eligibility for a course
 */
export const checkEligibility = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  const eligibility = await CertificateService.checkCertificateEligibility(studentId, courseId);

  res.json({
    success: true,
    data: eligibility
  });
});

/**
 * Request certificate generation
 */
export const requestCertificate = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { courseId } = req.body;
  const studentId = req.user.id;

  if (!courseId) {
    throw new AppError('Course ID is required', 400);
  }

  // Check if certificate already exists
  const existingCert = await Certificate.findOne({ studentId, courseId });
  if (existingCert) {
    throw new AppError('Certificate already exists for this course', 400);
  }

  const certificate = await CertificateService.generateCertificate(studentId, courseId, {
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
 * Get certificate sharing URL
 */
export const getSharingUrl = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { id } = req.params;
  const studentId = req.user.id;

  const certificate = await Certificate.findOne({ _id: id, studentId });

  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  if (!certificate.isShareable) {
    throw new AppError('Certificate is not shareable', 403);
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const sharingUrl = `${baseUrl}/verify/${certificate.verificationCode}`;

  // Social media sharing URLs
  const socialUrls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sharingUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(sharingUrl)}&text=${encodeURIComponent(`I just earned a certificate in ${(certificate as any).metadata.courseTitle}!`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharingUrl)}`
  };

  res.json({
    success: true,
    data: {
      sharingUrl,
      socialUrls,
      certificateId: certificate.certificateId,
      verificationCode: certificate.verificationCode
    }
  });
});

/**
 * Get certificate statistics for user
 */
export const getMyCertificateStats = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const studentId = req.user.id;

  const stats = await Certificate.aggregate([
    { $match: { studentId } },
    {
      $group: {
        _id: null,
        totalCertificates: { $sum: 1 },
        activeCertificates: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' },
        totalShares: { $sum: '$shareCount' }
      }
    }
  ]);

  // Certificate type distribution
  const typeDistribution = await Certificate.aggregate([
    { $match: { studentId } },
    {
      $group: {
        _id: '$certificateType',
        count: { $sum: 1 }
      }
    }
  ]);

  // Level distribution
  const levelDistribution = await Certificate.aggregate([
    { $match: { studentId } },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 }
      }
    }
  ]);

  // Recent certificates
  const recentCertificates = await Certificate.find({ studentId })
    .populate('courseId', 'title thumbnail')
    .sort({ issueDate: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalCertificates: 0,
        activeCertificates: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalShares: 0
      },
      typeDistribution,
      levelDistribution,
      recentCertificates
    }
  });
});

/**
 * Search user's certificates
 */
export const searchMyCertificates = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const studentId = req.user.id;
  const { q, type, level, startDate, endDate } = req.query;

  const pipeline: any[] = [
    { $match: { studentId } },
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' }
  ];

  // Build search filter
  const matchConditions: any[] = [];

  if (q) {
    matchConditions.push({
      $or: [
        { 'course.title': { $regex: q, $options: 'i' } },
        { certificateId: { $regex: q, $options: 'i' } },
        { 'metadata.courseDomain': { $regex: q, $options: 'i' } }
      ]
    });
  }

  if (type) matchConditions.push({ certificateType: type });
  if (level) matchConditions.push({ level: level });

  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
    matchConditions.push({ issueDate: dateFilter });
  }

  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  pipeline.push({ $sort: { issueDate: -1 } });

  const certificates = await Certificate.aggregate(pipeline);

  res.json({
    success: true,
    data: certificates
  });
});
