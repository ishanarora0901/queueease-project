import { getSeedData } from '../utils/seedData.js';

class MemoryStore {
  constructor() {
    this.isInitialized = false;
    this.users = [];
    this.departments = [];
    this.counters = [];
    this.tokens = [];
    this.appointments = [];
    this.cadApplications = [];
    this.payments = [];
    this.notifications = [];
    this.feedbacks = [];
    this.auditLogs = [];
  }

  async init() {
    if (this.isInitialized) return;
    const data = await getSeedData();
    this.users = [...data.users];
    this.departments = [...data.departments];
    this.counters = [...data.counters];
    this.tokens = [...data.tokens];
    this.appointments = [...data.appointments];
    this.cadApplications = [...data.cadApplications];
    this.payments = [...data.payments];
    this.notifications = [...data.notifications];
    this.auditLogs = [...data.auditLogs];
    this.isInitialized = true;
    console.log('[QueueEase Store] In-memory fallback data store initialized with rich demo seeds.');
  }

  // Helper ID generator
  generateId(prefix = '66') {
    return prefix + Math.random().toString(16).substring(2, 10).padStart(8, '0') + Date.now().toString(16).substring(4, 12);
  }

  // Users
  findUserByEmail(email) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find((u) => u._id.toString() === id.toString());
  }

  createUser(userData) {
    const newUser = {
      _id: this.generateId('66e1'),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id, updates) {
    const idx = this.users.findIndex((u) => u._id.toString() === id.toString());
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date() };
    return this.users[idx];
  }

  deleteUser(id) {
    const idx = this.users.findIndex((u) => u._id.toString() === id.toString());
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    return true;
  }

  // Departments
  getDepartments() {
    return this.departments;
  }

  getDepartmentById(id) {
    return this.departments.find((d) => d._id.toString() === id.toString());
  }

  createDepartment(data) {
    const dept = {
      _id: this.generateId('66e2'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.departments.push(dept);
    return dept;
  }

  updateDepartment(id, updates) {
    const idx = this.departments.findIndex((d) => d._id.toString() === id.toString());
    if (idx === -1) return null;
    this.departments[idx] = { ...this.departments[idx], ...updates, updatedAt: new Date() };
    return this.departments[idx];
  }

  deleteDepartment(id) {
    const idx = this.departments.findIndex((d) => d._id.toString() === id.toString());
    if (idx === -1) return false;
    this.departments.splice(idx, 1);
    return true;
  }

  // Counters
  getCounters() {
    return this.counters.map((c) => {
      const dept = this.getDepartmentById(c.department);
      const staff = c.assignedStaff ? this.findUserById(c.assignedStaff) : null;
      return {
        ...c,
        departmentDetails: dept,
        staffDetails: staff ? {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          designation: staff.staffDetails?.designation,
          avatar: staff.avatar,
        } : null,
      };
    });
  }

  getCounterById(id) {
    const counter = this.counters.find((c) => c._id.toString() === id.toString());
    if (!counter) return null;
    const dept = this.getDepartmentById(counter.department);
    const staff = counter.assignedStaff ? this.findUserById(counter.assignedStaff) : null;
    return {
      ...counter,
      departmentDetails: dept,
      staffDetails: staff,
    };
  }

  createCounter(data) {
    const counter = {
      _id: this.generateId('66e3'),
      status: 'open',
      dailyServedCount: 0,
      dailyTokensLimit: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.counters.push(counter);
    return counter;
  }

  updateCounter(id, updates) {
    const idx = this.counters.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) return null;
    this.counters[idx] = { ...this.counters[idx], ...updates, updatedAt: new Date() };
    return this.counters[idx];
  }

  deleteCounter(id) {
    const idx = this.counters.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) return false;
    this.counters.splice(idx, 1);
    return true;
  }

  // Tokens
  getTokens(filters = {}) {
    let list = [...this.tokens];
    if (filters.counter) {
      list = list.filter((t) => t.counter.toString() === filters.counter.toString());
    }
    if (filters.department) {
      list = list.filter((t) => t.department.toString() === filters.department.toString());
    }
    if (filters.student) {
      list = list.filter((t) => t.student.toString() === filters.student.toString());
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        list = list.filter((t) => filters.status.includes(t.status));
      } else {
        list = list.filter((t) => t.status === filters.status);
      }
    }
    if (filters.bookedDate) {
      list = list.filter((t) => t.bookedDate === filters.bookedDate);
    }

    return list.map((t) => {
      const student = this.findUserById(t.student);
      const counter = this.getCounterById(t.counter);
      const dept = this.getDepartmentById(t.department);
      return {
        ...t,
        studentDetails: student ? {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.studentDetails?.rollNumber,
          department: student.studentDetails?.department,
          phone: student.phone,
        } : null,
        counterDetails: counter ? {
          _id: counter._id,
          counterNumber: counter.counterNumber,
          name: counter.name,
          status: counter.status,
        } : null,
        departmentDetails: dept ? {
          _id: dept._id,
          name: dept.name,
          code: dept.code,
        } : null,
      };
    });
  }

  getTokenById(id) {
    const token = this.tokens.find((t) => t._id.toString() === id.toString() || t.tokenNumber === id);
    if (!token) return null;
    const student = this.findUserById(token.student);
    const counter = this.getCounterById(token.counter);
    const dept = this.getDepartmentById(token.department);
    return {
      ...token,
      studentDetails: student,
      counterDetails: counter,
      departmentDetails: dept,
    };
  }

  createToken(tokenData) {
    const token = {
      _id: this.generateId('66e4'),
      status: 'waiting',
      priority: 'normal',
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [{ action: 'Token Booked', timestamp: new Date(), notes: 'Online self-booking' }],
      ...tokenData,
    };
    this.tokens.push(token);
    return token;
  }

  updateToken(id, updates) {
    const idx = this.tokens.findIndex((t) => t._id.toString() === id.toString() || t.tokenNumber === id);
    if (idx === -1) return null;
    this.tokens[idx] = { ...this.tokens[idx], ...updates, updatedAt: new Date() };
    return this.tokens[idx];
  }

  // Appointments
  getAppointments(filters = {}) {
    let list = [...this.appointments];
    if (filters.teacher) {
      list = list.filter((a) => a.teacher.toString() === filters.teacher.toString());
    }
    if (filters.student) {
      list = list.filter((a) => a.student.toString() === filters.student.toString());
    }
    if (filters.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    return list.map((a) => {
      const teacher = this.findUserById(a.teacher);
      const student = this.findUserById(a.student);
      const dept = a.department ? this.getDepartmentById(a.department) : null;
      return {
        ...a,
        teacherDetails: teacher ? {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          designation: teacher.staffDetails?.designation,
          officeLocation: teacher.staffDetails?.officeLocation,
          avatar: teacher.avatar,
        } : null,
        studentDetails: student ? {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.studentDetails?.rollNumber,
          phone: student.phone,
        } : null,
        departmentDetails: dept,
      };
    });
  }

  getAppointmentById(id) {
    return this.appointments.find((a) => a._id.toString() === id.toString());
  }

  createAppointment(data) {
    const apt = {
      _id: this.generateId('66e5'),
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.appointments.push(apt);
    return apt;
  }

  updateAppointment(id, updates) {
    const idx = this.appointments.findIndex((a) => a._id.toString() === id.toString());
    if (idx === -1) return null;
    this.appointments[idx] = { ...this.appointments[idx], ...updates, updatedAt: new Date() };
    return this.appointments[idx];
  }

  // CAD Applications
  getCadApplications(filters = {}) {
    let list = [...this.cadApplications];
    if (filters.student) {
      list = list.filter((c) => c.student.toString() === filters.student.toString());
    }
    if (filters.status) {
      list = list.filter((c) => c.status === filters.status);
    }
    return list.map((c) => {
      const student = this.findUserById(c.student);
      return {
        ...c,
        studentDetails: student ? {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.studentDetails?.rollNumber,
          department: student.studentDetails?.department,
          phone: student.phone,
        } : null,
      };
    });
  }

  getCadApplicationById(id) {
    const app = this.cadApplications.find((c) => c._id.toString() === id.toString() || c.applicationNumber === id);
    if (!app) return null;
    const student = this.findUserById(app.student);
    return {
      ...app,
      studentDetails: student,
    };
  }

  createCadApplication(data) {
    const app = {
      _id: this.generateId('66e6'),
      status: 'Submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [{ status: 'Submitted', timestamp: new Date(), notes: 'Application submitted online' }],
      ...data,
    };
    this.cadApplications.push(app);
    return app;
  }

  updateCadApplication(id, updates) {
    const idx = this.cadApplications.findIndex((c) => c._id.toString() === id.toString() || c.applicationNumber === id);
    if (idx === -1) return null;
    this.cadApplications[idx] = { ...this.cadApplications[idx], ...updates, updatedAt: new Date() };
    return this.cadApplications[idx];
  }

  // Payments
  getPayments(filters = {}) {
    let list = [...this.payments];
    if (filters.student) {
      list = list.filter((p) => p.student.toString() === filters.student.toString());
    }
    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    return list;
  }

  getPaymentById(id) {
    return this.payments.find((p) => p._id.toString() === id.toString() || p.transactionId === id || p.receiptNumber === id);
  }

  createPayment(data) {
    const pmt = {
      _id: this.generateId('66e7'),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.payments.push(pmt);
    return pmt;
  }

  updatePayment(id, updates) {
    const idx = this.payments.findIndex((p) => p._id.toString() === id.toString() || p.transactionId === id);
    if (idx === -1) return null;
    this.payments[idx] = { ...this.payments[idx], ...updates, updatedAt: new Date() };
    return this.payments[idx];
  }

  // Notifications
  getNotifications(userId) {
    return this.notifications.filter((n) => n.recipient.toString() === userId.toString()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createNotification(data) {
    const notif = {
      _id: this.generateId('66e8'),
      isRead: false,
      createdAt: new Date(),
      ...data,
    };
    this.notifications.unshift(notif);
    return notif;
  }

  markNotificationAsRead(id, userId) {
    const notif = this.notifications.find((n) => n._id.toString() === id.toString() && n.recipient.toString() === userId.toString());
    if (notif) {
      notif.isRead = true;
      notif.readAt = new Date();
    }
    return notif;
  }

  markAllNotificationsAsRead(userId) {
    this.notifications.forEach((n) => {
      if (n.recipient.toString() === userId.toString()) {
        n.isRead = true;
        n.readAt = new Date();
      }
    });
    return true;
  }

  // Feedbacks
  getFeedbacks() {
    return this.feedbacks.map((f) => {
      const student = this.findUserById(f.student);
      return {
        ...f,
        studentDetails: student ? { name: student.name, rollNumber: student.studentDetails?.rollNumber } : null,
      };
    });
  }

  createFeedback(data) {
    const fb = {
      _id: this.generateId('66e9'),
      status: 'Open',
      createdAt: new Date(),
      ...data,
    };
    this.feedbacks.unshift(fb);
    return fb;
  }

  // Audit Logs
  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }

  createAuditLog(data) {
    const log = {
      _id: this.generateId('66ea'),
      timestamp: new Date(),
      ...data,
    };
    this.auditLogs.unshift(log);
    return log;
  }
}

export const memoryStore = new MemoryStore();

