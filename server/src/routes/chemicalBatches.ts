import { Hono } from 'hono';
import { ChemicalBatch, FilmRoll, collection } from '../db/models';
import { populateRolls } from '../db/populate';
import { buildInsert, buildUpdate, withDefaults, type Doc } from '../db/schema';
import { authenticate, type AuthEnv } from '../middleware/auth';
import { idParam, readBody } from './body';

const router = new Hono<AuthEnv>();

// All routes require authentication
router.use(authenticate);

// GET /api/chemical-batches - Get all chemical batches for user (excludes soft-deleted)
router.get('/', async (c) => {
  try {
    const includeDeleted = c.req.query('includeDeleted');
    const query: Doc = { user: c.get('user')._id };

    // By default, exclude soft-deleted batches
    if (includeDeleted !== 'true') {
      query.deletedAt = null;
    }

    const batches = await (await collection(ChemicalBatch)).find(query).sort({ createdAt: -1 }).toArray();
    return c.json(batches.map((batch) => withDefaults(ChemicalBatch, batch)));
  } catch (error) {
    console.error('Get chemical batches error:', error);
    return c.json({ message: 'Error fetching chemical batches' }, 500);
  }
});

// GET /api/chemical-batches/:id - Get single chemical batch
router.get('/:id', async (c) => {
  try {
    const _id = idParam(c);
    const batch = _id && (await (await collection(ChemicalBatch)).findOne({ _id, user: c.get('user')._id }));
    if (!batch) {
      return c.json({ message: 'Chemical batch not found' }, 404);
    }
    return c.json(withDefaults(ChemicalBatch, batch));
  } catch (error) {
    console.error('Get chemical batch error:', error);
    return c.json({ message: 'Error fetching chemical batch' }, 500);
  }
});

// GET /api/chemical-batches/:id/rolls - Get all rolls developed with this batch
router.get('/:id/rolls', async (c) => {
  try {
    const _id = idParam(c);
    const batch = _id && (await (await collection(ChemicalBatch)).findOne({ _id, user: c.get('user')._id }));
    if (!batch) {
      return c.json({ message: 'Chemical batch not found' }, 404);
    }

    const rolls = await (await collection(FilmRoll))
      .find({ chemicalBatch: _id, user: c.get('user')._id })
      .sort({ createdAt: 1 })
      .toArray();

    return c.json(await populateRolls(rolls.map((roll) => withDefaults(FilmRoll, roll))));
  } catch (error) {
    console.error('Get batch rolls error:', error);
    return c.json({ message: 'Error fetching rolls for batch' }, 500);
  }
});

// POST /api/chemical-batches - Create chemical batch
router.post('/', async (c) => {
  try {
    const { name, description, chemicalType, status, notes } = await readBody(c);
    const batch = await buildInsert(ChemicalBatch, {
      name,
      description,
      chemicalType,
      status,
      notes,
      user: c.get('user')._id,
    });
    await (await collection(ChemicalBatch)).insertOne(batch);
    return c.json(batch, 201);
  } catch (error) {
    console.error('Create chemical batch error:', error);
    return c.json({ message: 'Error creating chemical batch' }, 500);
  }
});

// PUT /api/chemical-batches/:id - Update chemical batch
router.put('/:id', async (c) => {
  try {
    const { name, description, chemicalType, status, notes } = await readBody(c);
    const update = await buildUpdate(ChemicalBatch, { name, description, chemicalType, status, notes });
    const _id = idParam(c);
    const batch =
      _id &&
      (await (await collection(ChemicalBatch)).findOneAndUpdate(
        { _id, user: c.get('user')._id, deletedAt: null },
        update,
        { returnDocument: 'after' }
      ));
    if (!batch) {
      return c.json({ message: 'Chemical batch not found' }, 404);
    }
    return c.json(withDefaults(ChemicalBatch, batch));
  } catch (error) {
    console.error('Update chemical batch error:', error);
    return c.json({ message: 'Error updating chemical batch' }, 500);
  }
});

// DELETE /api/chemical-batches/:id - Soft delete chemical batch
router.delete('/:id', async (c) => {
  try {
    const update = await buildUpdate(ChemicalBatch, { deletedAt: new Date() });
    const _id = idParam(c);
    const batch =
      _id &&
      (await (await collection(ChemicalBatch)).findOneAndUpdate(
        { _id, user: c.get('user')._id, deletedAt: null },
        update,
        { returnDocument: 'after' }
      ));
    if (!batch) {
      return c.json({ message: 'Chemical batch not found' }, 404);
    }
    return c.json({ message: 'Chemical batch deleted' });
  } catch (error) {
    console.error('Delete chemical batch error:', error);
    return c.json({ message: 'Error deleting chemical batch' }, 500);
  }
});

// POST /api/chemical-batches/:id/restore - Restore soft-deleted batch
router.post('/:id/restore', async (c) => {
  try {
    const update = await buildUpdate(ChemicalBatch, { deletedAt: null });
    const _id = idParam(c);
    const batch =
      _id &&
      (await (await collection(ChemicalBatch)).findOneAndUpdate(
        { _id, user: c.get('user')._id, deletedAt: { $ne: null } },
        update,
        { returnDocument: 'after' }
      ));
    if (!batch) {
      return c.json({ message: 'Deleted chemical batch not found' }, 404);
    }
    return c.json(withDefaults(ChemicalBatch, batch));
  } catch (error) {
    console.error('Restore chemical batch error:', error);
    return c.json({ message: 'Error restoring chemical batch' }, 500);
  }
});

export default router;
