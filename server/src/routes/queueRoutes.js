import express from 'express';
import {
  getStudentActiveTokens,
  getStudentTokenHistory,
  bookToken,
  cancelToken,
  rescheduleToken,
  requestRejoinQueue,
  getCounterActiveQueue,
  callNextToken,
  updateTokenStatusByStaff,
  verifyTokenQR,
} from '../controllers/queueController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireStaff } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Student token routes
router.get('/student/active', getStudentActiveTokens);
router.get('/student/history', getStudentTokenHistory);
router.post('/book', bookToken);
router.patch('/:id/cancel', cancelToken);
router.patch('/:id/reschedule', rescheduleToken);
router.patch('/:id/rejoin', requestRejoinQueue);

// Staff counter queue routes
router.get('/counter/:counterId', requireStaff, getCounterActiveQueue);
router.post('/counter/:counterId/call-next', requireStaff, callNextToken);
router.patch('/:id/status', requireStaff, updateTokenStatusByStaff);
router.post('/verify-qr', requireStaff, verifyTokenQR);

export default router;

