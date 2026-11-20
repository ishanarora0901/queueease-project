import express from 'express';
import { submitFeedback, getFeedbacks } from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', submitFeedback);
router.get('/', requireAdmin, getFeedbacks);

export default router;

