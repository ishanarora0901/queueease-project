import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  date: {
    type: String,
    required: true, // YYYY-MM-DD
  },
  timeSlot: {
    type: String,
    required: true, // e.g. "10:30 AM - 11:00 AM"
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'rejected'],
    default: 'confirmed',
  },
  statusReason: {
    type: String,
    default: '',
  },
  officeLocation: {
    type: String,
    default: '',
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

appointmentSchema.index({ teacher: 1, date: 1, timeSlot: 1 });
appointmentSchema.index({ student: 1, date: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;

