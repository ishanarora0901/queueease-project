import { isMongoConnected } from '../config/db.js';
import Feedback from '../models/Feedback.js';
import { memoryStore } from '../config/memoryStore.js';
import { logAuditEvent } from '../middleware/auditLogger.js';

export const submitFeedback = async (req, res) => {
  try {
    const { category, rating, comment, departmentId, counterId, tokenNumber } = req.body;
    const student = req.user;

    if (!category || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Category, rating, and comment are required.' });
    }

    const data = {
      student: student._id,
      department: departmentId || null,
      counter: counterId || null,
      tokenNumber: tokenNumber || '',
      category,
      rating: Number(rating),
      comment,
      status: 'Open',
    };

    let feedback = null;
    if (isMongoConnected()) {
      feedback = await Feedback.create(data);
    } else {
      feedback = memoryStore.createFeedback(data);
    }

    await logAuditEvent({
      action: 'FEEDBACK_SUBMITTED',
      module: 'SYSTEM',
      performedBy: student._id,
      performedByName: student.name,
      performedByRole: 'student',
      targetResource: 'Feedback',
      details: { category, rating },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Feedback submitted. Thank you for helping us improve!', feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeedbacks = async (req, res) => {
  try {
    let list = [];
    if (isMongoConnected()) {
      list = await Feedback.find().populate('student', 'name email studentDetails').sort({ createdAt: -1 });
    } else {
      list = memoryStore.getFeedbacks();
    }

    res.json({ success: true, count: list.length, feedbacks: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

