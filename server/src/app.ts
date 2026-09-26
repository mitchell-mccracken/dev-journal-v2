import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getConfig } from './config';
import { getDb } from './config/database';
import routes from './routes';
import { rejectMalformedJson } from './routes/body';

/*
 * The API, and nothing platform-specific. node.ts runs it on Heroku; worker.ts
 * runs it on Cloudflare. Anything only one platform can do -- serving the
 * built client, listening on a port, reading .env -- belongs in those files.
 */
const app = new Hono();

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      // Requests with no origin (e.g., mobile apps, curl) need no CORS header
      if (!origin) return null;

      const { clientUrl, capacitorOrigins, nodeEnv } = getConfig();
      const allowedOrigins = [clientUrl, ...capacitorOrigins];

      return allowedOrigins.includes(origin) || nodeEnv === 'production' ? origin : null;
    },
    credentials: true,
  })
);

app.use('/api/*', rejectMalformedJson);

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    await (await getDb()).command({ ping: 1 });
    return c.json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return c.json(
      {
        status: 'degraded',
        db: 'unreachable',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// API Routes
app.route('/api', routes);

// An unknown API path is a 404, never the client's index.html.
app.all('/api/*', (c) => c.json({ message: 'Not found' }, 404));

app.onError((error, c) => {
  console.error('❌ Unhandled error:', error);
  return c.json({ message: 'Internal server error' }, 500);
});

export default app;
