import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: [
      'token_booked',
      'turn_approaching',
      'token_called',
      'token_skipped',
      'token_cancelled',
      'token_rescheduled',
      'counter_closed',
      'counter_reopened',
      'teacher_unavailable',
      'appointment_confirmed',
      'appointment_rescheduled',
      'appointment_cancelled',
      'document_submitted',
      'document_approved',
      'document_rejected',
      'document_ready',
      'document_completed',
      'payment_success',
      'payment_failed',
      'general'
    ],
    default: 'general',
  },
  link: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

