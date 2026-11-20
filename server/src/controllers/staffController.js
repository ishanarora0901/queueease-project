import { isMongoConnected } from '../config/db.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Department from '../models/Department.js';
import { memoryStore } from '../config/memoryStore.js';
import { sendNotification, getSocketIO } from '../services/notificationService.js';
import { logAuditEvent } from '../middleware/auditLogger.js';

export const getStaffList = async (req, res) => {
  try {
    const { department, search, availability } = req.query;

    let staffMembers = [];

    if (isMongoConnected()) {
      const query = { role: { $in: ['staff', 'admin'] }, status: 'active' };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { 'staffDetails.designation': { $regex: search, $options: 'i' } },
        ];
      }

      staffMembers = await User.find(query)
        .populate('staffDetails.department', 'name code')
        .populate('staffDetails.assignedCounter', 'counterNumber name status')
        .select('-password');

      if (department) {
        staffMembers = staffMembers.filter((s) => {
          const deptName = (s.staffDetails?.departmentName || '').toLowerCase();
          const deptCode = (s.staffDetails?.department?.code || '').toLowerCase();
          const filter = department.toLowerCase();
          return (
            deptName.includes(filter) ||
            deptCode === filter ||
            (filter === 'accounts' && (deptName.includes('fee') || deptName.includes('admission') || deptCode === 'adm')) ||
            (filter === 'admission' && (deptName.includes('admission') || deptName.includes('fee') || deptCode === 'adm')) ||
            (filter === 'admin' && (deptName.includes('admin') || deptName.includes('cad') || deptCode === 'cad'))
          );
        });
      }

      if (availability) {
        staffMembers = staffMembers.filter((s) => s.staffDetails?.availabilityStatus === availability);
      }
    } else {
      staffMembers = memoryStore.users
        .filter((u) => ['staff', 'admin'].includes(u.role) && u.status === 'active')
        .map((u) => {
          const { password, ...safe } = u;
          return safe;
        });

      if (search) {
        staffMembers = staffMembers.filter(
          (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.staffDetails?.designation && s.staffDetails.designation.toLowerCase().includes(search.toLowerCase()))
        );
      }

      if (department) {
        staffMembers = staffMembers.filter((s) =>
          s.staffDetails?.departmentName?.toLowerCase().includes(department.toLowerCase())
        );
      }

      if (availability) {
        staffMembers = staffMembers.filter((s) => s.staffDetails?.availabilityStatus === availability);
      }
    }

    res.json({ success: true, count: staffMembers.length, staff: staffMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaffAvailability = async (req, res) => {
  try {
    const userId = req.user._id;
    const { availabilityStatus, expectedReopenTime, statusNote, lunchHours, workingHours } = req.body;

    const validStatuses = ['available', 'busy', 'lunch_break', 'temporarily_unavailable', 'on_leave', 'absent'];

    if (!validStatuses.includes(availabilityStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid availability status.' });
    }

    let user = null;
    if (isMongoConnected()) {
      user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      user.staffDetails.availabilityStatus = availabilityStatus;
      if (expectedReopenTime !== undefined) user.staffDetails.expectedReopenTime = expectedReopenTime;
      if (statusNote !== undefined) user.staffDetails.statusNote = statusNote;
      if (lunchHours) user.staffDetails.lunchHours = lunchHours;
      if (workingHours) user.staffDetails.workingHours = workingHours;

      await user.save();
    } else {
      user = memoryStore.findUserById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const updatedDetails = {
        ...user.staffDetails,
        availabilityStatus,
        expectedReopenTime: expectedReopenTime !== undefined ? expectedReopenTime : user.staffDetails?.expectedReopenTime,
        statusNote: statusNote !== undefined ? statusNote : user.staffDetails?.statusNote,
      };

      user = memoryStore.updateUser(userId, { staffDetails: updatedDetails });
    }

    // Real-time broadcast
    const io = getSocketIO();
    if (io) {
      io.emit('staff_availability_changed', {
        staffId: userId,
        staffName: user.name,
        availabilityStatus,
        expectedReopenTime,
        statusNote,
      });
    }

    await logAuditEvent({
      action: 'STAFF_AVAILABILITY_UPDATED',
      module: 'COUNTER',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetResource: `Staff ${user.name}`,
      details: { availabilityStatus, expectedReopenTime },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Availability updated successfully.',
      staffDetails: user.staffDetails,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Appointment Management
export const bookAppointment = async (req, res) => {
  try {
    const { teacherId, departmentId, date, timeSlot, purpose, notes } = req.body;
    const student = req.user;

    if (!teacherId || !date || !timeSlot || !purpose) {
      return res.status(400).json({ success: false, message: 'Teacher, Date, Time Slot, and Purpose are required.' });
    }

    // Check teacher details
    let teacher = null;
    if (isMongoConnected()) {
      teacher = await User.findById(teacherId);
    } else {
      teacher = memoryStore.findUserById(teacherId);
    }

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Staff/Teacher not found.' });
    }

    const aptNum = `APT-${Date.now().toString().slice(-6)}`;

    const aptData = {
      appointmentNumber: aptNum,
      teacher: teacherId,
      student: student._id,
      department: departmentId || teacher.staffDetails?.department,
      date,
      timeSlot,
      purpose,
      notes: notes || '',
      officeLocation: teacher.staffDetails?.officeLocation || 'Main Campus',
      status: 'confirmed',
    };

    let newApt = null;
    if (isMongoConnected()) {
      newApt = await Appointment.create(aptData);
    } else {
      newApt = memoryStore.createAppointment(aptData);
    }

    // Notify teacher
    await sendNotification({
      recipient: teacher._id,
      title: 'New Student Appointment Booked',
      message: `${student.name} (${student.studentDetails?.rollNumber || 'Student'}) booked an appointment on ${date} at ${timeSlot}. Purpose: ${purpose}`,
      type: 'appointment_confirmed',
      link: '/staff/appointments',
    });

    // Notify student
    await sendNotification({
      recipient: student._id,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${teacher.name} is confirmed for ${date} at ${timeSlot}.`,
      type: 'appointment_confirmed',
      link: '/student/appointments',
    });

    // Real-time broadcast to Teacher & Adm. Cell / Admin Console
    const io = getSocketIO();
    if (io) {
      io.to(`user:${teacher._id.toString()}`).emit('new_appointment', newApt);
      io.to('admin_channel').emit('new_appointment', newApt);
      io.emit('appointment_created_alert', {
        appointmentNumber: aptNum,
        studentName: student.name,
        teacherName: teacher.name,
        department: teacher.staffDetails?.departmentName,
      });
    }

    await logAuditEvent({
      action: 'APPOINTMENT_BOOKED',
      module: 'APPOINTMENT',
      performedBy: student._id,
      performedByName: student.name,
      performedByRole: 'student',
      targetResource: `Appointment ${aptNum}`,
      details: { teacher: teacher.name, date, timeSlot },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: newApt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAppointments = async (req, res) => {
  try {
    const studentId = req.user._id;
    let appointments = [];

    if (isMongoConnected()) {
      appointments = await Appointment.find({ student: studentId })
        .populate('teacher', 'name email avatar staffDetails')
        .populate('department', 'name code')
        .sort({ date: -1, createdAt: -1 });
    } else {
      appointments = memoryStore.getAppointments({ student: studentId }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffAppointments = async (req, res) => {
  try {
    const user = req.user;
    let appointments = [];

    if (isMongoConnected()) {
      const query = user.role === 'admin'
        ? {}
        : {
            $or: [
              { teacher: user._id },
              ...(user.staffDetails?.department ? [{ department: user.staffDetails.department }] : [])
            ]
          };
      appointments = await Appointment.find(query)
        .populate('student', 'name email phone avatar studentDetails')
        .populate('teacher', 'name email avatar staffDetails')
        .populate('department', 'name code')
        .sort({ date: 1, createdAt: -1 });
    } else {
      const filters = user.role === 'admin' ? {} : { teacher: user._id };
      appointments = memoryStore.getAppointments(filters).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusReason } = req.body; // 'completed', 'cancelled', 'rescheduled'
    const user = req.user;

    let apt = null;
    if (isMongoConnected()) {
      apt = await Appointment.findById(id).populate('student teacher');
      if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found.' });

      apt.status = status;
      if (statusReason) apt.statusReason = statusReason;
      if (status === 'completed') apt.completedAt = new Date();
      await apt.save();
    } else {
      apt = memoryStore.getAppointmentById(id);
      if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found.' });

      apt = memoryStore.updateAppointment(id, {
        status,
        statusReason: statusReason || '',
        completedAt: status === 'completed' ? new Date() : undefined,
      });
    }

    // Send notification
    const recipient = user.role === 'student' ? apt.teacher : apt.student;
    await sendNotification({
      recipient: recipient._id || recipient,
      title: `Appointment ${status.toUpperCase()}`,
      message: `Appointment ${apt.appointmentNumber} has been marked as ${status}. ${statusReason ? `Reason: ${statusReason}` : ''}`,
      type: `appointment_${status}`,
      link: user.role === 'student' ? '/staff/appointments' : '/student/appointments',
    });

    res.json({ success: true, message: `Appointment marked as ${status}.`, appointment: apt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

