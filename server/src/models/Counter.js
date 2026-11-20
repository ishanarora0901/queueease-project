import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  counterNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  servicesHandled: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: [
      'open',
      'closed',
      'lunch_break',
      'temporarily_unavailable',
      'staff_absent',
      'holiday',
      'maintenance'
    ],
    default: 'open',
  },
  statusReason: {
    type: String,
    default: '',
  },
  expectedReopenTime: {
    type: String,
    default: '',
  },
  operatingHours: {
    open: { type: String, default: '09:00 AM' },
    close: { type: String, default: '05:00 PM' },
    lunchStart: { type: String, default: '01:00 PM' },
    lunchEnd: { type: String, default: '02:00 PM' },
  },
  workingDays: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  currentCallingToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
  },
  currentCallingTokenNumber: {
    type: String,
    default: null,
  },
  alternativeCounter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
  },
  avgServiceTimeMinutes: {
    type: Number,
    default: 10,
  },
  dailyServedCount: {
    type: Number,
    default: 0,
  },
  dailyTokensLimit: {
    type: Number,
    default: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;

