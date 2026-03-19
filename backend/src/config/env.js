import path from 'node:path';

import dotenv from 'dotenv';

dotenv.config();

const rootDir = process.cwd();

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gov-doc-pro',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  rootDir,
  uploadPath: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads'),
};
