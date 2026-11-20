import { isMongoConnected } from '../config/db.js';
import Token from '../models/Token.js';
import Counter from '../models/Counter.js';
import Department from '../models/Department.js';
import { memoryStore } from '../config/memoryStore.js';
import { generateQRCodeDataURL } from '../services/qrService.js';
import { sendNotification, getSocketIO } from '../services/notificationService.js';
import { logAuditEvent } from '../middleware/auditLogger.js';

// Helper to generate formatted token number like "CAD-045", "ACC-108"
const generateTokenNumber = (deptCode, count) => {
  const code = (deptCode || 'QE').substring(0, 3).toUpperCase();
  const num = String(count + 1).padStart(3, '0');
  return `${code}-${num}`;
};

// Calculate queue position & estimated wait
const calculateQueueMetrics = (waitingTokens, targetTokenId, avgMinsPerToken = 10) => {
  const index = waitingTokens.findIndex((t) => t._id.toString() === targetTokenId.toString());
  if (index === -1) return { queuePosition: 0, estimatedWaitMinutes: 0 };
  const position = index + 1;
  const estimatedWaitMinutes = position * avgMinsPerToken;
  return { queuePosition: position, estimatedWaitMinutes };
};

export const getStudentActiveTokens = async (req, res) => {
  try {
    const studentId = req.user._id;
    let tokens = [];

    if (isMongoConnected()) {
      tokens = await Token.find({
        student: studentId,
        status: { $in: ['waiting', 'called', 'serving', 'rejoin_requested'] },
      })
        .populate('counter', 'counterNumber name status operatingHours avgServiceTimeMinutes')
        .populate('department', 'name code building floor')
        .sort({ createdAt: -1 });
    } else {
      tokens = memoryStore.getTokens({
        student: studentId,
        status: ['waiting', 'called', 'serving', 'rejoin_requested'],
      });
    }

    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentTokenHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    let tokens = [];

    if (isMongoConnected()) {
      tokens = await Token.find({ student: studentId })
        .populate('counter', 'counterNumber name status')
        .populate('department', 'name code')
        .sort({ createdAt: -1 });
    } else {
      tokens = memoryStore.getTokens({ student: studentId }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bookToken = async (req, res) => {
  try {
    const {
      departmentId,
      counterId,
      serviceType,
      bookedDate,
      timeSlot,
      remarks,
      studentName,
      uid,
      studentClass,
      semester,
      totalFees,
      feeCategory,
      paymentMode,
      officeType,
    } = req.body;
    const student = req.user;

    if (!departmentId || !counterId || !serviceType) {
      return res.status(400).json({ success: false, message: 'Department, Counter, and Service Type are required.' });
    }

    const todayDate = bookedDate || new Date().toISOString().split('T')[0];

    // Check if student already has an active waiting or called token for this counter
    let existingToken = null;
    if (isMongoConnected()) {
      existingToken = await Token.findOne({
        student: student._id,
        counter: counterId,
        bookedDate: todayDate,
        status: { $in: ['waiting', 'called', 'serving'] },
      });
    } else {
      existingToken = memoryStore.getTokens({
        student: student._id,
        counter: counterId,
        bookedDate: todayDate,
        status: ['waiting', 'called', 'serving'],
      })[0];
    }

    if (existingToken) {
      return res.status(400).json({
        success: false,
        message: `You already hold an active token (${existingToken.tokenNumber}) at this counter for today.`,
      });
    }

    // Retrieve counter & department
    let counter = null;
    let department = null;
    if (isMongoConnected()) {
      counter = await Counter.findById(counterId);
      department = await Department.findById(departmentId);
    } else {
      counter = memoryStore.getCounterById(counterId);
      department = memoryStore.getDepartmentById(departmentId);
    }

    if (!counter) {
      return res.status(404).json({ success: false, message: 'Specified counter not found.' });
    }

    // Check total tokens count for today to sequence token number
    let todayCount = 0;
    let waitingList = [];
    if (isMongoConnected()) {
      todayCount = await Token.countDocuments({ counter: counterId, bookedDate: todayDate });
      waitingList = await Token.find({ counter: counterId, bookedDate: todayDate, status: 'waiting' }).sort({ createdAt: 1 });
    } else {
      const allToday = memoryStore.getTokens({ counter: counterId, bookedDate: todayDate });
      todayCount = allToday.length;
      waitingList = allToday.filter((t) => t.status === 'waiting');
    }

    const tokenNumber = generateTokenNumber(department?.code, todayCount);
    const queuePosition = waitingList.length + 1;
    const estimatedWaitMinutes = queuePosition * (counter.avgServiceTimeMinutes || 10);

    const qrData = `QE-TOKEN:${tokenNumber}:STUDENT:${student.studentDetails?.rollNumber || student.email}:COUNTER:${counter.counterNumber}:DATE:${todayDate}`;
    const qrCodeUrl = await generateQRCodeDataURL(qrData);

    const inferredOfficeType = officeType || (department?.code === 'ADM' || department?.code === 'ACC' ? 'admission' : department?.code === 'CAD' ? 'cad' : 'general');

    const tokenData = {
      tokenNumber,
      department: departmentId,
      counter: counterId,
      student: student._id,
      serviceType,
      bookedDate: todayDate,
      timeSlot: timeSlot || 'Current Session',
      queuePosition,
      estimatedWaitMinutes,
      qrCodeData: qrData,
      qrCodeUrl,
      remarks: remarks || '',
      status: 'waiting',
      studentName: studentName || student.name || 'Student',
      uid: uid || student.studentDetails?.rollNumber || 'CS2023089',
      studentClass: studentClass || student.studentDetails?.course || 'B.Tech CSE',
      semester: semester || (student.studentDetails?.semester ? `Semester ${student.studentDetails?.semester}` : 'Semester 4'),
      totalFees: Number(totalFees) || 0,
      feeCategory: feeCategory || (inferredOfficeType === 'admission' ? serviceType : ''),
      paymentMode: paymentMode || 'counter',
      officeType: inferredOfficeType,
      timeline: [
        {
          action: 'Token Booked',
          performedBy: student._id,
          performedByName: student.name,
          timestamp: new Date(),
          notes: `Booked for ${serviceType} (${inferredOfficeType === 'admission' ? 'Admission Office' : 'CAD Office'})`,
        },
      ],
    };

    let newToken = null;
    if (isMongoConnected()) {
      newToken = await Token.create(tokenData);
    } else {
      newToken = memoryStore.createToken(tokenData);
    }

    // Send in-app & socket notification
    await sendNotification({
      recipient: student._id,
      title: 'Token Booked Successfully',
      message: `Your token ${tokenNumber} is confirmed for ${counter.name}. Queue Position: #${queuePosition}.`,
      type: 'token_booked',
      link: '/student/queue',
      metadata: { tokenNumber, counterNumber: counter.counterNumber },
    });

    // Notify staff & public board via socket
    const io = getSocketIO();
    if (io) {
      io.to(`counter:${counterId}`).emit('queue_updated', {
        action: 'TOKEN_BOOKED',
        tokenNumber,
        queuePosition,
      });
      io.to('admin_channel').emit('queue_activity', {
        action: 'TOKEN_BOOKED',
        counter: counter.counterNumber,
        tokenNumber,
      });
    }

    await logAuditEvent({
      action: 'TOKEN_BOOKED',
      module: 'QUEUE',
      performedBy: student._id,
      performedByName: student.name,
      performedByRole: 'student',
      targetResource: `Token ${tokenNumber}`,
      targetId: newToken._id.toString(),
      details: { tokenNumber, counterId, serviceType },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Token ${tokenNumber} booked successfully!`,
      token: newToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    let token = null;
    if (isMongoConnected()) {
      token = await Token.findById(id);
    } else {
      token = memoryStore.getTokenById(id);
    }

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    // Permission check: student who owns it, or staff/admin
    if (user.role === 'student' && token.student.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this token.' });
    }

    if (['completed', 'cancelled'].includes(token.status)) {
      return res.status(400).json({ success: false, message: `Token is already ${token.status}.` });
    }

    const updates = {
      status: 'cancelled',
      cancellationReason: reason || 'Cancelled by user',
    };

    let updatedToken = null;
    if (isMongoConnected()) {
      token.status = 'cancelled';
      token.cancellationReason = reason || 'Cancelled by user';
      token.timeline.push({
        action: 'Token Cancelled',
        performedBy: user._id,
        performedByName: user.name,
        timestamp: new Date(),
        notes: reason || 'Cancelled by user',
      });
      updatedToken = await token.save();
    } else {
      token.timeline.push({
        action: 'Token Cancelled',
        performedByName: user.name,
        timestamp: new Date(),
        notes: reason || 'Cancelled by user',
      });
      updatedToken = memoryStore.updateToken(id, { ...updates, timeline: token.timeline });
    }

    // Notify student
    await sendNotification({
      recipient: token.student,
      title: 'Token Cancelled',
      message: `Your token ${token.tokenNumber} has been cancelled.`,
      type: 'token_cancelled',
      link: '/student/queue',
    });

    // Notify connected counter
    const io = getSocketIO();
    if (io) {
      io.to(`counter:${token.counter}`).emit('queue_updated', {
        action: 'TOKEN_CANCELLED',
        tokenNumber: token.tokenNumber,
      });
    }

    await logAuditEvent({
      action: 'TOKEN_CANCELLED',
      module: 'QUEUE',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetResource: `Token ${token.tokenNumber}`,
      details: { tokenNumber: token.tokenNumber, reason },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Token cancelled successfully.', token: updatedToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rescheduleToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTimeSlot } = req.body;
    const user = req.user;

    let token = null;
    if (isMongoConnected()) {
      token = await Token.findById(id);
    } else {
      token = memoryStore.getTokenById(id);
    }

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    if (user.role === 'student' && token.student.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this token.' });
    }

    const updates = {
      bookedDate: newDate || new Date().toISOString().split('T')[0],
      timeSlot: newTimeSlot || token.timeSlot,
      status: 'waiting',
    };

    let updated = null;
    if (isMongoConnected()) {
      token.bookedDate = updates.bookedDate;
      token.timeSlot = updates.timeSlot;
      token.status = 'waiting';
      token.timeline.push({
        action: 'Token Rescheduled',
        performedBy: user._id,
        performedByName: user.name,
        timestamp: new Date(),
        notes: `Rescheduled to ${updates.bookedDate} (${updates.timeSlot})`,
      });
      updated = await token.save();
    } else {
      token.timeline.push({
        action: 'Token Rescheduled',
        performedByName: user.name,
        timestamp: new Date(),
        notes: `Rescheduled to ${updates.bookedDate} (${updates.timeSlot})`,
      });
      updated = memoryStore.updateToken(id, { ...updates, timeline: token.timeline });
    }

    await sendNotification({
      recipient: token.student,
      title: 'Token Rescheduled',
      message: `Token ${token.tokenNumber} rescheduled to ${updates.bookedDate} (${updates.timeSlot}).`,
      type: 'token_rescheduled',
      link: '/student/queue',
    });

    res.json({ success: true, message: 'Token rescheduled successfully.', token: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestRejoinQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let token = null;
    if (isMongoConnected()) {
      token = await Token.findById(id);
    } else {
      token = memoryStore.getTokenById(id);
    }

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    if (!['skipped', 'no_show'].includes(token.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only skipped or no-show tokens can request to rejoin the queue.',
      });
    }

    const updates = {
      status: 'waiting',
      priority: 'rejoined',
    };

    let updated = null;
    if (isMongoConnected()) {
      token.status = 'waiting';
      token.priority = 'rejoined';
      token.timeline.push({
        action: 'Queue Rejoined',
        performedBy: user._id,
        performedByName: user.name,
        timestamp: new Date(),
        notes: 'Missed turn student re-entered active queue',
      });
      updated = await token.save();
    } else {
      token.timeline.push({
        action: 'Queue Rejoined',
        performedByName: user.name,
        timestamp: new Date(),
        notes: 'Missed turn student re-entered active queue',
      });
      updated = memoryStore.updateToken(id, { ...updates, timeline: token.timeline });
    }

    await sendNotification({
      recipient: token.student,
      title: 'Rejoined Queue',
      message: `Your token ${token.tokenNumber} has been re-added to the waiting queue with priority.`,
      type: 'queue_updated',
      link: '/student/queue',
    });

    const io = getSocketIO();
    if (io) {
      io.to(`counter:${token.counter}`).emit('queue_updated', {
        action: 'TOKEN_REJOINED',
        tokenNumber: token.tokenNumber,
      });
    }

    res.json({ success: true, message: 'Successfully rejoined the active queue.', token: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff / Counter Queue Operations
export const getCounterActiveQueue = async (req, res) => {
  try {
    const { counterId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    let tokens = [];
    let counter = null;

    if (isMongoConnected()) {
      tokens = await Token.find({
        counter: counterId,
        bookedDate: today,
        status: { $in: ['waiting', 'called', 'serving', 'rejoin_requested'] },
      })
        .populate('student', 'name email phone studentDetails avatar')
        .sort({ priority: -1, createdAt: 1 });
      counter = await Counter.findById(counterId);
    } else {
      tokens = memoryStore.getTokens({
        counter: counterId,
        bookedDate: today,
        status: ['waiting', 'called', 'serving', 'rejoin_requested'],
      }).sort((a, b) => {
        if (a.priority === 'rejoined' && b.priority !== 'rejoined') return -1;
        if (b.priority === 'rejoined' && a.priority !== 'rejoined') return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      counter = memoryStore.getCounterById(counterId);
    }

    res.json({
      success: true,
      counter,
      tokens,
      waitingCount: tokens.filter((t) => t.status === 'waiting').length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const callNextToken = async (req, res) => {
  try {
    const { counterId } = req.params;
    const staff = req.user;
    const today = new Date().toISOString().split('T')[0];

    let nextToken = null;
    let counter = null;

    if (isMongoConnected()) {
      counter = await Counter.findById(counterId);
      nextToken = await Token.findOne({
        counter: counterId,
        bookedDate: today,
        status: 'waiting',
      }).sort({ priority: -1, createdAt: 1 });
    } else {
      counter = memoryStore.getCounterById(counterId);
      const waiting = memoryStore.getTokens({
        counter: counterId,
        bookedDate: today,
        status: 'waiting',
      }).sort((a, b) => {
        if (a.priority === 'rejoined' && b.priority !== 'rejoined') return -1;
        if (b.priority === 'rejoined' && a.priority !== 'rejoined') return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      nextToken = waiting[0];
    }

    if (!nextToken) {
      return res.status(404).json({
        success: false,
        message: 'No waiting tokens in the queue for this counter.',
      });
    }

    // Update token status to 'called'
    const now = new Date();
    if (isMongoConnected()) {
      nextToken.status = 'called';
      nextToken.calledAt = now;
      nextToken.timeline.push({
        action: 'Called to Counter',
        performedBy: staff._id,
        performedByName: staff.name,
        timestamp: now,
        notes: `Called at ${counter?.name || 'Counter'}`,
      });
      await nextToken.save();

      // Update counter current calling token
      if (counter) {
        counter.currentCallingToken = nextToken._id;
        counter.currentCallingTokenNumber = nextToken.tokenNumber;
        await counter.save();
      }
    } else {
      nextToken.timeline.push({
        action: 'Called to Counter',
        performedByName: staff.name,
        timestamp: now,
        notes: `Called at ${counter?.name || 'Counter'}`,
      });
      memoryStore.updateToken(nextToken._id, {
        status: 'called',
        calledAt: now,
        timeline: nextToken.timeline,
      });

      if (counter) {
        memoryStore.updateCounter(counterId, {
          currentCallingToken: nextToken._id,
          currentCallingTokenNumber: nextToken.tokenNumber,
        });
      }
    }

    // Send push notification to the called student
    await sendNotification({
      recipient: nextToken.student,
      title: '🚨 YOUR TURN! Please Proceed to Counter',
      message: `Token ${nextToken.tokenNumber}: Please report immediately to ${counter?.name || 'Counter'}.`,
      type: 'token_called',
      link: '/student/queue',
      metadata: { tokenNumber: nextToken.tokenNumber, counterId },
    });

    // Notify next in line (Turn approaching)
    let secondInLine = null;
    if (isMongoConnected()) {
      secondInLine = await Token.findOne({
        counter: counterId,
        bookedDate: today,
        status: 'waiting',
        _id: { $ne: nextToken._id },
      }).sort({ priority: -1, createdAt: 1 });
    } else {
      const remaining = memoryStore.getTokens({
        counter: counterId,
        bookedDate: today,
        status: 'waiting',
      }).filter((t) => t._id.toString() !== nextToken._id.toString());
      secondInLine = remaining[0];
    }

    if (secondInLine) {
      await sendNotification({
        recipient: secondInLine.student,
        title: 'Turn Approaching (Queue #1)',
        message: `Your token ${secondInLine.tokenNumber} is next! Please be nearby ${counter?.name}.`,
        type: 'turn_approaching',
        link: '/student/queue',
      });
    }

    // Broadcast through socket
    const io = getSocketIO();
    if (io) {
      io.emit('token_called_broadcast', {
        tokenNumber: nextToken.tokenNumber,
        counterNumber: counter?.counterNumber,
        counterName: counter?.name,
      });
      io.to(`counter:${counterId}`).emit('queue_updated', {
        action: 'TOKEN_CALLED',
        tokenNumber: nextToken.tokenNumber,
      });
    }

    await logAuditEvent({
      action: 'TOKEN_CALLED',
      module: 'QUEUE',
      performedBy: staff._id,
      performedByName: staff.name,
      performedByRole: staff.role,
      targetResource: `Token ${nextToken.tokenNumber}`,
      details: { counterNumber: counter?.counterNumber, tokenNumber: nextToken.tokenNumber },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Calling Token ${nextToken.tokenNumber}`,
      token: nextToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTokenStatusByStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // 'serving', 'completed', 'skipped', 'no_show'
    const staff = req.user;

    if (!['serving', 'completed', 'skipped', 'no_show'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid token status specified.' });
    }

    let token = null;
    if (isMongoConnected()) {
      token = await Token.findById(id).populate('counter');
    } else {
      token = memoryStore.getTokenById(id);
    }

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const now = new Date();
    const timelineEntry = {
      action: `Status: ${status.toUpperCase()}`,
      performedBy: staff._id,
      performedByName: staff.name,
      timestamp: now,
      notes: remarks || '',
    };

    const updates = {
      status,
      verifiedByStaff: staff._id,
    };

    if (status === 'serving') updates.servedAt = now;
    if (status === 'completed') updates.completedAt = now;

    let updated = null;
    if (isMongoConnected()) {
      token.status = status;
      token.verifiedByStaff = staff._id;
      if (status === 'serving') token.servedAt = now;
      if (status === 'completed') token.completedAt = now;
      if (remarks) token.remarks = remarks;
      token.timeline.push(timelineEntry);
      updated = await token.save();

      // If completed, increment counter daily served count
      if (status === 'completed' && token.counter) {
        await Counter.findByIdAndUpdate(token.counter._id || token.counter, {
          $inc: { dailyServedCount: 1 },
          $set: { currentCallingTokenNumber: null },
        });
      }
    } else {
      token.timeline.push(timelineEntry);
      updated = memoryStore.updateToken(id, {
        ...updates,
        remarks: remarks || token.remarks,
        timeline: token.timeline,
      });

      if (status === 'completed') {
        const c = memoryStore.getCounterById(token.counter);
        if (c) {
          memoryStore.updateCounter(token.counter, {
            dailyServedCount: (c.dailyServedCount || 0) + 1,
            currentCallingTokenNumber: null,
          });
        }
      }
    }

    // Send student appropriate notification
    if (status === 'completed') {
      await sendNotification({
        recipient: token.student,
        title: 'Service Completed',
        message: `Your visit for Token ${token.tokenNumber} is marked completed. Thank you!`,
        type: 'queue_updated',
        link: '/student/feedback',
      });
    } else if (status === 'skipped') {
      await sendNotification({
        recipient: token.student,
        title: 'Turn Skipped (Absent at Counter)',
        message: `Token ${token.tokenNumber} was skipped because you were not at the counter. You can request to rejoin via your dashboard.`,
        type: 'token_skipped',
        link: '/student/queue',
      });
    } else if (status === 'no_show') {
      await sendNotification({
        recipient: token.student,
        title: 'Token Marked No-Show',
        message: `Token ${token.tokenNumber} marked as no-show due to expiration of grace period.`,
        type: 'queue_updated',
        link: '/student/queue',
      });
    }

    const io = getSocketIO();
    if (io) {
      io.to(`counter:${token.counter?._id || token.counter}`).emit('queue_updated', {
        action: `TOKEN_${status.toUpperCase()}`,
        tokenNumber: token.tokenNumber,
      });
    }

    await logAuditEvent({
      action: `TOKEN_${status.toUpperCase()}`,
      module: 'QUEUE',
      performedBy: staff._id,
      performedByName: staff.name,
      performedByRole: staff.role,
      targetResource: `Token ${token.tokenNumber}`,
      details: { tokenNumber: token.tokenNumber, status, remarks },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Token marked as ${status}.`,
      token: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// QR Code Verification at counter by staff camera scanner
export const verifyTokenQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    const staff = req.user;

    if (!qrData) {
      return res.status(400).json({ success: false, message: 'QR data string is required.' });
    }

    // Parse token number from string (e.g. QE-TOKEN:CAD-042:...)
    const match = qrData.match(/QE-TOKEN:([A-Z0-9-]+)/i);
    const tokenNumber = match ? match[1] : null;

    if (!tokenNumber) {
      return res.status(400).json({ success: false, message: 'Invalid QueueEase QR code format.' });
    }

    let token = null;
    if (isMongoConnected()) {
      token = await Token.findOne({ tokenNumber })
        .populate('student', 'name email phone studentDetails avatar')
        .populate('counter', 'counterNumber name')
        .populate('department', 'name code');
    } else {
      token = memoryStore.getTokenById(tokenNumber);
    }

    if (!token) {
      return res.status(404).json({ success: false, message: `Token ${tokenNumber} not found.` });
    }

    await logAuditEvent({
      action: 'QR_VERIFICATION_SUCCESS',
      module: 'QUEUE',
      performedBy: staff._id,
      performedByName: staff.name,
      performedByRole: staff.role,
      targetResource: `Token ${tokenNumber}`,
      details: { tokenNumber, verifiedStudent: token.student?.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `QR Verified: Valid token for ${token.student?.name || 'Student'}.`,
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

