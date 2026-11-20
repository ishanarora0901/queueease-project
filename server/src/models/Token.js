import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  counter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: [
      'waiting',
      'called',
      'calling',
      'serving',
      'completed',
      'cancelled',
      'skipped',
      'no_show',
      'rejoin_requested'
    ],
    default: 'waiting',
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'rejoined'],
    default: 'normal',
  },
  bookedDate: {
    type: String,
    required: true, // Format: YYYY-MM-DD
  },
  timeSlot: {
    type: String,
    default: '09:00 AM - 10:00 AM',
  },
  queuePosition: {
    type: Number,
    default: 1,
  },
  estimatedWaitMinutes: {
    type: Number,
    default: 15,
  },
  officeType: {
    type: String,
    enum: ['admission', 'cad', 'general'],
    default: 'general',
  },
  studentName: {
    type: String,
    default: '',
  },
  uid: {
    type: String,
    default: '',
  },
  studentClass: {
    type: String,
    default: '',
  },
  semester: {
    type: String,
    default: '',
  },
  totalFees: {
    type: Number,
    default: 0,
  },
  feeCategory: {
    type: String,
    default: '',
  },
  paymentMode: {
    type: String,
    default: 'counter',
  },
  qrCodeData: {
    type: String, // Data string embedded in the QR
  },
  qrCodeUrl: {
    type: String, // Data URI or URL
  },
  remarks: {
    type: String,
    default: '',
  },
  cancellationReason: {
    type: String,
    default: '',
  },
  calledAt: {
    type: Date,
  },
  servedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  verifiedByStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  timeline: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
  }],
}, {
  timestamps: true,
});

tokenSchema.index({ counter: 1, bookedDate: 1, status: 1 });
tokenSchema.index({ student: 1, status: 1 });

const Token = mongoose.model('Token', tokenSchema);
export default Token;

