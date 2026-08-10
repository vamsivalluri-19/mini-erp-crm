import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey1234567890!@#',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Quick validation
if (!env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set. Database connections will fail.');
}
