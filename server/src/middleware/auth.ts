import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';
import ms from 'ms';
import { ObjectId } from 'mongodb';
import { getConfig } from '../config';
import { User, collection } from '../db/models';
import type { Doc } from '../db/schema';

/** Hono context variables set by authenticate. */
export type AuthEnv = {
  Variables: {
    /** The signed-in user, without the password hash. */
    user: Doc;
  };
};

/*
 * Tokens are HS256 JWTs carrying { userId, iat, exp }, the same shape
 * jsonwebtoken produced, so tokens issued before the switch stay valid. Heroku
 * and Cloudflare must share JWT_SECRET for a token to work on both.
 */
export const generateToken = async (userId: string): Promise<string> => {
  const { jwtSecret, jwtExpiresIn } = getConfig();
  // Parsed the way jsonwebtoken parsed expiresIn: "7d", "12h", ...
  const lifetime = ms(jwtExpiresIn as ms.StringValue);
  if (lifetime === undefined) throw new Error(`Invalid JWT_EXPIRES_IN: ${jwtExpiresIn}`);
  const iat = Math.floor(Date.now() / 1000);
  return sign({ userId, iat, exp: Math.floor(iat + lifetime / 1000) }, jwtSecret, 'HS256');
};

export const authenticate = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'No token provided' }, 401);
  }

  let user: Doc | null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = await verify(token, getConfig().jwtSecret, 'HS256');
    user = await (await collection(User)).findOne(
      { _id: new ObjectId(decoded.userId as string) },
      { projection: { password: 0 } }
    );
  } catch {
    return c.json({ message: 'Invalid token' }, 401);
  }

  if (!user) {
    return c.json({ message: 'User not found' }, 401);
  }

  c.set('user', user);
  await next();
});
