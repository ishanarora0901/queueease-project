import { isMongoConnected } from '../config/db.js';
import Notification from '../models/Notification.js';
import { memoryStore } from '../config/memoryStore.js';

let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

export const getSocketIO = () => ioInstance;

export const sendNotification = async ({
  recipient,
  title,
  message,
  type = 'general',
  link = '',
  metadata = {},
}) => {
  try {
    let notification = null;

    if (isMongoConnected()) {
      notification = await Notification.create({
        recipient,
        title,
        message,
        type,
        link,
        metadata,
      });
    } else {
      notification = memoryStore.createNotification({
        recipient,
        title,
        message,
        type,
        link,
        metadata,
      });
    }

    // Emit live via Socket.io if active
    if (ioInstance) {
      const recipientId = recipient.toString();
      ioInstance.to(`user:${recipientId}`).emit('notification', notification);
      ioInstance.to('all_users').emit('system_alert', { title, message, type });
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

