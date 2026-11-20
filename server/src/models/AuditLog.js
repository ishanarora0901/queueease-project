import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    enum: ['AUTH', 'QUEUE', 'COUNTER', 'APPOINTMENT', 'CAD', 'PAYMENT', 'ADMIN', 'SYSTEM'],
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  performedByName: {
    type: String,
    default: 'System',
  },
  performedByRole: {
    type: String,
    default: 'system',
  },
  targetResource: {
    type: String,
    default: '',
  },
  targetId: {
    type: String,
    default: '',
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

auditLogSchema.index({ module: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

