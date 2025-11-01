import Certificate, { ICertificate } from '../../models/core/Certificate';
import CertificateTemplate, { ICertificateTemplate } from '../../models/core/CertificateTemplate';
import CertificateRequirement, { ICertificateRequirement } from '../../models/core/CertificateRequirement';

interface SimpleRequirement {
  type: 'course_completion' | 'quiz_score' | 'assignment_submission' | 'minimum_time' | 'attendance';
  threshold: number;
}
import User, { IUser } from '../../models/core/User';
import Course, { ICourse } from '../../models/core/Course';
import Enrollment from '../../models/core/Enrollment';
import LessonProgress from '../../models/core/LessonProgress';
import PDFGeneratorService, { CertificatePDFData } from './pdf-generator.service';
import QRGeneratorService from './qr-generator.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { AppError } from '../../utils/appError';
import mongoose from 'mongoose';
import crypto from 'crypto';

export interface CertificateGenerationOptions {
  templateId?: string;
  sendEmail?: boolean;
  generatePDF?: boolean;
}

export interface CertificateVerificationResult {
  isValid: boolean;
  certificate?: ICertificate;
  student?: IUser;
  course?: ICourse;
  message: string;
}

export class CertificateService {
  private static instance: CertificateService;
  private readonly pdfService: typeof PDFGeneratorService;
  private readonly qrService: typeof QRGeneratorService;
  private readonly emailService: typeof EmailNotificationService;

  private constructor() {
    // ✅ Import instances, không phải classes
    this.pdfService = PDFGeneratorService;
    this.qrService = QRGeneratorService;
    this.emailService = EmailNotificationService;
  }

  public static getInstance(): CertificateService {
    if (!CertificateService.instance) {
      CertificateService.instance = new CertificateService();
    }
    return CertificateService.instance;
  }

  /**
   * Check if student is eligible for certificate
   */
  public async checkCertificateEligibility(
    studentId: string,
    courseId: string
  ): Promise<{
    isEligible: boolean;
    requirements: ICertificateRequirement[];
    completedRequirements: string[];
    missingRequirements: string[];
  }> {
    try {
      // Get course and requirements
      const course = await Course.findById(courseId).populate('sections');
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // For now, use simple default requirements
      // Only require course completion - skip time requirement for now
      const defaultRequirements: SimpleRequirement[] = [
        { type: 'course_completion', threshold: 100 }
        // { type: 'minimum_time', threshold: 1 } // Temporarily disabled - 1 hour minimum
      ];

      // Get student's enrollment and progress
      const enrollment = await Enrollment.findOne({ studentId, courseId });
      if (!enrollment) {
        throw new AppError('Student not enrolled in this course', 404);
      }

      const completedRequirements: string[] = [];
      const missingRequirements: string[] = [];

      // Check each requirement
      for (let i = 0; i < defaultRequirements.length; i++) {
        const requirement = defaultRequirements[i];
        const isCompleted = await this.checkSingleRequirement(studentId, courseId, requirement);

        if (isCompleted) {
          completedRequirements.push(i.toString());
        } else {
          missingRequirements.push(i.toString());
        }
      }

      const isEligible = missingRequirements.length === 0;

      return {
        isEligible,
        requirements: defaultRequirements as any,
        completedRequirements,
        missingRequirements
      };
    } catch (error) {
      console.error('Error checking certificate eligibility:', error);
      throw error;
    }
  }

  /**
   * Check single requirement completion
   */
  private async checkSingleRequirement(
    studentId: string,
    courseId: string,
    requirement: SimpleRequirement
  ): Promise<boolean> {
    try {
      switch (requirement.type) {
        case 'course_completion':
          return await this.checkCourseCompletion(studentId, courseId, requirement.threshold);

        case 'quiz_score':
          return await this.checkQuizScore(studentId, courseId, requirement.threshold);

        case 'assignment_submission':
          return await this.checkAssignmentSubmission(studentId, courseId);

        case 'minimum_time':
          return await this.checkMinimumTime(studentId, courseId, requirement.threshold);

        case 'attendance':
          return await this.checkAttendance(studentId, courseId, requirement.threshold);

        default:
          console.warn(`Unknown requirement type: ${requirement.type}`);
          return false;
      }
    } catch (error) {
      console.error('Error checking single requirement:', error);
      return false;
    }
  }

  /**
   * Check course completion percentage
   */
  private async checkCourseCompletion(
    studentId: string,
    courseId: string,
    threshold: number
  ): Promise<boolean> {
    try {
      const enrollment = await Enrollment.findOne({ studentId, courseId });
      if (!enrollment) return false;

      return enrollment.progress >= threshold;
    } catch (error) {
      console.error('Error checking course completion:', error);
      return false;
    }
  }

