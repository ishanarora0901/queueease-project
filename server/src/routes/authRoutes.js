import express from 'express';
import { register, login, adminLogin, getMe, refreshToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);

export default router;

