import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import type { Collection } from 'mongodb';
import { User, collection } from '../db/models';
import { buildInsert, castValue, type Doc } from '../db/schema';
import { authenticate, generateToken, type AuthEnv } from '../middleware/auth';
import { readBody } from './body';

const router = new Hono<AuthEnv>();

/** Looks a user up by email, lowercased and trimmed as Mongoose did for queries. */
const findByEmail = async (users: Collection<Doc>, email: unknown): Promise<Doc | null> => {
  const normalized = castValue(User, 'email', email);
  return normalized == null ? null : users.findOne({ email: normalized });
};

// POST /api/auth/signup
router.post('/signup', async (c) => {
  try {
    const { email, password, name } = await readBody(c);
    const users = await collection(User);

    // Check if user already exists
    const existingUser = await findByEmail(users, email);
    if (existingUser) {
      return c.json({ message: 'Email already registered' }, 400);
    }

    // Validate first (so the length check sees the password, not its hash), then hash
    const user = await buildInsert(User, { email, password, name });
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
    await users.insertOne(user);

    const token = await generateToken(user._id.toHexString());

    return c.json(
      {
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      201
    );
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ message: 'Error creating user' }, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (c) => {
  try {
    const { email, password } = await readBody(c);

    // Find user, password hash included
    const user = await findByEmail(await collection(User), email);
    if (!user) {
      return c.json({ message: 'Invalid email or password' }, 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return c.json({ message: 'Invalid email or password' }, 401);
    }

    const token = await generateToken(user._id.toHexString());

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ message: 'Error logging in' }, 500);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, (c) => {
  const user = c.get('user');
  return c.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });
});

export default router;
