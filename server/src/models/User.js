import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student',
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
  },
  // Student-specific fields
  studentDetails: {
    rollNumber: { type: String, trim: true },
    department: { type: String, trim: true },
    course: { type: String, trim: true },
    year: { type: Number, default: 1 },
    semester: { type: Number, default: 1 },
    batch: { type: String, trim: true },
    idCardNumber: { type: String, trim: true },
  },
  // Staff/Teacher-specific fields
  staffDetails: {
    employeeId: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    departmentName: { type: String, trim: true },
    officeLocation: { type: String, trim: true },
    assignedCounter: { type: mongoose.Schema.Types.ObjectId, ref: 'Counter' },
    availabilityStatus: {
      type: String,
      enum: ['available', 'busy', 'lunch_break', 'temporarily_unavailable', 'on_leave', 'absent'],
      default: 'available',
    },
    expectedReopenTime: { type: String, default: '' },
    statusNote: { type: String, default: '' },
    workingHours: {
      start: { type: String, default: '09:00 AM' },
      end: { type: String, default: '05:00 PM' },
    },
    lunchHours: {
      start: { type: String, default: '01:00 PM' },
      end: { type: String, default: '02:00 PM' },
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
  },
  refreshToken: {
    type: String,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

