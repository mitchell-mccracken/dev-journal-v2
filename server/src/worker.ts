import type { ExecutionContext } from 'hono';

/*
 * The Cloudflare entry point. wrangler.jsonc routes only /api/* here; every
 * other path is answered from the static client build before this runs.
 *
 * Vars and secrets arrive on process.env (nodejs_compat, with a compatibility
 * date past 2025-04-01), so config is read the same way it is on Node.
 *
 * The app is imported on the first request rather than at the top of the file:
 * bson generates random bytes as it loads, and Workers forbid that in global
 * scope. Later requests on the same isolate reuse the loaded module.
 */
const load = async () => {
  const [{ default: app }, { getDb, withRequestClient }, { ensureIndexes }] = await Promise.all([
    import('./app'),
    import('./config/database'),
    import('./db/models'),
  ]);
  return { app, getDb, withRequestClient, ensureIndexes };
};

let loaded: ReturnType<typeof load> | null = null;

/*
 * The unique indexes back "Email already registered" and the duplicate
 * chemical check, so they can't depend on the Heroku server having created
 * them. Once per isolate, by whichever request gets there first -- a flag
 * rather than a shared promise, since a request must not await I/O that
 * another request started.
 */
let indexed = false;

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    // Without it every token would be signed with the public fallback secret.
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not set on this Worker');
      return Response.json({ message: 'Server is not configured' }, { status: 500 });
    }

    loaded ??= load();
    const { app, getDb, withRequestClient, ensureIndexes } = await loaded;
    return withRequestClient(
      async () => {
        if (!indexed) {
          indexed = true;
          await getDb().then(ensureIndexes).catch((error) => {
            indexed = false;
            console.error('⚠️  Could not ensure indexes:', error);
          });
        }
        return app.fetch(request, env, ctx);
      },
      (promise) => ctx.waitUntil(promise)
    );
  },
};
