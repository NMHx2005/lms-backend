import { Request, Response } from 'express';
import { CertificateService, QRGeneratorService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import Certificate from '../models/core/Certificate';

/**
 * Verify certificate by ID or verification code
 */
export const verifyCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params; // Can be certificateId or verificationCode

  if (!identifier) {
    throw new AppError('Certificate identifier is required', 400);
  }

  // Try to find by certificateId first, then by verificationCode
  let certificate = await Certificate.findOne({ certificateId: identifier })
    .populate('studentId', 'firstName lastName')
    .populate('courseId', 'title description domain level')
    .populate('instructorId', 'firstName lastName');

  if (!certificate) {
    certificate = await Certificate.findOne({ verificationCode: identifier.toUpperCase() })
      .populate('studentId', 'firstName lastName')
      .populate('courseId', 'title description domain level')
      .populate('instructorId', 'firstName lastName');
  }

  if (!certificate) {
    return res.status(404).json({
      success: false,
      message: 'Certificate not found',
      data: {
        isValid: false,
        message: 'Certificate with this identifier does not exist'
      }
    });
  }

  // Use CertificateService to verify
  const verification = await CertificateService.verifyCertificate(certificate.certificateId);

  res.json({
    success: true,
    data: verification
  });
});

/**
 * Verify certificate from QR code data
 */
export const verifyFromQR = asyncHandler(async (req: Request, res: Response) => {
  const { qrData } = req.body;

  if (!qrData) {
    throw new AppError('QR code data is required', 400);
  }

  try {
    // Parse QR data (assuming it's a JSON string or URL)
    let certificateData;
    
    if (qrData.startsWith('http')) {
      // Extract certificate data from URL
      certificateData = QRGeneratorService.extractCertificateDataFromUrl(qrData);
    } else {
      // Assume it's JSON data
      certificateData = JSON.parse(qrData);
    }

    if (!certificateData || !certificateData.certificateId) {
      throw new AppError('Invalid QR code data', 400);
    }

    const verification = await CertificateService.verifyCertificate(certificateData.certificateId);

    res.json({
      success: true,
      data: {
        ...verification,
        qrMetadata: certificateData
      }
    });
  } catch (error) {
    throw new AppError('Invalid QR code format', 400);
  }
});

/**
 * Get public certificate view (for sharing)
 */
export const getPublicCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;

  const certificate = await Certificate.findOne({
    $or: [
      { certificateId: identifier },
      { verificationCode: identifier.toUpperCase() }
    ],
    isPublic: true,
    status: 'active'
  })
    .populate('studentId', 'firstName lastName')
    .populate('courseId', 'title description domain level thumbnail')
    .populate('instructorId', 'firstName lastName');

  if (!certificate) {
    throw new AppError('Certificate not found or not public', 404);
  }

  // Increment view count
  await certificate.incrementView();

  // Return sanitized data for public view
  const publicData = {
    certificateId: certificate.certificateId,
    studentName: `${(certificate.studentId as any).firstName} ${(certificate.studentId as any).lastName}`,
    course: {
      title: (certificate.courseId as any).title,
      description: (certificate.courseId as any).description,
      domain: (certificate.courseId as any).domain,
      level: (certificate.courseId as any).level,
      thumbnail: (certificate.courseId as any).thumbnail
    },
    instructor: {
      name: `${(certificate.instructorId as any).firstName} ${(certificate.instructorId as any).lastName}`
    },
    issueDate: certificate.issueDate,
    completionDate: certificate.completionDate,
    certificateType: certificate.certificateType,
    level: certificate.level,
    grade: certificate.grade,
    finalScore: certificate.finalScore,
    timeSpent: certificate.timeSpent,
    metadata: certificate.metadata,
    achievements: certificate.achievements,
    skillsEarned: certificate.skillsEarned,
    verificationHash: certificate.verificationHash,
    isVerified: certificate.isVerified,
    viewCount: certificate.viewCount
  };

  res.json({
    success: true,
    data: publicData
  });
});

/**
 * Bulk verify certificates
 */
