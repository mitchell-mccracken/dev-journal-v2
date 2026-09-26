import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { ObjectId } from 'mongodb';
import type { Doc } from '../db/schema';

const hasJsonBody = (c: Context): boolean =>
  (c.req.header('content-type') ?? '').includes('application/json');

/**
 * Answers a malformed JSON body with a 400 before any route sees it, as
 * express.json() did. Routes can then read the body without their own checks.
 */
export const rejectMalformedJson = createMiddleware(async (c, next) => {
  if (hasJsonBody(c)) {
    const text = await c.req.text();
    if (text.trim()) {
      try {
        JSON.parse(text);
      } catch {
        return c.json({ message: 'Invalid JSON body' }, 400);
      }
    }
  }
  await next();
});

/**
 * The request's JSON object, or {} when there isn't one -- what req.body was
 * under express.json().
 */
export const readBody = async (c: Context): Promise<Doc> => {
  if (!hasJsonBody(c)) return {};
  const text = await c.req.text();
  if (!text.trim()) return {};
  const parsed: unknown = JSON.parse(text);
  return parsed !== null && typeof parsed === 'object' ? (parsed as Doc) : {};
};

/** The :id route parameter, or null when it can't be an ObjectId. */
export const idParam = (c: Context): ObjectId | null => {
  const id = c.req.param('id');
  return id && ObjectId.isValid(id) && /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null;
};
