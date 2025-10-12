import PDFDocument from 'pdfkit';
import { Enrollment as EnrollmentModel, Course as CourseModel, User as UserModel } from '../../shared/models';
import path from 'path';
import fs from 'fs';

export class ClientCertificateService {
  /**
   * Get user's certificates
   */
  static async getUserCertificates(userId: string) {
    const enrollments = await EnrollmentModel.find({
      studentId: userId,
      isCompleted: true,
      certificateIssued: true
    })
      .populate('courseId', 'title description thumbnail category domain')
      .sort({ completedAt: -1 });

    return enrollments.map(enrollment => {
      const course = enrollment.courseId as any;
      return {
        _id: enrollment._id,
        courseId: course._id,
        courseTitle: course.title,
        issuedAt: enrollment.completedAt || enrollment.createdAt,
        downloadUrl: `/api/client/certificates/${enrollment._id}/download`,
        certificateNumber: this.generateCertificateNumber(enrollment._id.toString()),
        category: course.category || course.domain
      };
    });
  }

  /**
   * Get certificate details
   */
  static async getCertificateDetails(enrollmentId: string, userId: string) {
    const enrollment = await EnrollmentModel.findOne({
      _id: enrollmentId,
      studentId: userId,
      isCompleted: true,
      certificateIssued: true
    })
      .populate('courseId', 'title description instructorId')
      .populate('studentId', 'firstName lastName email');

    if (!enrollment) {
      throw new Error('Certificate not found or not issued');
    }

    const course = enrollment.courseId as any;
    const student = enrollment.studentId as any;

    return {
      enrollmentId: enrollment._id,
      certificateNumber: this.generateCertificateNumber(enrollment._id.toString()),
      studentName: `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      courseTitle: course.title,
      completedAt: enrollment.completedAt,
      issuedAt: enrollment.completedAt,
      progress: enrollment.progress,
      totalTimeSpent: enrollment.totalTimeSpent
    };
  }

  /**
   * Generate certificate PDF
   */
  static async generateCertificatePDF(enrollmentId: string, userId: string): Promise<Buffer> {
    const enrollment = await EnrollmentModel.findOne({
      _id: enrollmentId,
      studentId: userId,
      isCompleted: true,
      certificateIssued: true
    })
      .populate('courseId', 'title description instructorId')
      .populate('studentId', 'firstName lastName email');

    if (!enrollment) {
      throw new Error('Certificate not found or not issued');
    }

    const course = enrollment.courseId as any;
    const student = enrollment.studentId as any;
    const certificateNumber = this.generateCertificateNumber(enrollment._id.toString());
    const studentName = `${student.firstName} ${student.lastName}`;
    const courseTitle = course.title;
    const completionDate = enrollment.completedAt || new Date();

    return this.createPDF({
      certificateNumber,
      studentName,
      courseTitle,
      completionDate
    });
  }

  /**
   * Create PDF document
   */
  private static async createPDF(data: {
    certificateNumber: string;
    studentName: string;
    courseTitle: string;
    completionDate: Date;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Certificate design
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const centerX = pageWidth / 2;

        // Background border
        doc
          .lineWidth(10)
          .strokeColor('#1976d2')
          .rect(30, 30, pageWidth - 60, pageHeight - 60)
          .stroke();

        doc
          .lineWidth(3)
          .strokeColor('#64b5f6')
          .rect(40, 40, pageWidth - 80, pageHeight - 80)
          .stroke();

        // Header - Certificate of Achievement
        doc
          .fontSize(48)
          .font('Helvetica-Bold')
          .fillColor('#1976d2')
          .text('CERTIFICATE', 0, 100, { align: 'center' });

        doc
          .fontSize(32)
          .font('Helvetica')
          .fillColor('#424242')
          .text('of Achievement', 0, 160, { align: 'center' });

        // Decorative line
        doc
          .moveTo(centerX - 200, 210)
          .lineTo(centerX + 200, 210)
          .lineWidth(2)
          .strokeColor('#1976d2')
          .stroke();

        // This certifies that
        doc
          .fontSize(16)
          .font('Helvetica')
          .fillColor('#616161')
          .text('This certifies that', 0, 240, { align: 'center' });

        // Student Name
        doc
          .fontSize(36)
          .font('Helvetica-Bold')
          .fillColor('#1976d2')
          .text(data.studentName, 0, 280, { align: 'center' });

        // Has successfully completed
        doc
          .fontSize(16)
          .font('Helvetica')
          .fillColor('#616161')
          .text('has successfully completed the course', 0, 340, { align: 'center' });

        // Course Title
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#212121')
          .text(data.courseTitle, 100, 380, {
            align: 'center',
            width: pageWidth - 200
          });

        // Completion Date
        const formattedDate = data.completionDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc
          .fontSize(14)
          .font('Helvetica')
          .fillColor('#616161')
          .text(`Date of Completion: ${formattedDate}`, 0, 450, { align: 'center' });

        // Certificate Number
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#9e9e9e')
          .text(`Certificate No: ${data.certificateNumber}`, 0, pageHeight - 100, { align: 'center' });

        // Footer - Platform Name
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1976d2')
          .text('Learning Management System', 0, pageHeight - 70, { align: 'center' });

        // Signature line (left)
        doc
          .moveTo(150, pageHeight - 150)
          .lineTo(300, pageHeight - 150)
          .lineWidth(1)
          .strokeColor('#424242')
          .stroke();

        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#616161')
          .text('Authorized Signature', 150, pageHeight - 135, { width: 150, align: 'center' });

        // Signature line (right)
        doc
          .moveTo(pageWidth - 300, pageHeight - 150)
          .lineTo(pageWidth - 150, pageHeight - 150)
          .lineWidth(1)
          .strokeColor('#424242')
          .stroke();

        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#616161')
          .text('Director', pageWidth - 300, pageHeight - 135, { width: 150, align: 'center' });

        // Verification URL
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#9e9e9e')
          .text(
            `Verify this certificate at: ${process.env.FRONTEND_URL || 'https://lms.example.com'}/verify/${data.certificateNumber}`,
            0,
            pageHeight - 40,
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate certificate number
   */
  private static generateCertificateNumber(enrollmentId: string): string {
    const year = new Date().getFullYear();
    const shortId = enrollmentId.substring(enrollmentId.length - 8).toUpperCase();
    return `LMS-${year}-${shortId}`;
  }

  /**
   * Verify certificate
   */
  static async verifyCertificate(certificateNumber: string) {
    // Extract enrollment ID from certificate number
    const shortId = certificateNumber.split('-')[2];
    if (!shortId) {
      throw new Error('Invalid certificate number format');
    }

    // Find enrollment with matching ID suffix
    const enrollments = await EnrollmentModel.find({
      isCompleted: true,
      certificateIssued: true
    })
      .populate('courseId', 'title')
      .populate('studentId', 'firstName lastName');

    const enrollment = enrollments.find(e =>
      e._id.toString().endsWith(shortId.toLowerCase())
    );

    if (!enrollment) {
      return {
        valid: false,
        message: 'Certificate not found'
      };
    }

    const course = enrollment.courseId as any;
    const student = enrollment.studentId as any;

    return {
      valid: true,
      certificateNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      courseTitle: course.title,
      completedAt: enrollment.completedAt,
      issuedAt: enrollment.completedAt
    };
  }
}

