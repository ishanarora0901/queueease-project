import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getSeedData } from './seedData.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';
import Token from '../models/Token.js';
import Appointment from '../models/Appointment.js';
import DocumentApplication from '../models/DocumentApplication.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const runSeed = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is missing in server/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas at:', uri.split('@')[1] || uri);
    await mongoose.connect(uri);
    console.log('Connected! Purging old collections...');

    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Counter.deleteMany({}),
      Token.deleteMany({}),
      Appointment.deleteMany({}),
      DocumentApplication.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('Inserting seed records...');
    const data = await getSeedData();

    await User.insertMany(data.users);
    await Department.insertMany(data.departments);
    await Counter.insertMany(data.counters);
    await Token.insertMany(data.tokens);
    await Appointment.insertMany(data.appointments);
    await DocumentApplication.insertMany(data.cadApplications);
    await Payment.insertMany(data.payments);
    await Notification.insertMany(data.notifications);
    await AuditLog.insertMany(data.auditLogs);

    console.log('✅ Successfully seeded MongoDB Atlas with QueueEase demo data!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

runSeed();

