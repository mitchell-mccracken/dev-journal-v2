import { Hono } from 'hono';
import { GenericChemical, collection } from '../db/models';
import { buildInsert, buildUpdate, withDefaults } from '../db/schema';
import { authenticate, type AuthEnv } from '../middleware/auth';
import { idParam, readBody } from './body';

const router = new Hono<AuthEnv>();

/** MongoDB's duplicate-key error: the name + ratio unique index. */
const isDuplicateKey = (error: unknown): boolean => (error as { code?: number })?.code === 11000;

// GET /api/generic-chemicals - Get all chemicals for authenticated user
router.get('/', authenticate, async (c) => {
  try {
    const chemicals = await (await collection(GenericChemical))
      .find({ user: c.get('user')._id })
      .sort({ type: 1, name: 1 })
      .toArray();
    return c.json({ data: chemicals.map((chemical) => withDefaults(GenericChemical, chemical)) });
  } catch (error) {
    console.error('Error fetching chemicals:', error);
    return c.json({ message: 'Error fetching chemicals' }, 500);
  }
});

// POST /api/generic-chemicals - Create a new chemical
router.post('/', authenticate, async (c) => {
  try {
    const { name, ratio, type, expirationDate, notes } = await readBody(c);

    const chemical = await buildInsert(GenericChemical, {
      name,
      ratio,
      type,
      expirationDate,
      notes,
      user: c.get('user')._id,
    });
    await (await collection(GenericChemical)).insertOne(chemical);

    return c.json({ data: chemical }, 201);
  } catch (error) {
    console.error('Error creating chemical:', error);
    if (isDuplicateKey(error)) {
      return c.json({ message: 'Chemical with this name and ratio already exists' }, 400);
    }
    return c.json({ message: 'Error creating chemical' }, 500);
  }
});

// PUT /api/generic-chemicals/:id - Update a chemical
router.put('/:id', authenticate, async (c) => {
  try {
    const { name, ratio, type, expirationDate, notes } = await readBody(c);

    const update = await buildUpdate(GenericChemical, { name, ratio, type, expirationDate, notes });
    const _id = idParam(c);
    const chemical =
      _id &&
      (await (await collection(GenericChemical)).findOneAndUpdate({ _id, user: c.get('user')._id }, update, {
        returnDocument: 'after',
      }));

    if (!chemical) {
      return c.json({ message: 'Chemical not found' }, 404);
    }

    return c.json({ data: withDefaults(GenericChemical, chemical) });
  } catch (error) {
    console.error('Error updating chemical:', error);
    if (isDuplicateKey(error)) {
      return c.json({ message: 'Chemical with this name and ratio already exists' }, 400);
    }
    return c.json({ message: 'Error updating chemical' }, 500);
  }
});

// DELETE /api/generic-chemicals/:id - Delete a chemical
router.delete('/:id', authenticate, async (c) => {
  try {
    const _id = idParam(c);
    const chemical =
      _id && (await (await collection(GenericChemical)).findOneAndDelete({ _id, user: c.get('user')._id }));

    if (!chemical) {
      return c.json({ message: 'Chemical not found' }, 404);
    }

    return c.json({ message: 'Chemical deleted successfully' });
  } catch (error) {
    console.error('Error deleting chemical:', error);
    return c.json({ message: 'Error deleting chemical' }, 500);
  }
});

export default router;
