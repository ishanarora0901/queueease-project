import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentRollNumber: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  feeCategory: {
    type: String,
    enum: [
      'Tuition Fee',
      'Examination Fee',
      'Library Fee',
      'Hostel & Mess Fee',
      'Transportation Fee',
      'CAD Document Processing Fee',
      'Late Fee / Fine',
      'Other Miscellaneous'
    ],
    required: true,
  },
  semester: {
    type: String,
    default: 'Semester 4',
  },
  academicYear: {
    type: String,
    default: '2025-2026',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash at Counter', 'Demand Draft'],
    default: 'UPI',
  },
  gateway: {
    type: String,
    enum: ['Razorpay', 'Counter_Manual', 'Simulated_Gateway'],
    default: 'Razorpay',
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed', 'refunded'],
    default: 'pending',
  },
  failureReason: {
    type: String,
    default: '',
  },
  receiptPdfUrl: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
  },
  collectedByCounter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
  },
  verifiedByStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

paymentSchema.index({ student: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
