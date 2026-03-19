import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import { env } from '../config/env.js';

const sanitizeFileName = (value) =>
  value
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

if (!fs.existsSync(env.uploadPath)) {
  fs.mkdirSync(env.uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, env.uploadPath);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const safeName = sanitizeFileName(baseName) || 'file';
    callback(null, `${Date.now()}-${safeName}${extension}`);
  },
});

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10,
  },
});
