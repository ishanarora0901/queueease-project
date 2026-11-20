import bcrypt from 'bcryptjs';
import { isMongoConnected } from '../config/db.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { memoryStore } from '../config/memoryStore.js';
import { generateReceiptPDFBuffer } from '../services/pdfService.js';
import { sendNotification, getSocketIO } from '../services/notificationService.js';
import { logAuditEvent } from '../middleware/auditLogger.js';

// Standard Fee Breakdown Structure for University
const DEFAULT_FEE_STRUCTURE = [
  {
    category: 'Tuition Fee',
    semester: 'Semester 4',
    academicYear: '2025-2026',
    amount: 45000,
    dueDate: '2026-12-15',
    description: 'B.Tech Regular Academic Tuition Fee (Semester 4)',
  },
  {
    category: 'Examination Fee',
    semester: 'Semester 4',
    academicYear: '2025-2026',
    amount: 2500,
    dueDate: '2026-12-01',
    description: 'Semester End Theory & Practical Examination Fee',
  },
  {
    category: 'Library Fee',
    semester: 'Semester 4',
    academicYear: '2025-2026',
    amount: 1200,
    dueDate: '2026-12-15',
    description: 'Digital Library Subscription & Physical Book Bank',
  },
  {
    category: 'Hostel & Mess Fee',
    semester: 'Semester 4',
    academicYear: '2025-2026',
    amount: 32000,
    dueDate: '2026-12-20',
    description: 'Hostel Room Rent & Mess Advance',
  },
  {
    category: 'CAD Document Processing Fee',
    semester: 'Current',
    academicYear: '2025-2026',
    amount: 350,
    dueDate: 'On Demand',
    description: 'Official Transcript & Migration Certificate Processing Fee',
  },
];

