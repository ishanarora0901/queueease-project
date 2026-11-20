import express from 'express';
import {
  getStudentFeeStatus,
  verifyStudentFeeAccess,
  initiatePaymentOrder,
  verifyAndCompletePayment,
  downloadReceiptPDF,
  getAllTransactions,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireStaff } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Publicly accessible endpoints for receipt checking & student fee verification by UID + Password
router.get('/receipt/:receiptNumber', downloadReceiptPDF);
router.post('/verify-student-fee', verifyStudentFeeAccess);

router.use(authenticate);

router.get('/fee-status', getStudentFeeStatus);
router.post('/order', initiatePaymentOrder);
router.post('/verify', verifyAndCompletePayment);
router.get('/transactions', requireStaff, getAllTransactions);

export default router;