  /**
   * Check quiz score average
   */
  private async checkQuizScore(
    studentId: string,
    courseId: string,
    threshold: number
  ): Promise<boolean> {
    try {
      // This would need to be implemented based on your quiz/assignment system
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('Error checking quiz score:', error);
      return false;
    }
  }

  /**
   * Check assignment submission
   */
  private async checkAssignmentSubmission(
    studentId: string,
    courseId: string
  ): Promise<boolean> {
    try {
      // This would need to be implemented based on your assignment system
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('Error checking assignment submission:', error);
      return false;
    }
  }

  /**
   * Check minimum time spent
   */
  private async checkMinimumTime(
    studentId: string,
    courseId: string,
    threshold: number
  ): Promise<boolean> {
    try {
      const enrollment = await Enrollment.findOne({ studentId, courseId });
      if (!enrollment) return false;

      return enrollment.totalTimeSpent >= threshold;
    } catch (error) {
      console.error('Error checking minimum time:', error);
      return false;
    }
  }

  /**
   * Check attendance (for live sessions)
   */
  private async checkAttendance(
    studentId: string,
    courseId: string,
    threshold: number
  ): Promise<boolean> {
    try {
      // This would need to be implemented based on your attendance tracking system
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('Error checking attendance:', error);
      return false;
    }
  }

