import mongoose from 'mongoose';

import { env } from './env.js';

let uploadBucket;

export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  uploadBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: env.mongoUploadBucket,
  });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

export const getUploadBucket = () => {
  if (!uploadBucket) {
    throw new Error('MongoDB upload bucket has not been initialized');
  }

  return uploadBucket;
};
