import QRCodeGenerator from 'qrcode-generator';
import { nanoid } from 'nanoid';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  cellSize?: number;
}

export class QRGeneratorService {
  private static instance: QRGeneratorService;

  private constructor() {}

  public static getInstance(): QRGeneratorService {
    if (!QRGeneratorService.instance) {
      QRGeneratorService.instance = new QRGeneratorService();
    }
    return QRGeneratorService.instance;
  }

  /**
   * Generate QR Code for Certificate Verification
   */
  public generateCertificateQR(
    verificationUrl: string,
    options: QRCodeOptions = {}
  ): string {
    const {
      size = 200,
      margin = 4,
      errorCorrectionLevel = 'M',
      cellSize = 4
    } = options;

    try {
      // Create QR code instance with error correction level
      const typeNumber = this.getOptimalTypeNumber(verificationUrl) as any;
      const qr = QRCodeGenerator(typeNumber, errorCorrectionLevel);
      qr.addData(verificationUrl);
      qr.make();

      // Generate SVG string
      const svgString = qr.createSvgTag({
        cellSize,
        margin
      });

      return svgString;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR Code as Data URL (for embedding in PDF)
   */
  public generateQRCodeDataURL(
    verificationUrl: string,
    options: QRCodeOptions = {}
  ): string {
    const {
      size = 200,
      errorCorrectionLevel = 'M'
    } = options;

    try {
      const typeNumber = this.getOptimalTypeNumber(verificationUrl) as any;
      const qr = QRCodeGenerator(typeNumber, errorCorrectionLevel);
      qr.addData(verificationUrl);
      qr.make();

      // Create a simple data URL representation
      // In a real implementation, you might want to use a canvas library
      const modules = qr.getModuleCount();
      const cellSize = Math.floor(size / modules);
      
      // For now, return the SVG as data URL
      const svgString = qr.createSvgTag({
        cellSize: cellSize,
        margin: 4
      });

      // Convert SVG to base64 data URL
      const base64 = Buffer.from(svgString).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error('Error generating QR code data URL:', error);
      throw new Error('Failed to generate QR code data URL');
    }
  }

  /**
   * Generate verification URL for certificate
   */
  public generateVerificationURL(
    certificateId: string,
    baseUrl: string = process.env.APP_BASE_URL || 'http://localhost:5000'
  ): string {
    return `${baseUrl}/verify/certificate/${certificateId}`;
  }

  /**
   * Generate unique certificate ID
   */
  public generateCertificateId(): string {
    // ✅ Khớp chính xác với cách tạo trong seed script:
    // certificateId: `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    return `CERT_${timestamp}_${randomString}`;
  }

  /**
   * Validate certificate ID format
   */
  public validateCertificateId(certificateId: string): boolean {
    // ✅ Khớp chính xác với cách tạo trong seed script:
    // certificateId: `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    // 1. CERT_ (cố định)
    // 2. [0-9]+ (timestamp - chỉ số)
    // 3. _ (dấu gạch dưới)
    // 4. [a-z0-9]{9} (9 ký tự alphanumeric, có thể chữ thường)
    const pattern = /^CERT_[0-9]+_[a-z0-9]{9}$/;
    return pattern.test(certificateId);
  }

  /**
   * Get optimal QR code type number based on data length
   */
  private getOptimalTypeNumber(data: string): number {
    const length = data.length;
    
    // Type number determines the size/capacity of the QR code
    if (length <= 25) return 1;      // 21x21
    if (length <= 47) return 2;      // 25x25  
    if (length <= 77) return 3;      // 29x29
    if (length <= 114) return 4;     // 33x33
    if (length <= 154) return 5;     // 37x37
    if (length <= 195) return 6;     // 41x41
    if (length <= 224) return 7;     // 45x45
    if (length <= 279) return 8;     // 49x49
    if (length <= 335) return 9;     // 53x53
    if (length <= 395) return 10;    // 57x57
    
    return 10; // Maximum we'll support
  }

  /**
   * Generate QR code for certificate with all metadata
   */
  public generateCertificateQRWithMetadata(
    certificateId: string,
    studentName: string,
    courseName: string,
    completionDate: Date,
    options: QRCodeOptions = {}
  ): string {
    const verificationUrl = this.generateVerificationURL(certificateId);
    
    // Add metadata as query parameters for verification
    const urlWithMetadata = `${verificationUrl}?student=${encodeURIComponent(studentName)}&course=${encodeURIComponent(courseName)}&date=${completionDate.toISOString()}`;
    
    return this.generateCertificateQR(urlWithMetadata, options);
  }

  /**
   * Extract certificate data from QR verification URL
   */
  public extractCertificateDataFromUrl(url: string): {
    certificateId: string;
    studentName?: string;
    courseName?: string;
    completionDate?: Date;
  } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const certificateId = pathParts[pathParts.length - 1];

      if (!this.validateCertificateId(certificateId)) {
        return null;
      }

      const studentName = urlObj.searchParams.get('student') || undefined;
      const courseName = urlObj.searchParams.get('course') || undefined;
      const dateStr = urlObj.searchParams.get('date');
      const completionDate = dateStr ? new Date(dateStr) : undefined;

      return {
        certificateId,
        studentName,
        courseName,
        completionDate
      };
    } catch (error) {
      console.error('Error extracting certificate data from URL:', error);
      return null;
    }
  }
}

export default QRGeneratorService.getInstance();