  /**
   * Generate certificate for student
   */
  public async generateCertificate(
    studentId: string,
    courseId: string,
    options: CertificateGenerationOptions = {}
  ): Promise<ICertificate> {
    try {
      // Check eligibility first
      const eligibility = await this.checkCertificateEligibility(studentId, courseId);
      if (!eligibility.isEligible) {
        throw new AppError('Student is not eligible for certificate', 400);
      }

      // Check if certificate already exists
      const existingCert = await Certificate.findOne({ studentId, courseId });
      if (existingCert) {
        throw new AppError('Certificate already generated for this student and course', 400);
      }

      // Get student, course and enrollment data
      const student = await User.findById(studentId);
      const course = await Course.findById(courseId);
      const enrollment = await Enrollment.findOne({ studentId, courseId });

      if (!student || !course || !enrollment) {
        throw new AppError('Student, course or enrollment not found', 404);
      }

      // Get template - for now use a simple template
      const template = this.pdfService.createTemplate(
        'Default Certificate Template',
        '#2E7D32',
        '#FFC107',
        'Learning Management System'
      );

      // Generate certificate ID and verification URL
      const certificateId = this.qrService.generateCertificateId();
      const verificationUrl = this.qrService.generateVerificationURL(certificateId);

      // QR code is optional - generate it after certificate is saved
      // If QR generation fails, certificate can still be issued without QR code
      let qrCode = '';

      // Calculate temporary hash for validation (will be recalculated in pre-save middleware)
      // Using completionDate from enrollment or current date
      const tempCompletionDate = enrollment.completedAt || new Date();
      const tempHash = crypto.createHash('sha256')
        .update(`${certificateId}${studentId}${courseId}${tempCompletionDate}85`)
        .digest('hex');

      // Get instructor name
      const instructor = await User.findById(course.instructorId).select('firstName lastName name');
      const instructorName = instructor
        ? `${instructor.firstName} ${instructor.lastName}`.trim() || instructor.name || 'Instructor'
        : 'Instructor';

      // Calculate completion percentage and get assignment data
      const completionPercentage = enrollment.progress || 100;

      // Get assignment stats (if available) - with error handling
      let totalAssignments = 0;
      let assignmentsPassed = 0;
      try {
        const Assignment = mongoose.model('Assignment');
        totalAssignments = await Assignment.countDocuments({ courseId }).catch(() => 0);
        const Submission = mongoose.model('Submission');
        assignmentsPassed = await Submission.countDocuments({
          studentId,
          courseId,
          status: 'approved'
        }).catch(() => 0);
      } catch (err) {
        // Models might not exist, use defaults
        console.warn('Could not fetch assignment stats, using defaults:', err);
      }

      // Create certificate record with all required fields
      const certificate = new Certificate({
        certificateId,
        studentId,
        courseId,
        instructorId: course.instructorId,
        enrollmentId: enrollment._id,
        completionDate: enrollment.completedAt || new Date(),
        issueDate: new Date(),
        finalScore: 85, // placeholder - can be calculated from assignments later
        timeSpent: enrollment.totalTimeSpent || 0,
        certificateType: 'completion',
        level: 'silver',
        grade: 'pass',
        templateId: new mongoose.Types.ObjectId(), // placeholder
        verificationCode: this.qrService.generateCertificateId(),
        qrCode: qrCode,
        verificationHash: tempHash, // Temporary hash for validation - will be recalculated in pre-save middleware
        pdfUrl: `/api/client/certificates/${enrollment._id}/download`, // Temporary URL, will be updated after PDF generation
        pdfPath: `storage/certificates/${certificateId}.pdf`, // Temporary path, will be updated after PDF generation
        fileSize: 0, // Will be updated after PDF generation
        requirementsMet: {
          completionPercentage: completionPercentage,
          assignmentsPassed: assignmentsPassed || 0,
          totalAssignments: totalAssignments || 0,
          minimumScore: 70, // Default passing score
          achievedScore: 85, // Placeholder - can be calculated later
          timeRequirement: 0, // No minimum time requirement for now
          timeSpent: enrollment.totalTimeSpent || 0
        },
        metadata: {
          courseTitle: course.title,
          courseDomain: course.domain || 'General',
          courseLevel: course.level || 'Beginner',
          instructorName: instructorName,
          platformName: 'Learning Management System',
          platformUrl: process.env.APP_BASE_URL || 'http://localhost:5000'
        }
      });

      await certificate.save();

      // Generate QR code after certificate is saved (optional - don't fail if it errors)
      try {
        qrCode = this.qrService.generateCertificateQR(certificateId);
        certificate.qrCode = qrCode;
        await certificate.save();
      } catch (qrError: any) {
        console.warn('Could not generate QR code for certificate, but certificate is still valid:', qrError.message);
        // Certificate is still valid without QR code
      }

      // Update enrollment to mark certificate as issued
      if (enrollment && !enrollment.certificateIssued) {
        enrollment.certificateIssued = true;
        enrollment.certificateUrl = `/api/client/certificates/${enrollment._id}/download`;
        await enrollment.save();
      }

      // Generate PDF if requested
      if (options.generatePDF !== false) {
        await this.generateCertificatePDF(certificate, student, course, template);
      }

      // Send email notification if requested
      if (options.sendEmail !== false) {
        await this.sendCertificateEmail(certificate, student, course);
      }

      return certificate;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  /**
   * Generate PDF for certificate
   */
  private async generateCertificatePDF(
    certificate: ICertificate,
    student: IUser,
    course: ICourse,
    template: any
  ): Promise<void> {
    try {
      const pdfData: CertificatePDFData = {
        student,
        course,
        certificate,
        template,
        completionDate: certificate.completionDate || certificate.issueDate,
        verificationUrl: this.qrService.generateVerificationURL(certificate.certificateId)
      };

      const filename = this.pdfService.generateCertificateFilename(certificate, student);
      const filePath = await this.pdfService.saveCertificatePDF(pdfData, filename);

      // Get file size if file exists
      let fileSize = 0;
      try {
        const fs = await import('fs');
        if (fs.existsSync(filePath)) {
          fileSize = fs.statSync(filePath).size;
        }
      } catch (err) {
        console.warn('Could not get PDF file size:', err);
      }

      // Update certificate with PDF path, URL, and file size
      certificate.pdfPath = filePath;
      certificate.pdfUrl = `/api/client/certificates/${certificate.enrollmentId}/download`;
      certificate.fileSize = fileSize;

      // Ensure QR code is set if not already
      if (!certificate.qrCode || certificate.qrCode === '') {
        const verificationUrl = this.qrService.generateVerificationURL(certificate.certificateId);
        certificate.qrCode = this.qrService.generateCertificateQR(verificationUrl);
      }

      await certificate.save();
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      throw error;
    }
  }

  /**
   * Send certificate email notification
   */
  private async sendCertificateEmail(
    certificate: ICertificate,
    student: IUser,
    course: ICourse
  ): Promise<void> {
    try {
      // For now, skip email notification as we need to implement this properly
      console.log(`Certificate email would be sent to ${student.email}`);
    } catch (error) {
      console.error('Error sending certificate email:', error);
      // Don't throw error here, certificate generation should still succeed
    }
  }

  /**
   * Verify certificate
   */
  public async verifyCertificate(certificateId: string): Promise<CertificateVerificationResult> {
    console.log('🔍 CertificateService.verifyCertificate called with:', certificateId);

    try {
      // Validate certificate ID format
      console.log('🔍 Validating certificate ID format...');
      if (!this.qrService.validateCertificateId(certificateId)) {
        console.log('❌ Certificate ID format validation failed');
        return {
          isValid: false,
          message: 'Invalid certificate ID format'
        };
      }
      console.log('✅ Certificate ID format validation passed');

      // Find certificate
      console.log('🔍 Searching for certificate in database...');
      const certificate = await Certificate.findOne({ certificateId })
        .populate('studentId')
        .populate('courseId');

      if (!certificate) {
        console.log('❌ Certificate not found in database');
        return {
          isValid: false,
          message: 'Certificate not found'
        };
      }
      console.log('✅ Certificate found in database');

      // Check certificate status
      console.log('🔍 Checking certificate status...');
      if (certificate.status === 'revoked') {
        console.log('❌ Certificate has been revoked');
        return {
          isValid: false,
          certificate,
          message: 'Certificate has been revoked'
        };
      }

      if (certificate.status === 'expired') {
        console.log('❌ Certificate has expired');
        return {
          isValid: false,
          certificate,
          message: 'Certificate has expired'
        };
      }

      console.log('✅ Certificate verification successful');
      return {
        isValid: true,
        certificate,
        student: certificate.studentId as unknown as IUser,
        course: certificate.courseId as unknown as ICourse,
        message: 'Certificate is valid'
      };
    } catch (error) {
      console.error('❌ Error in verifyCertificate:', error);
      return {
        isValid: false,
        message: 'Error verifying certificate'
      };
    }
  }

  /**
   * Revoke certificate
   */
  public async revokeCertificate(
    certificateId: string,
    reason: string,
    revokedBy: string
  ): Promise<void> {
    try {
      const certificate = await Certificate.findOne({ certificateId });
      if (!certificate) {
        throw new AppError('Certificate not found', 404);
      }

      certificate.status = 'revoked';
      // Add to audit log instead of separate fields
      certificate.auditLog.push({
        action: 'revoked',
        timestamp: new Date(),
        userId: new mongoose.Types.ObjectId(revokedBy),
        details: `Certificate revoked: ${reason}`
      });

      await certificate.save();

      // Send revocation notification
      const student = await User.findById(certificate.studentId);
      const course = await Course.findById(certificate.courseId);

      if (student && course) {
        // For now, skip email notification
        console.log(`Certificate revocation email would be sent to ${student.email}`);
      }
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    }
  }

  /**
   * Get certificates for student
   */
  public async getStudentCertificates(studentId: string): Promise<ICertificate[]> {
    try {
      return await Certificate.find({ studentId })
        .populate('courseId', 'title description thumbnail')
        .populate('templateId')
        .sort({ issuedDate: -1 });
    } catch (error) {
      console.error('Error getting student certificates:', error);
      throw error;
    }
  }

  /**
   * Get certificates for course
   */
  public async getCourseCertificates(courseId: string): Promise<ICertificate[]> {
    try {
      return await Certificate.find({ courseId })
        .populate('studentId', 'firstName lastName email')
        .populate('templateId')
        .sort({ issuedDate: -1 });
    } catch (error) {
      console.error('Error getting course certificates:', error);
      throw error;
    }
  }

  /**
   * Create default certificate template (placeholder for future implementation)
   */
  private createDefaultTemplate() {
    return this.pdfService.createTemplate(
      'Default Certificate Template',
      '#2E7D32',
      '#FFC107',
      'Learning Management System'
    );
  }

  /**
   * Auto-generate certificates for completed courses
   */
  public async autoGenerateCertificates(): Promise<void> {
    try {
      // Find all completed enrollments without certificates
      const completedEnrollments = await Enrollment.find({
        isCompleted: true,
        progress: 100
      }).populate('studentId').populate('courseId');

      for (const enrollment of completedEnrollments) {
        try {
          // Check if certificate already exists
          const existingCert = await Certificate.findOne({
            studentId: enrollment.studentId,
            courseId: enrollment.courseId
          });

          if (!existingCert) {
            // Check eligibility and generate certificate
            const eligibility = await this.checkCertificateEligibility(
              enrollment.studentId.toString(),
              enrollment.courseId.toString()
            );

            if (eligibility.isEligible) {
              await this.generateCertificate(
                enrollment.studentId.toString(),
                enrollment.courseId.toString(),
                { sendEmail: true, generatePDF: true }
              );
              console.log(`Certificate generated for student ${enrollment.studentId} in course ${enrollment.courseId}`);
            }
          }
        } catch (error) {
          console.error(`Error auto-generating certificate for enrollment ${enrollment._id}:`, error);
          // Continue with next enrollment
        }
      }
    } catch (error) {
      console.error('Error in auto-generate certificates:', error);
      throw error;
    }
  }
}

export default CertificateService.getInstance();
