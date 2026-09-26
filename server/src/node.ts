// Must be first: populates process.env before anything reads config.
import './config/loadEnv';
import path from 'path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { getConfig } from './config';
import { closeDatabase, getDb } from './config/database';
import { ensureIndexes } from './db/models';
import app from './app';

/*
 * The Heroku entry point: the shared API plus the built client, on one dyno.
 */

const config = getConfig();

// Serve the built client in production. In dev, Vite serves the client and
// proxies /api here.
if (config.nodeEnv === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  // serveStatic wants a path relative to the working directory, which differs
  // between `npm start` at the root and inside the workspace.
  const root = path.relative(process.cwd(), clientDistPath);
  app.use('*', serveStatic({ root }));

  // Handle SPA routing - serve index.html for non-API routes
  app.get('*', serveStatic({ root, path: 'index.html' }));
}

// Start server
const startServer = async () => {
  try {
    await ensureIndexes(await getDb());
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }

  const server = serve({ fetch: app.fetch, port: config.port }, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down`);
    server.close(() => {
      closeDatabase().finally(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
