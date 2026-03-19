import fs from 'node:fs';

import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  if (!fs.existsSync(env.uploadPath)) {
    fs.mkdirSync(env.uploadPath, { recursive: true });
  }

  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
