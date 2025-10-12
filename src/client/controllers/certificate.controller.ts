import { Request, Response } from 'express';
import { ClientCertificateService } from '../services/certificate.service';

export class ClientCertificateController {
  /**
   * Get user's certificates
   */
  static async getCertificates(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const certificates = await ClientCertificateService.getUserCertificates(userId);

      res.json({
        success: true,
        data: certificates
      });
    } catch (error: any) {
      console.error('Get certificates error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch certificates'
      });
    }
  }

  /**
   * Get certificate details
   */
  static async getCertificateDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { enrollmentId } = req.params;
      const certificate = await ClientCertificateService.getCertificateDetails(enrollmentId, userId);

      res.json({
        success: true,
        data: certificate
      });
    } catch (error: any) {
      console.error('Get certificate details error:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch certificate details'
      });
    }
  }

  /**
   * Download certificate PDF
   */
  static async downloadCertificate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { enrollmentId } = req.params;
      const pdfBuffer = await ClientCertificateService.generateCertificatePDF(enrollmentId, userId);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=certificate-${enrollmentId}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Download certificate error:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to download certificate'
      });
    }
  }

  /**
   * Verify certificate (public endpoint)
   */
  static async verifyCertificate(req: Request, res: Response) {
    try {
      const { certificateId } = req.params;
      const result = await ClientCertificateService.verifyCertificate(certificateId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Verify certificate error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify certificate'
      });
    }
  }
}
