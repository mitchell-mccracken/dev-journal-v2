import { Hono } from 'hono';
import { FilmRoll, collection } from '../db/models';
import { populateRolls } from '../db/populate';
import { buildInsert, buildUpdate, withDefaults, type Doc } from '../db/schema';
import { authenticate, type AuthEnv } from '../middleware/auth';
import { idParam, readBody } from './body';

const router = new Hono<AuthEnv>();

// All routes require authentication
router.use(authenticate);

// GET /api/film-rolls - Get all film rolls for user
router.get('/', async (c) => {
  try {
    const statuses = c.req.queries('status') ?? [];
    const query: Doc = { user: c.get('user')._id };

    if (statuses.length > 1) {
      query.status = { $in: statuses };
    } else if (statuses[0]) {
      query.status = statuses[0];
    }

    const filmRolls = await (await collection(FilmRoll)).find(query).sort({ createdAt: -1 }).toArray();
    return c.json(await populateRolls(filmRolls.map((roll) => withDefaults(FilmRoll, roll))));
  } catch (error) {
    console.error('Get film rolls error:', error);
    return c.json({ message: 'Error fetching film rolls' }, 500);
  }
});

// GET /api/film-rolls/:id - Get single film roll
router.get('/:id', async (c) => {
  try {
    const _id = idParam(c);
    const filmRoll = _id && (await (await collection(FilmRoll)).findOne({ _id, user: c.get('user')._id }));
    if (!filmRoll) {
      return c.json({ message: 'Film roll not found' }, 404);
    }
    const [populated] = await populateRolls([withDefaults(FilmRoll, filmRoll)]);
    return c.json(populated);
  } catch (error) {
    console.error('Get film roll error:', error);
    return c.json({ message: 'Error fetching film roll' }, 500);
  }
});

// POST /api/film-rolls - Create film roll
router.post('/', async (c) => {
  try {
    const { filmStock, camera, chemicalBatch, dateLoaded, dateFinished, frameCount, status, countAsFullRoll, notes } =
      await readBody(c);
    const filmRoll = await buildInsert(FilmRoll, {
      filmStock,
      camera: camera || null,
      chemicalBatch: chemicalBatch || null,
      dateLoaded,
      dateFinished,
      frameCount,
      status,
      countAsFullRoll,
      notes,
      user: c.get('user')._id,
    });
    await (await collection(FilmRoll)).insertOne(filmRoll);

    const [populated] = await populateRolls([filmRoll]);
    return c.json(populated, 201);
  } catch (error) {
    console.error('Create film roll error:', error);
    return c.json({ message: 'Error creating film roll' }, 500);
  }
});

// PUT /api/film-rolls/:id - Update film roll
router.put('/:id', async (c) => {
  try {
    const { filmStock, camera, chemicalBatch, dateLoaded, dateFinished, frameCount, status, countAsFullRoll, notes } =
      await readBody(c);
    const update = await buildUpdate(FilmRoll, {
      filmStock,
      camera: camera || null,
      chemicalBatch: chemicalBatch || null,
      dateLoaded,
      dateFinished,
      frameCount,
      status,
      countAsFullRoll,
      notes,
    });
    const _id = idParam(c);
    const filmRoll =
      _id &&
      (await (await collection(FilmRoll)).findOneAndUpdate({ _id, user: c.get('user')._id }, update, {
        returnDocument: 'after',
      }));

    if (!filmRoll) {
      return c.json({ message: 'Film roll not found' }, 404);
    }
    const [populated] = await populateRolls([withDefaults(FilmRoll, filmRoll)]);
    return c.json(populated);
  } catch (error) {
    console.error('Update film roll error:', error);
    return c.json({ message: 'Error updating film roll' }, 500);
  }
});

// DELETE /api/film-rolls/:id - Delete film roll
router.delete('/:id', async (c) => {
  try {
    const _id = idParam(c);
    const filmRoll =
      _id && (await (await collection(FilmRoll)).findOneAndDelete({ _id, user: c.get('user')._id }));
    if (!filmRoll) {
      return c.json({ message: 'Film roll not found' }, 404);
    }
    return c.json({ message: 'Film roll deleted' });
  } catch (error) {
    console.error('Delete film roll error:', error);
    return c.json({ message: 'Error deleting film roll' }, 500);
  }
});

export default router;
