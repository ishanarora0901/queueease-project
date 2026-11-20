import { isMongoConnected } from '../config/db.js';
import AuditLog from '../models/AuditLog.js';
import { memoryStore } from '../config/memoryStore.js';

export const logAuditEvent = async ({
  action,
  module,
  performedBy,
  performedByName,
  performedByRole,
  targetResource = '',
  targetId = '',
  details = {},
  ipAddress = '127.0.0.1',
}) => {
  try {
    const logData = {
      action,
      module,
      performedBy,
      performedByName: performedByName || 'System',
      performedByRole: performedByRole || 'system',
      targetResource,
      targetId,
      details,
      ipAddress,
      timestamp: new Date(),
    };

    if (isMongoConnected()) {
      await AuditLog.create(logData);
    } else {
      memoryStore.createAuditLog(logData);
    }
  } catch (err) {
    console.error('Audit logging failed:', err.message);
  }
};

