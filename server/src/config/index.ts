export interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  clientUrl: string;
  capacitorOrigins: string[];
}

let cached: Config | null = null;

/**
 * Read on first use rather than at import. On Node that is after loadEnv has
 * run; on a Worker, process.env is only populated once a request arrives.
 */
export const getConfig = (): Config => {
  cached ??= {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dev-journal',
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    capacitorOrigins: ['capacitor://localhost', 'http://localhost', 'ionic://localhost'],
  };
  return cached;
};
