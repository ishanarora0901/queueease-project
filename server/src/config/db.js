import mongoose from 'mongoose';
import { memoryStore } from './memoryStore.js';

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('cluster0.queueease.mongodb.net') || uri.includes('demo12345')) {
    console.log('\n======================================================');
    console.log('ℹ️  MongoDB Atlas: Default demo connection string detected.');
    console.log('💡 Initializing resilient In-Memory store with rich seed data.');
    console.log('👉 To use live MongoDB Atlas, set MONGODB_URI in server/.env');
    console.log('======================================================\n');
    await memoryStore.init();
    isConnected = false;
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`\n✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}\n`);
    return true;
  } catch (error) {
    console.warn(`\n⚠️  Could not connect to MongoDB Atlas (${error.message}).`);
    console.log('💡 Seamlessly falling back to robust In-Memory store with full demo data.');
    await memoryStore.init();
    isConnected = false;
    return false;
  }
};

export const isMongoConnected = () => isConnected;

