import express from 'express';
import {
  getStudentApplications,
  getAllCadApplications,
  submitCadApplication,
  updateCadApplicationStatus,
  downloadCertificatePDF,
  verifyCadCollectionQR,
} from '../controllers/cadController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireStaff } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Download can be accessed or authenticated
router.get('/download/:appNumber', downloadCertificatePDF);

router.use(authenticate);

router.get('/my-applications', getStudentApplications);
router.post('/apply', upload.array('documents', 5), submitCadApplication);

// Staff / Administrative CAD routes
router.get('/all', requireStaff, getAllCadApplications);
router.patch('/:id/status', requireStaff, updateCadApplicationStatus);
router.post('/verify-collection-qr', requireStaff, verifyCadCollectionQR);

export default router;

