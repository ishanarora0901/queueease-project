import express from 'express';
import { getAllCounters, getCounterById, updateCounterStatus } from '../controllers/counterController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireStaff } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllCounters);
router.get('/:id', getCounterById);
router.patch('/:id/status', requireStaff, updateCounterStatus);

export default router;