export const getStudentFeeStatus = async (req, res) => {
  try {
    const student = req.user;
    let paymentHistory = [];

    if (isMongoConnected()) {
      paymentHistory = await Payment.find({ student: student._id }).sort({ createdAt: -1 });
    } else {
      paymentHistory = memoryStore.getPayments({ student: student._id }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Determine pending fees by checking which categories have successful payments
    const successfulCategories = new Set(
      paymentHistory
        .filter((p) => p.status === 'success')
        .map((p) => `${p.feeCategory}_${p.semester}`)
    );

    const feeBreakdown = DEFAULT_FEE_STRUCTURE.map((item) => {
      const isPaid = successfulCategories.has(`${item.category}_${item.semester}`);
      return {
        ...item,
        status: isPaid ? 'PAID' : 'PENDING',
      };
    });

    const totalDue = feeBreakdown
      .filter((f) => f.status === 'PENDING')
      .reduce((sum, f) => sum + f.amount, 0);

    const totalPaid = paymentHistory
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      totalDue,
      totalPaid,
      feeBreakdown,
      paymentHistory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyStudentFeeAccess = async (req, res) => {
  try {
    const { uid, password } = req.body;

    if (!uid || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both Student UID / Roll Number and Password.',
      });
    }

    const cleanUid = uid.trim().toLowerCase();

    // Find student user in Mongo or Memory Store
    let studentUser = null;
    if (isMongoConnected()) {
      studentUser = await User.findOne({
        $or: [
          { 'studentDetails.rollNumber': { $regex: new RegExp(`^${cleanUid}$`, 'i') } },
          { email: cleanUid },
          { 'studentDetails.idCardNumber': { $regex: new RegExp(`^${cleanUid}$`, 'i') } },
        ],
      });
    } else {
      studentUser = memoryStore.users.find(
        (u) =>
          (u.studentDetails?.rollNumber && u.studentDetails.rollNumber.toLowerCase() === cleanUid) ||
          u.email.toLowerCase() === cleanUid ||
          (u.studentDetails?.idCardNumber && u.studentDetails.idCardNumber.toLowerCase() === cleanUid)
      );
    }

    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: `No student record found with UID "${uid}". Please check your UID / Roll Number.`,
      });
    }

    // Verify Password with bcrypt
    const isMatch = await bcrypt.compare(password, studentUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password for this student UID. Please enter the correct password.',
      });
    }

    // Retrieve payment history for this verified student
    let paymentHistory = [];
    if (isMongoConnected()) {
      paymentHistory = await Payment.find({ student: studentUser._id }).sort({ createdAt: -1 });
    } else {
      paymentHistory = memoryStore
        .getPayments({ student: studentUser._id })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Determine pending fees vs paid fees
    const successfulCategories = new Set(
      paymentHistory
        .filter((p) => p.status === 'success')
        .map((p) => `${p.feeCategory}_${p.semester}`)
    );

    const feeBreakdown = DEFAULT_FEE_STRUCTURE.map((item) => {
      const isPaid = successfulCategories.has(`${item.category}_${item.semester}`);
      return {
        ...item,
        status: isPaid ? 'PAID' : 'PENDING',
      };
    });

    const totalDue = feeBreakdown
      .filter((f) => f.status === 'PENDING')
      .reduce((sum, f) => sum + f.amount, 0);

    const totalPaid = paymentHistory
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);

    const studentInfo = {
      _id: studentUser._id,
      name: studentUser.name,
      email: studentUser.email,
      rollNumber: studentUser.studentDetails?.rollNumber || uid,
      course: studentUser.studentDetails?.course || 'B.Tech Computer Science',
      semester: studentUser.studentDetails?.semester || 4,
      batch: studentUser.studentDetails?.batch || '2023-2027',
      department: studentUser.studentDetails?.department || 'Engineering',
    };

    res.json({
      success: true,
      verified: true,
      student: studentInfo,
      totalDue,
      totalPaid,
      feeBreakdown,
      paymentHistory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const initiatePaymentOrder = async (req, res) => {
  try {
    const { feeCategory, semester, amount, paymentMethod = 'UPI' } = req.body;
    const student = req.user;

    if (!feeCategory || !amount) {
      return res.status(400).json({ success: false, message: 'Fee category and amount are required.' });
    }

    const orderId = `order_QE${Date.now()}`;
    const transactionId = `TXN-QE-${Date.now().toString().slice(-8)}`;
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const paymentData = {
      transactionId,
      receiptNumber,
      student: student._id,
      studentRollNumber: student.studentDetails?.rollNumber || 'CS2023089',
      studentName: student.name,
      feeCategory,
      semester: semester || 'Semester 4',
      academicYear: '2025-2026',
      amount: Number(amount),
      paymentMethod,
      gateway: 'Razorpay',
      razorpayOrderId: orderId,
      status: 'pending',
    };

    let paymentRecord = null;
    if (isMongoConnected()) {
      paymentRecord = await Payment.create(paymentData);
    } else {
      paymentRecord = memoryStore.createPayment(paymentData);
    }

    res.json({
      success: true,
      orderId,
      transactionId,
      amount: Number(amount),
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_queueease_mock_key',
      paymentRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAndCompletePayment = async (req, res) => {
  try {
    const { transactionId, razorpayPaymentId, paymentMethod = 'UPI' } = req.body;
    const student = req.user;

    let payment = null;
    if (isMongoConnected()) {
      payment = await Payment.findOne({ transactionId });
    } else {
      payment = memoryStore.getPaymentById(transactionId);
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const now = new Date();
    const receiptUrl = `/api/payments/receipt/${payment.receiptNumber}`;

    if (isMongoConnected()) {
      payment.status = 'success';
      payment.razorpayPaymentId = razorpayPaymentId || `pay_QE${Date.now()}`;
      payment.paymentMethod = paymentMethod;
      payment.paidAt = now;
      payment.receiptPdfUrl = receiptUrl;
      await payment.save();
    } else {
      payment = memoryStore.updatePayment(transactionId, {
        status: 'success',
        razorpayPaymentId: razorpayPaymentId || `pay_QE${Date.now()}`,
        paymentMethod,
        paidAt: now,
        receiptPdfUrl: receiptUrl,
      });
    }

    // Send payment confirmation notification
    await sendNotification({
      recipient: student._id,
      title: 'Fee Payment Successful',
      message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.feeCategory} was successfully processed. Receipt: ${payment.receiptNumber}.`,
      type: 'payment_success',
      link: '/student/payments',
      metadata: { receiptNumber: payment.receiptNumber, amount: payment.amount },
    });

    const io = getSocketIO();
    if (io) {
      io.to('admin_channel').emit('payment_received', {
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        studentName: payment.studentName,
      });
    }

    await logAuditEvent({
      action: 'PAYMENT_VERIFIED_SUCCESS',
      module: 'PAYMENT',
      performedBy: student._id,
      performedByName: student.name,
      performedByRole: 'student',
      targetResource: `Receipt ${payment.receiptNumber}`,
      details: { amount: payment.amount, feeCategory: payment.feeCategory, method: paymentMethod },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Payment verified and completed successfully!',
      payment,
      receiptUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadReceiptPDF = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    let payment = null;
    if (isMongoConnected()) {
      payment = await Payment.findOne({ receiptNumber }).populate('student');
    } else {
      payment = memoryStore.getPaymentById(receiptNumber);
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Fee receipt not found.' });
    }

    const pdfBuffer = await generateReceiptPDFBuffer(payment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Receipt_${payment.receiptNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate receipt PDF: ' + error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const { status, feeCategory, search } = req.query;
    let list = [];

    if (isMongoConnected()) {
      const query = {};
      if (status) query.status = status;
      if (feeCategory) query.feeCategory = feeCategory;

      list = await Payment.find(query).populate('student', 'name email phone studentDetails').sort({ createdAt: -1 });

      if (search) {
        list = list.filter((p) => {
          return (
            p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
            p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
            p.studentName.toLowerCase().includes(search.toLowerCase()) ||
            p.studentRollNumber?.toLowerCase().includes(search.toLowerCase())
          );
        });
      }
    } else {
      list = memoryStore.getPayments();
      if (status) list = list.filter((p) => p.status === status);
      if (feeCategory) list = list.filter((p) => p.feeCategory === feeCategory);
      if (search) {
        list = list.filter(
          (p) =>
            p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
            p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
            p.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            p.studentRollNumber?.toLowerCase().includes(search.toLowerCase())
        );
      }
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, count: list.length, transactions: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

