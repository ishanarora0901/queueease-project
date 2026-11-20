import express from 'express';
import {
  getAdminDashboardMetrics,
  getAllUsers,
  createAdminUser,
  updateUserStatus,
  deleteUser,
  createDepartment,
  updateDepartment,
  createCounter,
  updateCounterAdmin,
  getCampusWideQueues,
  adminOverrideToken,
  getAuditLogs,
  getAllCampusAppointments,
  updateAdminAppointmentStatus,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Strict Admin Gate: Only authenticated users with role === 'admin'
router.use(authenticate, requireAdmin);

// Dashboard metrics & analytics
router.get('/metrics', getAdminDashboardMetrics);

// User Management
router.get('/users', getAllUsers);
router.post('/users', createAdminUser);
router.patch('/users/:id', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Department Management
router.post('/departments', createDepartment);
router.patch('/departments/:id', updateDepartment);

// Counter Management
router.post('/counters', createCounter);
router.patch('/counters/:id', updateCounterAdmin);

// Campus-wide Queue Oversight & Overrides
router.get('/queues', getCampusWideQueues);
router.patch('/tokens/:id/override', adminOverrideToken);

// Appointments Oversight & Admin Cell
router.get('/appointments', getAllCampusAppointments);
router.patch('/appointments/:id/status', updateAdminAppointmentStatus);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;