export const bulkVerify = asyncHandler(async (req: Request, res: Response) => {
  const { identifiers } = req.body;

  if (!identifiers || !Array.isArray(identifiers) || identifiers.length === 0) {
    throw new AppError('Certificate identifiers are required', 400);
  }

  if (identifiers.length > 50) {
    throw new AppError('Maximum 50 certificates can be verified at once', 400);
  }

  const results = [];

  for (const identifier of identifiers) {
    try {
      const verification = await CertificateService.verifyCertificate(identifier);
      results.push({
        identifier,
        ...verification
      });
    } catch (error) {
      results.push({
        identifier,
        isValid: false,
        message: error instanceof Error ? error.message : 'Verification failed'
      });
    }
  }

  res.json({
    success: true,
    data: results
  });
});

/**
 * Get verification statistics
 */
export const getVerificationStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await Certificate.aggregate([
    {
      $group: {
        _id: null,
        totalCertificates: { $sum: 1 },
        activeCertificates: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        publicCertificates: {
          $sum: { $cond: ['$isPublic', 1, 0] }
        },
        totalVerifications: { $sum: '$verificationCount' },
        totalViews: { $sum: '$viewCount' },
        averageScore: { $avg: '$finalScore' }
      }
    }
  ]);

  // Top domains
  const topDomains = await Certificate.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$metadata.courseDomain',
        count: { $sum: 1 },
        averageScore: { $avg: '$finalScore' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Verification trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const verificationTrends = await Certificate.aggregate([
    {
      $match: {
        lastVerifiedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastVerifiedAt'
            }
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalCertificates: 0,
        activeCertificates: 0,
        publicCertificates: 0,
        totalVerifications: 0,
        totalViews: 0,
        averageScore: 0
      },
      topDomains,
      verificationTrends
    }
  });
});

/**
 * Generate verification report
 */
export const generateVerificationReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, format = 'json' } = req.query;

  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate as string);
  if (endDate) dateFilter.$lte = new Date(endDate as string);

  const matchFilter: any = {};
  if (Object.keys(dateFilter).length > 0) {
    matchFilter.issueDate = dateFilter;
  }

  const certificates = await Certificate.aggregate([
    { $match: matchFilter },
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
    { $unwind: '$course' },
    {
      $project: {
        certificateId: 1,
        studentName: {
          $concat: ['$student.firstName', ' ', '$student.lastName']
        },
        studentEmail: '$student.email',
        courseTitle: '$course.title',
        courseDomain: '$metadata.courseDomain',
        issueDate: 1,
        status: 1,
        finalScore: 1,
        level: 1,
        grade: 1,
        verificationCount: 1,
        viewCount: 1,
        downloadCount: 1,
        isPublic: 1,
        isVerified: 1
      }
    },
    { $sort: { issueDate: -1 } }
  ]);

  if (format === 'csv') {
    // Generate CSV
    const csvHeaders = [
      'Certificate ID',
      'Student Name',
      'Student Email',
      'Course Title',
      'Domain',
      'Issue Date',
      'Status',
      'Final Score',
      'Level',
      'Grade',
      'Verifications',
      'Views',
      'Downloads',
      'Is Public',
      'Is Verified'
    ];

    const csvRows = certificates.map(cert => [
      cert.certificateId,
      cert.studentName,
      cert.studentEmail,
      cert.courseTitle,
      cert.courseDomain,
      cert.issueDate.toISOString().split('T')[0],
      cert.status,
      cert.finalScore,
      cert.level,
      cert.grade,
      cert.verificationCount,
      cert.viewCount,
      cert.downloadCount,
      cert.isPublic ? 'Yes' : 'No',
      cert.isVerified ? 'Yes' : 'No'
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=verification-report.csv');
    res.send(csvContent);
  } else {
    res.json({
      success: true,
      data: {
        certificates,
        summary: {
          totalCertificates: certificates.length,
          activeCertificates: certificates.filter(c => c.status === 'active').length,
          averageScore: certificates.reduce((sum, c) => sum + c.finalScore, 0) / certificates.length || 0,
          totalVerifications: certificates.reduce((sum, c) => sum + c.verificationCount, 0),
          totalViews: certificates.reduce((sum, c) => sum + c.viewCount, 0)
        },
        generatedAt: new Date()
      }
    });
  }
});
