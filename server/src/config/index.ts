import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Find .env file - check multiple locations
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),           // Root when running from root
  path.resolve(__dirname, '../../../.env'),      // From compiled dist/
  path.resolve(__dirname, '../../.env'),         // From src/ during dev
];

const envPath = possiblePaths.find(p => existsSync(p));
if (envPath) {
  console.log('📁 Loading .env from:', envPath);
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️  No .env file found, using defaults');
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dev-journal',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
