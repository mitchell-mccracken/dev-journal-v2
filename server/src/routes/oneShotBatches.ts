import { Hono } from 'hono';
import { OneShotChemicalBatch, collection } from '../db/models';
import { populateOneShotBatches } from '../db/populate';
import { buildInsert, buildUpdate, withDefaults } from '../db/schema';
import { authenticate, type AuthEnv } from '../middleware/auth';
import { idParam, readBody } from './body';

const router = new Hono<AuthEnv>();

const isValidationError = (error: unknown): error is Error =>
  (error as Error)?.name === 'ValidationError';

// GET /api/one-shot-batches - Get all one-shot batches for authenticated user
router.get('/', authenticate, async (c) => {
  try {
    const batches = await (await collection(OneShotChemicalBatch))
      .find({ user: c.get('user')._id })
      .sort({ createdAt: -1 })
      .toArray();
    const populated = await populateOneShotBatches(
      batches.map((batch) => withDefaults(OneShotChemicalBatch, batch))
    );
    return c.json({ data: populated });
  } catch (error) {
    console.error('Error fetching one-shot batches:', error);
    return c.json({ message: 'Error fetching one-shot batches' }, 500);
  }
});

// GET /api/one-shot-batches/:id - Get a single one-shot batch
router.get('/:id', authenticate, async (c) => {
  try {
    const _id = idParam(c);
    const batch =
      _id && (await (await collection(OneShotChemicalBatch)).findOne({ _id, user: c.get('user')._id }));

    if (!batch) {
      return c.json({ message: 'One-shot batch not found' }, 404);
    }

    const [populated] = await populateOneShotBatches([withDefaults(OneShotChemicalBatch, batch)]);
    return c.json({ data: populated });
  } catch (error) {
    console.error('Error fetching one-shot batch:', error);
    return c.json({ message: 'Error fetching one-shot batch' }, 500);
  }
});

// POST /api/one-shot-batches - Create a new one-shot batch
router.post('/', authenticate, async (c) => {
  try {
    const { developer, fixer, stopBath, developedAt, filmRolls, notes } = await readBody(c);

    const batch = await buildInsert(OneShotChemicalBatch, {
      developer,
      fixer,
      stopBath,
      developedAt,
      filmRolls,
      notes,
      user: c.get('user')._id,
    });
    await (await collection(OneShotChemicalBatch)).insertOne(batch);

    const [populatedBatch] = await populateOneShotBatches([batch]);
    return c.json({ data: populatedBatch }, 201);
  } catch (error) {
    console.error('Error creating one-shot batch:', error);
    if (isValidationError(error)) {
      return c.json({ message: error.message }, 400);
    }
    return c.json({ message: 'Error creating one-shot batch' }, 500);
  }
});

// PUT /api/one-shot-batches/:id - Update a one-shot batch
router.put('/:id', authenticate, async (c) => {
  try {
    const { developer, fixer, stopBath, developedAt, filmRolls, notes } = await readBody(c);

    const update = await buildUpdate(OneShotChemicalBatch, {
      developer,
      fixer,
      stopBath,
      developedAt,
      filmRolls,
      notes,
    });
    const _id = idParam(c);
    const batch =
      _id &&
      (await (await collection(OneShotChemicalBatch)).findOneAndUpdate({ _id, user: c.get('user')._id }, update, {
        returnDocument: 'after',
      }));

    if (!batch) {
      return c.json({ message: 'One-shot batch not found' }, 404);
    }

    const [populated] = await populateOneShotBatches([withDefaults(OneShotChemicalBatch, batch)]);
    return c.json({ data: populated });
  } catch (error) {
    console.error('Error updating one-shot batch:', error);
    if (isValidationError(error)) {
      return c.json({ message: error.message }, 400);
    }
    return c.json({ message: 'Error updating one-shot batch' }, 500);
  }
});

// DELETE /api/one-shot-batches/:id - Delete a one-shot batch
router.delete('/:id', authenticate, async (c) => {
  try {
    const _id = idParam(c);
    const batch =
      _id &&
      (await (await collection(OneShotChemicalBatch)).findOneAndDelete({ _id, user: c.get('user')._id }));

    if (!batch) {
      return c.json({ message: 'One-shot batch not found' }, 404);
    }

    return c.json({ message: 'One-shot batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting one-shot batch:', error);
    return c.json({ message: 'Error deleting one-shot batch' }, 500);
  }
});

export default router;
