import { isMongoConnected } from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';
import Token from '../models/Token.js';
import Appointment from '../models/Appointment.js';
import DocumentApplication from '../models/DocumentApplication.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import { memoryStore } from '../config/memoryStore.js';
import { logAuditEvent } from '../middleware/auditLogger.js';
import bcrypt from 'bcryptjs';

export const getAdminDashboardMetrics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    let totalStudents = 0;
    let totalStaff = 0;
    let totalDepartments = 0;
    let activeCounters = 0;
    let todayTokens = 0;
    let pendingCadApps = 0;
    let totalFeeCollected = 0;
    let activeAppointments = 0;
    let completedRequestsToday = 0;
    let recentTokens = [];
    let recentAuditLogs = [];

    if (isMongoConnected()) {
      totalStudents = await User.countDocuments({ role: 'student' });
      totalStaff = await User.countDocuments({ role: 'staff' });
      totalDepartments = await Department.countDocuments({ isActive: true });
      activeCounters = await Counter.countDocuments({ status: 'open', isActive: true });
      todayTokens = await Token.countDocuments({ bookedDate: today });
      pendingCadApps = await DocumentApplication.countDocuments({ status: { $in: ['Submitted', 'Under Review', 'Pending Documents'] } });
      const successfulPayments = await Payment.find({ status: 'success' });
      totalFeeCollected = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);
      activeAppointments = await Appointment.countDocuments({ status: 'confirmed' });
      completedRequestsToday = await Token.countDocuments({ bookedDate: today, status: 'completed' });
      recentTokens = await Token.find().populate('counter department student').sort({ createdAt: -1 }).limit(6);
      recentAuditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(8);
    } else {
      totalStudents = memoryStore.users.filter((u) => u.role === 'student').length;
      totalStaff = memoryStore.users.filter((u) => u.role === 'staff').length;
      totalDepartments = memoryStore.departments.filter((d) => d.isActive).length;
      activeCounters = memoryStore.counters.filter((c) => c.status === 'open' && c.isActive).length;
      todayTokens = memoryStore.tokens.filter((t) => t.bookedDate === today).length;
      pendingCadApps = memoryStore.cadApplications.filter((c) => ['Submitted', 'Under Review', 'Pending Documents'].includes(c.status)).length;
      totalFeeCollected = memoryStore.payments.filter((p) => p.status === 'success').reduce((acc, curr) => acc + curr.amount, 0);
      activeAppointments = memoryStore.appointments.filter((a) => a.status === 'confirmed').length;
      completedRequestsToday = memoryStore.tokens.filter((t) => t.bookedDate === today && t.status === 'completed').length;
      recentTokens = memoryStore.getTokens().slice(0, 6);
      recentAuditLogs = memoryStore.getAuditLogs(8);
    }

    // Peak Queue Hours breakdown
    const peakHoursData = [
      { time: '09:00 AM', tokens: 18, waitTime: 6 },
      { time: '10:00 AM', tokens: 34, waitTime: 12 },
      { time: '11:00 AM', tokens: 48, waitTime: 18 },
      { time: '12:00 PM', tokens: 39, waitTime: 15 },
      { time: '01:00 PM', tokens: 12, waitTime: 5 },
      { time: '02:00 PM', tokens: 42, waitTime: 14 },
      { time: '03:00 PM', tokens: 30, waitTime: 10 },
      { time: '04:00 PM', tokens: 15, waitTime: 5 },
    ];

    // Department-wise usage
    const departmentUsageData = [
      { name: 'CAD Admin', tokens: 42, color: '#0F172A' },
      { name: 'Accounts & Fee', tokens: 38, color: '#0D9488' },
      { name: 'Exam Cell', tokens: 24, color: '#3B82F6' },
      { name: 'CSE Dept', tokens: 18, color: '#8B5CF6' },
      { name: 'Library', tokens: 15, color: '#F59E0B' },
    ];

    // Staff availability status count
    const staffStats = {
      available: 4,
      busy: 1,
      lunch_break: 1,
      temporarily_unavailable: 1,
      on_leave: 0,
    };

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalStaff,
        totalDepartments,
        activeCounters,
        todayTokens,
        pendingCadApps,
        totalFeeCollected,
        activeAppointments,
        completedRequestsToday,
      },
      charts: {
        peakHoursData,
        departmentUsageData,
        staffStats,
      },
      recentTokens,
      recentAuditLogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User Management (CRUD)
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let users = [];

    if (isMongoConnected()) {
      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'studentDetails.rollNumber': { $regex: search, $options: 'i' } },
        ];
      }
      users = await User.find(query).select('-password').sort({ createdAt: -1 });
    } else {
      users = memoryStore.users.map((u) => {
        const { password, ...safe } = u;
        return safe;
      });
      if (role) users = users.filter((u) => u.role === role);
      if (status) users = users.filter((u) => u.status === status);
      if (search) {
        users = users.filter(
          (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.studentDetails?.rollNumber?.toLowerCase().includes(search.toLowerCase())
        );
      }
      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, studentDetails, staffDetails } = req.body;
    const admin = req.user;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone: phone || '',
      status: 'active',
      studentDetails: studentDetails || {},
      staffDetails: staffDetails || {},
    };

    let newUser = null;
    if (isMongoConnected()) {
      newUser = await User.create(userData);
    } else {
      newUser = memoryStore.createUser(userData);
    }

    await logAuditEvent({
      action: 'ADMIN_CREATED_USER',
      module: 'ADMIN',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      targetResource: `User ${email}`,
      details: { role, email },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'User created successfully.', user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body; // status: active, suspended, inactive
    const admin = req.user;

    let user = null;
    if (isMongoConnected()) {
      user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      if (status) user.status = status;
      if (role) user.role = role;
      await user.save();
    } else {
      user = memoryStore.updateUser(id, { status, role });
    }

    await logAuditEvent({
      action: 'ADMIN_UPDATED_USER',
      module: 'ADMIN',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      targetResource: `User ${id}`,
      details: { status, role },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User updated successfully.', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.user;

    if (id.toString() === admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    if (isMongoConnected()) {
      await User.findByIdAndDelete(id);
    } else {
      memoryStore.deleteUser(id);
    }

    await logAuditEvent({
      action: 'ADMIN_DELETED_USER',
      module: 'ADMIN',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      targetResource: `User ${id}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User account removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Department Management (CRUD)
export const createDepartment = async (req, res) => {
  try {
    const { name, code, category, description, building, floor, email, phone, operatingHours, servicesOffered } = req.body;
    const admin = req.user;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required.' });
    }

    const data = {
      name,
      code: code.toUpperCase(),
      category: category || 'administrative',
      description: description || '',
      building: building || 'Main Campus Block',
      floor: floor || 'Ground Floor',
      email: email || '',
      phone: phone || '',
      operatingHours: operatingHours || { open: '09:00 AM', close: '05:00 PM', lunchStart: '01:00 PM', lunchEnd: '02:00 PM' },
      servicesOffered: servicesOffered || [],
    };

    let dept = null;
    if (isMongoConnected()) {
      dept = await Department.create(data);
    } else {
      dept = memoryStore.createDepartment(data);
    }

    await logAuditEvent({
      action: 'ADMIN_CREATED_DEPARTMENT',
      module: 'ADMIN',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      targetResource: `Department ${code}`,
      details: { name, code },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Department created.', department: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    let dept = null;

    if (isMongoConnected()) {
      dept = await Department.findByIdAndUpdate(id, updates, { new: true });
    } else {
      dept = memoryStore.updateDepartment(id, updates);
    }

    res.json({ success: true, message: 'Department updated.', department: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Counter Management (CRUD)
export const createCounter = async (req, res) => {
  try {
    const { counterNumber, name, department, assignedStaff, servicesHandled, operatingHours, avgServiceTimeMinutes } = req.body;
    const admin = req.user;

    if (!counterNumber || !name || !department) {
      return res.status(400).json({ success: false, message: 'Counter number, name, and department are required.' });
    }

    const data = {
      counterNumber,
      name,
      department,
      assignedStaff: assignedStaff || null,
      servicesHandled: servicesHandled || [],
      operatingHours: operatingHours || { open: '09:00 AM', close: '05:00 PM', lunchStart: '01:00 PM', lunchEnd: '02:00 PM' },
      avgServiceTimeMinutes: avgServiceTimeMinutes || 10,
      status: 'open',
    };

    let counter = null;
    if (isMongoConnected()) {
      counter = await Counter.create(data);
    } else {
      counter = memoryStore.createCounter(data);
    }

    await logAuditEvent({
      action: 'ADMIN_CREATED_COUNTER',
      module: 'ADMIN',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      targetResource: `Counter ${counterNumber}`,
      details: { counterNumber, name },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Counter created successfully.', counter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCounterAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    let counter = null;

    if (isMongoConnected()) {
      counter = await Counter.findByIdAndUpdate(id, updates, { new: true });
    } else {
      counter = memoryStore.updateCounter(id, updates);
    }

    res.json({ success: true, message: 'Counter updated.', counter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Campus-wide Queue Override & Monitoring
export const getCampusWideQueues = async (req, res) => {
  try {
    let tokens = [];
    if (isMongoConnected()) {
      tokens = await Token.find().populate('counter department student').sort({ createdAt: -1 });
    } else {
      tokens = memoryStore.getTokens().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, count: tokens.length, tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminOverrideToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, remarks } = req.body;
    const admin = req.user;

    let token = null;
    if (isMongoConnected()) {
      token = await Token.findById(id);
      if (!token) return res.status(404).json({ success: false, message: 'Token not found.' });

      if (status) token.status = status;
      if (priority) token.priority = priority;
      if (remarks) token.remarks = remarks;
      token.timeline.push({
        action: `ADMIN_OVERRIDE_${status || priority}`,
        performedBy: admin._id,
        performedByName: admin.name,
        timestamp: new Date(),
        notes: `Admin manual override: ${remarks || 'Administrative decision'}`,
      });
      await token.save();
    } else {
      token = memoryStore.getTokenById(id);
      if (!token) return res.status(404).json({ success: false, message: 'Token not found.' });

      token.timeline.push({
        action: `ADMIN_OVERRIDE_${status || priority}`,
        performedByName: admin.name,
        timestamp: new Date(),
        notes: `Admin manual override: ${remarks || 'Administrative decision'}`,
      });
      token = memoryStore.updateToken(id, {
        status: status || token.status,
        priority: priority || token.priority,
        remarks: remarks || token.remarks,
        timeline: token.timeline,
      });
    }

    await logAuditEvent({
      action: 'ADMIN_TOKEN_OVERRIDE',
      module: 'ADMIN',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      targetResource: `Token ${token.tokenNumber}`,
      details: { status, priority, remarks },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Token overridden successfully by Administrator.', token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Audit Logs
export const getAuditLogs = async (req, res) => {
  try {
    const { limit = 100, module } = req.query;
    let logs = [];

    if (isMongoConnected()) {
      const query = {};
      if (module) query.module = module;
      logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(Number(limit));
    } else {
      logs = memoryStore.getAuditLogs(Number(limit));
      if (module) logs = logs.filter((l) => l.module === module);
    }

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Campus-wide & Administrative Cell Appointments
export const getAllCampusAppointments = async (req, res) => {
  try {
    const { status, search, department } = req.query;
    let appointments = [];

    if (isMongoConnected()) {
      const query = {};
      if (status) query.status = status;

      appointments = await Appointment.find(query)
        .populate('student', 'name email phone avatar studentDetails')
        .populate('teacher', 'name email avatar staffDetails role')
        .populate('department', 'name code category building')
        .sort({ date: -1, createdAt: -1 });

      if (department) {
        appointments = appointments.filter((a) => {
          const deptName = (a.department?.name || a.departmentDetails?.name || '').toLowerCase();
          const deptCode = (a.department?.code || a.departmentDetails?.code || '').toLowerCase();
          const teacherDept = (a.teacher?.staffDetails?.departmentName || '').toLowerCase();
          const filter = department.toLowerCase();
          return (
            deptName.includes(filter) ||
            deptCode === filter ||
            teacherDept.includes(filter) ||
            (filter === 'admission' && (deptName.includes('admission') || deptName.includes('fee') || teacherDept.includes('fee') || deptCode === 'adm')) ||
            (filter === 'accounts' && (deptName.includes('fee') || teacherDept.includes('fee') || deptCode === 'adm')) ||
            (filter === 'administrative' && (deptName.includes('cad') || teacherDept.includes('cad') || deptCode === 'cad'))
          );
        });
      }

      if (search) {
        appointments = appointments.filter((a) => {
          return (
            a.appointmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
            a.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
            a.student?.studentDetails?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
            a.teacher?.name?.toLowerCase().includes(search.toLowerCase()) ||
            a.purpose?.toLowerCase().includes(search.toLowerCase())
          );
        });
      }
    } else {
      appointments = memoryStore.getAppointments();
      if (status) appointments = appointments.filter((a) => a.status === status);
      if (department) {
        appointments = appointments.filter((a) =>
          a.departmentDetails?.name?.toLowerCase().includes(department.toLowerCase()) ||
          a.teacherDetails?.staffDetails?.departmentName?.toLowerCase().includes(department.toLowerCase())
        );
      }
      if (search) {
        appointments = appointments.filter((a) =>
          a.appointmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
          a.studentDetails?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.studentDetails?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
          a.teacherDetails?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.purpose?.toLowerCase().includes(search.toLowerCase())
        );
      }
      appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusReason } = req.body;
    const admin = req.user;

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

    await logAuditEvent({
      action: 'ADMIN_APPOINTMENT_UPDATED',
      module: 'APPOINTMENT',
      performedBy: admin._id,
      performedByName: admin.name,
      performedByRole: admin.role,
      targetResource: `Appointment ${apt.appointmentNumber}`,
      details: { status, statusReason },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `Appointment status updated to ${status}.`, appointment: apt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

