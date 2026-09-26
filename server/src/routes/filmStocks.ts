import { Hono } from 'hono';
import { FilmStock, collection } from '../db/models';
import { buildInsert, buildUpdate, withDefaults } from '../db/schema';
import { authenticate, type AuthEnv } from '../middleware/auth';
import { idParam, readBody } from './body';

const router = new Hono<AuthEnv>();

// All routes require authentication
router.use(authenticate);

// GET /api/film-stocks - Get all film stocks for user
router.get('/', async (c) => {
  try {
    const filmStocks = await (await collection(FilmStock))
      .find({ user: c.get('user')._id })
      .sort({ make: 1, name: 1 })
      .toArray();
    return c.json(filmStocks.map((stock) => withDefaults(FilmStock, stock)));
  } catch (error) {
    console.error('Get film stocks error:', error);
    return c.json({ message: 'Error fetching film stocks' }, 500);
  }
});

// GET /api/film-stocks/:id - Get single film stock
router.get('/:id', async (c) => {
  try {
    const _id = idParam(c);
    const filmStock = _id && (await (await collection(FilmStock)).findOne({ _id, user: c.get('user')._id }));
    if (!filmStock) {
      return c.json({ message: 'Film stock not found' }, 404);
    }
    return c.json(withDefaults(FilmStock, filmStock));
  } catch (error) {
    console.error('Get film stock error:', error);
    return c.json({ message: 'Error fetching film stock' }, 500);
  }
});

// POST /api/film-stocks - Create film stock
router.post('/', async (c) => {
  try {
    const { make, name, iso, format, type } = await readBody(c);
    const filmStock = await buildInsert(FilmStock, {
      make,
      name,
      iso,
      format,
      type,
      user: c.get('user')._id,
    });
    await (await collection(FilmStock)).insertOne(filmStock);
    return c.json(filmStock, 201);
  } catch (error) {
    console.error('Create film stock error:', error);
    return c.json({ message: 'Error creating film stock' }, 500);
  }
});

// PUT /api/film-stocks/:id - Update film stock
router.put('/:id', async (c) => {
  try {
    const { make, name, iso, format, type } = await readBody(c);
    const update = await buildUpdate(FilmStock, { make, name, iso, format, type });
    const _id = idParam(c);
    const filmStock =
      _id &&
      (await (await collection(FilmStock)).findOneAndUpdate({ _id, user: c.get('user')._id }, update, {
        returnDocument: 'after',
      }));
    if (!filmStock) {
      return c.json({ message: 'Film stock not found' }, 404);
    }
    return c.json(withDefaults(FilmStock, filmStock));
  } catch (error) {
    console.error('Update film stock error:', error);
    return c.json({ message: 'Error updating film stock' }, 500);
  }
});

// DELETE /api/film-stocks/:id - Delete film stock
router.delete('/:id', async (c) => {
  try {
    const _id = idParam(c);
    const filmStock =
      _id && (await (await collection(FilmStock)).findOneAndDelete({ _id, user: c.get('user')._id }));
    if (!filmStock) {
      return c.json({ message: 'Film stock not found' }, 404);
    }
    return c.json({ message: 'Film stock deleted' });
  } catch (error) {
    console.error('Delete film stock error:', error);
    return c.json({ message: 'Error deleting film stock' }, 500);
  }
});

export default router;
