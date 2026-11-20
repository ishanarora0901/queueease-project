import { isMongoConnected } from '../config/db.js';
import Counter from '../models/Counter.js';
import Department from '../models/Department.js';
import Token from '../models/Token.js';
import { memoryStore } from '../config/memoryStore.js';
import { sendNotification, getSocketIO } from '../services/notificationService.js';
import { logAuditEvent } from '../middleware/auditLogger.js';

export const getAllCounters = async (req, res) => {
  try {
    let counters = [];
    if (isMongoConnected()) {
      counters = await Counter.find({ isActive: true })
        .populate('department', 'name code building floor')
        .populate('assignedStaff', 'name email avatar staffDetails')
        .populate('alternativeCounter', 'counterNumber name status')
        .sort({ counterNumber: 1 });
    } else {
      counters = memoryStore.getCounters().filter((c) => c.isActive);
    }

    res.json({ success: true, counters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCounterById = async (req, res) => {
  try {
    const { id } = req.params;
    let counter = null;
    if (isMongoConnected()) {
      counter = await Counter.findById(id)
        .populate('department', 'name code building floor')
        .populate('assignedStaff', 'name email avatar staffDetails')
        .populate('alternativeCounter', 'counterNumber name status');
    } else {
      counter = memoryStore.getCounterById(id);
    }

    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found.' });
    }

    res.json({ success: true, counter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCounterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusReason, expectedReopenTime, alternativeCounterId } = req.body;
    const staff = req.user;

    const validStatuses = [
      'open',
      'closed',
      'lunch_break',
      'temporarily_unavailable',
      'staff_absent',
      'holiday',
      'maintenance',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid counter status specified.' });
    }

    let counter = null;
    let previousStatus = '';

    if (isMongoConnected()) {
      counter = await Counter.findById(id);
      if (!counter) return res.status(404).json({ success: false, message: 'Counter not found.' });

      previousStatus = counter.status;
      counter.status = status;
      counter.statusReason = statusReason || '';
      counter.expectedReopenTime = expectedReopenTime || '';
      if (alternativeCounterId) counter.alternativeCounter = alternativeCounterId;
      await counter.save();
    } else {
      counter = memoryStore.getCounterById(id);
      if (!counter) return res.status(404).json({ success: false, message: 'Counter not found.' });

      previousStatus = counter.status;
      counter = memoryStore.updateCounter(id, {
        status,
        statusReason: statusReason || '',
        expectedReopenTime: expectedReopenTime || '',
        alternativeCounter: alternativeCounterId || counter.alternativeCounter,
      });
    }

    // If counter changed from open to unavailable/lunch_break, notify waiting students
    if (status !== 'open' && previousStatus === 'open') {
      const today = new Date().toISOString().split('T')[0];
      let affectedTokens = [];

      if (isMongoConnected()) {
        affectedTokens = await Token.find({
          counter: id,
          bookedDate: today,
          status: 'waiting',
        });
      } else {
        affectedTokens = memoryStore.getTokens({
          counter: id,
          bookedDate: today,
          status: 'waiting',
        });
      }

      for (const t of affectedTokens) {
        await sendNotification({
          recipient: t.student,
          title: `⚠️ Counter Update: ${counter.name}`,
          message: `The counter has been marked as ${status.replace('_', ' ').toUpperCase()}.${
            expectedReopenTime ? ` Expected reopening: ${expectedReopenTime}.` : ''
          } You may wait or reschedule via your dashboard.`,
          type: 'counter_closed',
          link: '/student/queue',
          metadata: { counterId: id, status, expectedReopenTime },
        });
      }
    } else if (status === 'open' && previousStatus !== 'open') {
      // Reopened alert
      const today = new Date().toISOString().split('T')[0];
      let affectedTokens = [];

      if (isMongoConnected()) {
        affectedTokens = await Token.find({
          counter: id,
          bookedDate: today,
          status: 'waiting',
        });
      } else {
        affectedTokens = memoryStore.getTokens({
          counter: id,
          bookedDate: today,
          status: 'waiting',
        });
      }

      for (const t of affectedTokens) {
        await sendNotification({
          recipient: t.student,
          title: `🟢 Counter Reopened: ${counter.name}`,
          message: `${counter.name} is now open and actively serving tokens.`,
          type: 'counter_reopened',
          link: '/student/queue',
        });
      }
    }

    // Real-time socket broadcast
    const io = getSocketIO();
    if (io) {
      io.emit('counter_status_changed', {
        counterId: id,
        status,
        statusReason,
        expectedReopenTime,
      });
    }

    await logAuditEvent({
      action: 'COUNTER_STATUS_CHANGED',
      module: 'COUNTER',
      performedBy: staff._id,
      performedByName: staff.name,
      performedByRole: staff.role,
      targetResource: `Counter ${counter.counterNumber}`,
      details: { previousStatus, newStatus: status, reason: statusReason },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Counter status updated to ${status.replace('_', ' ')}.`,
      counter,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

