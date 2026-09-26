import { AsyncLocalStorage } from 'async_hooks';
import { Db, MongoClient } from 'mongodb';
import { getConfig } from './index';

const newClient = (): MongoClient =>
  new MongoClient(getConfig().mongodbUri, {
    // Fail loudly on a bad host rather than hanging a request for 30 seconds.
    serverSelectionTimeoutMS: 10_000,
    // Keep a warm socket around so a dyno waking from idle reuses it.
    maxIdleTimeMS: 270_000,
  });

/*
 * Two ways of holding a connection:
 *
 * - Node (Heroku): one client for the life of the process.
 * - Worker: one client per request, via withRequestClient. Workers refuse to
 *   let a request touch a socket another request opened -- a shared client
 *   hangs every other request -- so each request connects and closes its own.
 */
let client: MongoClient | null = null;
let connectionPromise: Promise<Db> | null = null;

interface RequestScope {
  client?: MongoClient;
  db?: Promise<Db>;
}

const requestScope = new AsyncLocalStorage<RequestScope>();

let logged = false;

const connect = async (target: MongoClient): Promise<Db> => {
  if (!logged) {
    const safeUri = getConfig().mongodbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'); // Hide credentials
    console.log('🔄 Connecting to MongoDB...');
    console.log(`   URI: ${safeUri}`);
  }

  // No name: use the database in the connection string, or `test` when it has
  // none -- the same database Mongoose used, so existing data is where it was.
  const db = (await target.connect()).db();

  if (!logged) {
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${db.databaseName}`);
    logged = true;
  }
  return db;
};

/**
 * Every query funnels through here. The connect promise is created once and
 * shared -- per process on Node, per request on a Worker -- so concurrent
 * callers all await the same handshake instead of opening their own.
 */
export const getDb = (): Promise<Db> => {
  const scope = requestScope.getStore();
  if (scope) {
    scope.client ??= newClient();
    scope.db ??= connect(scope.client);
    return scope.db;
  }

  if (!connectionPromise) {
    client ??= newClient();
    connectionPromise = connect(client).catch((error) => {
      // Clear the cached rejection so the next request retries rather than
      // permanently serving the same failure.
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
};

/**
 * Runs one Worker request with its own client, closed once the request is
 * done. `waitUntil` lets the close finish after the response has gone out.
 */
export const withRequestClient = async <T>(
  handle: () => Promise<T>,
  waitUntil: (promise: Promise<unknown>) => void
): Promise<T> => {
  const scope: RequestScope = {};
  try {
    return await requestScope.run(scope, handle);
  } finally {
    if (scope.client) waitUntil(scope.client.close().catch(() => {}));
  }
};

export const closeDatabase = async (): Promise<void> => {
  await client?.close();
};
