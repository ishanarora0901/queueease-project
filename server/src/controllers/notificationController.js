import { isMongoConnected } from '../config/db.js';
import Notification from '../models/Notification.js';
import { memoryStore } from '../config/memoryStore.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    let notifications = [];

    if (isMongoConnected()) {
      notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(50);
    } else {
      notifications = memoryStore.getNotifications(userId);
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (isMongoConnected()) {
      await Notification.findOneAndUpdate(
        { _id: id, recipient: userId },
        { isRead: true, readAt: new Date() }
      );
    } else {
      memoryStore.markNotificationAsRead(id, userId);
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    if (isMongoConnected()) {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else {
      memoryStore.markAllNotificationsAsRead(userId);
    }

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

