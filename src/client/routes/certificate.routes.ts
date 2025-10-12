import express from 'express';
import { ClientCertificateController } from '../controllers/certificate.controller';

const router = express.Router();

// All routes here require authentication (registered in index with authenticate middleware)

// Get user's certificates list
router.get('/', ClientCertificateController.getCertificates);

// Download certificate PDF (must be before /:enrollmentId to avoid route conflict)
router.get('/:enrollmentId/download', ClientCertificateController.downloadCertificate);

// Get certificate details
router.get('/:enrollmentId', ClientCertificateController.getCertificateDetails);

export default router;
