import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRGeneratorService from './qr-generator.service';
import Certificate, { ICertificate } from '../../models/core/Certificate';
import CertificateTemplate, { ICertificateTemplate } from '../../models/core/CertificateTemplate';
import { IUser } from '../../models/core/User';
import { ICourse } from '../../models/core/Course';

export interface SimpleCertificateTemplate {
  name: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  organizationName: string;
}

export interface CertificatePDFData {
  student: IUser;
  course: ICourse;
  certificate: ICertificate;
  template: SimpleCertificateTemplate;
  completionDate: Date;
  verificationUrl: string;
}

export class PDFGeneratorService {
  private static instance: PDFGeneratorService;
  private readonly templatesPath: string;
  private readonly outputPath: string;
  private readonly qrService: typeof QRGeneratorService;

  private constructor() {
    this.templatesPath = path.join(process.cwd(), 'assets', 'certificate-templates');
    this.outputPath = path.join(process.cwd(), 'storage', 'certificates');
    this.qrService = QRGeneratorService;
    this.ensureDirectories();
  }

  public static getInstance(): PDFGeneratorService {
    if (!PDFGeneratorService.instance) {
      PDFGeneratorService.instance = new PDFGeneratorService();
    }
    return PDFGeneratorService.instance;
  }

  private ensureDirectories(): void {
    [this.templatesPath, this.outputPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate Certificate PDF
   */
  public async generateCertificatePDF(data: CertificatePDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 50
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Apply template style
        this.applyTemplate(doc, data.template, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Apply Certificate Template
   */
  private applyTemplate(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate, data: CertificatePDFData): void {
    const { student, course, certificate, completionDate, verificationUrl } = data;

    // Background and Border
    this.addBackgroundAndBorder(doc, template);

    // Header Section
    this.addHeader(doc, template);

    // Title
    this.addTitle(doc, template);

    // Student Name (Main Focus)
    this.addStudentName(doc, template, student);

    // Course Information
    this.addCourseInfo(doc, template, course);

    // Completion Details
    this.addCompletionDetails(doc, template, completionDate);

    // Verification Section with QR Code
    this.addVerificationSection(doc, template, certificate, verificationUrl);

    // Footer
    this.addFooter(doc, template);

    // Decorative Elements
    this.addDecorativeElements(doc, template);
  }

  /**
   * Add Background and Border
   */
  private addBackgroundAndBorder(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate): void {
    const { width, height } = doc.page;
    
    // Background gradient effect using rectangles
    const gradientSteps = 20;
    const stepHeight = height / gradientSteps;
    
    for (let i = 0; i < gradientSteps; i++) {
      const opacity = 0.1 - (i * 0.005);
      doc.rect(0, i * stepHeight, width, stepHeight)
         .fillColor(template.primaryColor, opacity)
         .fill();
    }

    // Main border
    doc.rect(30, 30, width - 60, height - 60)
       .strokeColor(template.primaryColor)
       .lineWidth(3)
       .stroke();

    // Inner decorative border
    doc.rect(45, 45, width - 90, height - 90)
       .strokeColor(template.accentColor)
       .lineWidth(1)
       .stroke();
  }

  /**
   * Add Header Section
   */
  private addHeader(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate): void {
    const { width } = doc.page;
    
    // Organization Logo placeholder
    doc.circle(100, 100, 30)
       .strokeColor(template.primaryColor)
       .lineWidth(2)
       .stroke();

    // Add inner circle for logo effect
    doc.circle(100, 100, 20)
       .fillColor(template.primaryColor, 0.1)
       .fill();

    // Organization Name
    doc.fontSize(16)
       .fillColor(template.textColor)
       .font('Helvetica-Bold')
       .text(template.organizationName, 150, 85, { width: width - 300 });

    // Subtitle
    doc.fontSize(12)
       .font('Helvetica')
       .text('Learning Management System', 150, 105, { width: width - 300 });
  }

  /**
   * Add Certificate Title
   */
  private addTitle(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate): void {
    const { width } = doc.page;
    
    doc.fontSize(36)
       .fillColor(template.primaryColor)
       .font('Helvetica-Bold')
       .text('CERTIFICATE OF COMPLETION', 0, 180, { 
         width: width, 
         align: 'center' 
       });

    // Decorative line under title
    const lineY = 230;
    const lineWidth = 200;
    const startX = (width - lineWidth) / 2;
    
    doc.moveTo(startX, lineY)
       .lineTo(startX + lineWidth, lineY)
       .strokeColor(template.accentColor)
       .lineWidth(2)
       .stroke();
  }

  /**
   * Add Student Name (Main Focus)
   */
  private addStudentName(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate, student: IUser): void {
    const { width } = doc.page;
    
    doc.fontSize(14)
       .fillColor(template.textColor)
       .font('Helvetica')
       .text('This is to certify that', 0, 270, { 
         width: width, 
         align: 'center' 
       });

    // Student name with elegant styling
    doc.fontSize(32)
       .fillColor(template.primaryColor)
       .font('Helvetica-Bold')
       .text(`${student.firstName} ${student.lastName}`, 0, 300, { 
         width: width, 
         align: 'center' 
       });

    // Underline for student name
    const nameY = 350;
    const nameLineWidth = 300;
    const nameStartX = (width - nameLineWidth) / 2;
    
    doc.moveTo(nameStartX, nameY)
       .lineTo(nameStartX + nameLineWidth, nameY)
       .strokeColor(template.primaryColor)
       .lineWidth(1)
       .stroke();
  }

  /**
   * Add Course Information
   */
  private addCourseInfo(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate, course: ICourse): void {
    const { width } = doc.page;
    
    doc.fontSize(14)
       .fillColor(template.textColor)
       .font('Helvetica')
       .text('has successfully completed the course', 0, 380, { 
         width: width, 
         align: 'center' 
       });

    doc.fontSize(24)
       .fillColor(template.accentColor)
       .font('Helvetica-Bold')
       .text(course.title, 0, 410, { 
         width: width, 
         align: 'center' 
       });

    if (course.description) {
      doc.fontSize(12)
         .fillColor(template.textColor)
         .font('Helvetica-Oblique')
         .text(course.description.substring(0, 150) + (course.description.length > 150 ? '...' : ''), 0, 450, { 
           width: width, 
           align: 'center' 
         });
    }
  }

  /**
   * Add Completion Details
   */
  private addCompletionDetails(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate, completionDate: Date): void {
    const { width } = doc.page;
    
    const formattedDate = completionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(14)
       .fillColor(template.textColor)
       .font('Helvetica')
       .text('with distinction on this day', 0, 490, { 
         width: width, 
         align: 'center' 
       });

    doc.fontSize(18)
       .fillColor(template.primaryColor)
       .font('Helvetica-Bold')
       .text(formattedDate, 0, 520, { 
         width: width, 
         align: 'center' 
       });
  }

  /**
   * Add Verification Section with QR Code
   */
  private addVerificationSection(
    doc: PDFKit.PDFDocument, 
    template: SimpleCertificateTemplate, 
    certificate: ICertificate,
    verificationUrl: string
  ): void {
    const { width, height } = doc.page;
    
    // QR Code area
    const qrX = width - 150;
    const qrY = height - 150;
    const qrSize = 80;
    
    // QR Code border
    doc.rect(qrX, qrY, qrSize, qrSize)
       .strokeColor(template.primaryColor)
       .lineWidth(1)
       .stroke();

    // Simple QR representation (grid pattern)
    this.drawSimpleQRPattern(doc, qrX, qrY, qrSize, template.primaryColor);

    doc.fontSize(8)
       .fillColor(template.textColor)
       .text('Scan to Verify', qrX + 5, qrY + qrSize + 5, { width: qrSize - 10, align: 'center' });

    // Verification details
    doc.fontSize(10)
       .fillColor(template.textColor)
       .text('Certificate ID:', qrX, qrY + qrSize + 20)
       .text(certificate.certificateId, qrX, qrY + qrSize + 35, { width: 120 })
       .text('Verify online:', qrX, qrY + qrSize + 50)
       .fontSize(8)
       .text('lms.verify.com', qrX, qrY + qrSize + 65, { width: 120 });
  }

  /**
   * Draw Simple QR Pattern for visual representation
   */
  private drawSimpleQRPattern(doc: PDFKit.PDFDocument, x: number, y: number, size: number, color: string): void {
    const cellSize = size / 16; // 16x16 grid
    
    // Create a simple pattern that looks like QR code
    const pattern = [
      [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1],
      [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1],
      [1,0,0,0,0,0,1,0,1,1,1,0,0,0,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
      [1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
      [0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0],
      [0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0],
      [1,0,0,0,0,0,1,0,0,1,0,1,0,1,0,1]
    ];

    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        if (pattern[row][col]) {
          doc.rect(x + col * cellSize, y + row * cellSize, cellSize, cellSize)
             .fillColor(color)
             .fill();
        }
      }
    }
  }

  /**
   * Add Footer with Signatures
   */
  private addFooter(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate): void {
    const { width, height } = doc.page;
    
    // Signature area
    const sigY = height - 100;
    
    // Authorized by signature line
    doc.moveTo(100, sigY)
       .lineTo(250, sigY)
       .strokeColor(template.textColor)
       .lineWidth(1)
       .stroke();

    doc.fontSize(10)
       .fillColor(template.textColor)
       .text('Authorized Signature', 100, sigY + 10);

    // Date signature line
    doc.moveTo(width - 250, sigY)
       .lineTo(width - 100, sigY)
       .strokeColor(template.textColor)
       .lineWidth(1)
       .stroke();

    doc.fontSize(10)
       .fillColor(template.textColor)
       .text('Date Issued', width - 250, sigY + 10);
  }

  /**
   * Add Decorative Elements
   */
  private addDecorativeElements(doc: PDFKit.PDFDocument, template: SimpleCertificateTemplate): void {
    const { width, height } = doc.page;
    
    // Corner decorations
    this.addCornerDecoration(doc, 60, 60, template.accentColor);
    this.addCornerDecoration(doc, width - 90, 60, template.accentColor);
    this.addCornerDecoration(doc, 60, height - 90, template.accentColor);
    this.addCornerDecoration(doc, width - 90, height - 90, template.accentColor);

    // Side decorative elements
    for (let i = 0; i < 5; i++) {
      const y = 200 + (i * 50);
      doc.circle(80, y, 3)
         .fillColor(template.accentColor, 0.3)
         .fill();
      
      doc.circle(width - 80, y, 3)
         .fillColor(template.accentColor, 0.3)
         .fill();
    }

    // Add ornamental borders around main content
    const ornamentY1 = 260;
    const ornamentY2 = 540;
    
    for (let i = 0; i < 3; i++) {
      const x = 200 + (i * 100);
      doc.circle(x, ornamentY1, 2)
         .fillColor(template.accentColor, 0.5)
         .fill();
      doc.circle(x, ornamentY2, 2)
         .fillColor(template.accentColor, 0.5)
         .fill();
    }
  }

  /**
   * Add Corner Decoration
   */
  private addCornerDecoration(doc: PDFKit.PDFDocument, x: number, y: number, color: string): void {
    doc.circle(x, y, 8)
       .strokeColor(color)
       .lineWidth(1)
       .stroke();
    
    doc.circle(x, y, 4)
       .fillColor(color, 0.3)
       .fill();
  }

  /**
   * Save PDF to file
   */
  public async saveCertificatePDF(data: CertificatePDFData, filename: string): Promise<string> {
    const pdfBuffer = await this.generateCertificatePDF(data);
    const filePath = path.join(this.outputPath, filename);
    
    fs.writeFileSync(filePath, pdfBuffer);
    return filePath;
  }

  /**
   * Generate filename for certificate
   */
  public generateCertificateFilename(certificate: ICertificate, student: IUser): string {
    const sanitizedName = `${student.firstName}_${student.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    return `certificate_${certificate.certificateId}_${sanitizedName}_${timestamp}.pdf`;
  }

  /**
   * Create beautiful certificate templates
   */
  public createTemplate(name: string, primaryColor: string, accentColor: string, organizationName: string): SimpleCertificateTemplate {
    return {
      name,
      primaryColor,
      accentColor,
      textColor: '#333333',
      organizationName
    };
  }
}

export default PDFGeneratorService.getInstance();
