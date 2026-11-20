import bcrypt from 'bcryptjs';
import { generateTokens, verifyRefreshToken } from '../config/jwt.js';
import { isMongoConnected } from '../config/db.js';
import User from '../models/User.js';
import { memoryStore } from '../config/memoryStore.js';
import { logAuditEvent } from '../middleware/auditLogger.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', phone, rollNumber, department, course, year, semester } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    let existing = null;
    if (isMongoConnected()) {
      existing = await User.findOne({ email: email.toLowerCase() });
    } else {
      existing = memoryStore.findUserByEmail(email);
    }

    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? 'student' : role, // Prevent self-registering as admin
      phone: phone || '',
      studentDetails: {
        rollNumber: rollNumber || `QE-${Date.now().toString().slice(-6)}`,
        department: department || 'General Engineering',
        course: course || 'B.Tech',
        year: year || 1,
        semester: semester || 1,
      },
    };

    let user = null;
    if (isMongoConnected()) {
      user = await User.create(userData);
    } else {
      user = memoryStore.createUser(userData);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await logAuditEvent({
      action: 'USER_REGISTERED',
      module: 'AUTH',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetResource: 'User',
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentDetails: user.studentDetails,
        staffDetails: user.staffDetails,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    let user = null;
    const cleanEmail = email.toLowerCase().trim();
    const isAdmissionAlias = ['admission.officer@queueease.edu', 'admission@queueease.edu', 'fees.officer@queueease.edu'].includes(cleanEmail);

    if (isMongoConnected()) {
      if (isAdmissionAlias) {
        user = await User.findOne({
          email: { $in: ['fees.officer@queueease.edu', 'admission.officer@queueease.edu', 'admission@queueease.edu'] }
        });
      } else {
        user = await User.findOne({ email: cleanEmail });
      }
    } else {
      user = memoryStore.findUserByEmail(cleanEmail) ||
        (isAdmissionAlias ? memoryStore.findUserByEmail('fees.officer@queueease.edu') : null);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact the administrator.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await logAuditEvent({
      action: 'USER_LOGIN',
      module: 'AUTH',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetResource: 'Session',
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        studentDetails: user.studentDetails,
        staffDetails: user.staffDetails,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide admin email and password.' });
    }

    let user = null;
    const cleanEmail = email.toLowerCase().trim();
    const isAdmissionAlias = ['admission.officer@queueease.edu', 'admission@queueease.edu', 'fees.officer@queueease.edu'].includes(cleanEmail);

    if (isMongoConnected()) {
      if (isAdmissionAlias) {
        user = await User.findOne({
          email: { $in: ['fees.officer@queueease.edu', 'admission.officer@queueease.edu', 'admission@queueease.edu'] }
        });
      } else {
        user = await User.findOne({ email: cleanEmail });
      }
    } else {
      user = memoryStore.findUserByEmail(cleanEmail) ||
        (isAdmissionAlias ? memoryStore.findUserByEmail('fees.officer@queueease.edu') : null);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    if (user.role !== 'admin') {
      await logAuditEvent({
        action: 'UNAUTHORIZED_ADMIN_LOGIN_ATTEMPT',
        module: 'AUTH',
        performedByName: user.name,
        performedByRole: user.role,
        targetResource: 'AdminPortal',
        details: { email: user.email },
        ipAddress: req.ip,
      });

      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only authorized administrators may log in through the Admin Portal.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await logAuditEvent({
      action: 'ADMIN_PORTAL_LOGIN',
      module: 'AUTH',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: 'admin',
      targetResource: 'AdminPortal',
      details: { email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Admin access verified.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        staffDetails: user.staffDetails,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone,
        studentDetails: req.user.studentDetails,
        staffDetails: req.user.staffDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    let user = null;
    if (isMongoConnected()) {
      user = await User.findById(decoded.id);
    } else {
      user = memoryStore.findUserById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const tokens = generateTokens(user);
    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

