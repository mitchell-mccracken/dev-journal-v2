import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

/*
 * Node only. Imported for its side effect, first thing, by the Node entry point.
 * The Worker never loads this: Cloudflare hands it vars and secrets through
 * process.env directly.
 */

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
