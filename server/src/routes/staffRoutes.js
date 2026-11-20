import express from 'express';
import {
  getStaffList,
  updateStaffAvailability,
  bookAppointment,
  getStudentAppointments,
  getStaffAppointments,
  updateAppointmentStatus,
} from '../controllers/staffController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireStaff } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Directory and Availability
router.get('/', getStaffList);
router.patch('/availability', requireStaff, updateStaffAvailability);

// Appointments
router.post('/appointments/book', bookAppointment);
router.get('/appointments/student', getStudentAppointments);
router.get('/appointments/staff', requireStaff, getStaffAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);

export default router;

