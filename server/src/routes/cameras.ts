import { Hono } from 'hono';
import { Camera, collection } from '../db/models';
import { buildInsert, buildUpdate, withDefaults } from '../db/schema';
import { authenticate, type AuthEnv } from '../middleware/auth';
import { idParam, readBody } from './body';

const router = new Hono<AuthEnv>();

// All routes require authentication
router.use(authenticate);

// GET /api/cameras - Get all cameras for user
router.get('/', async (c) => {
  try {
    const cameras = await (await collection(Camera))
      .find({ user: c.get('user')._id })
      .sort({ make: 1, name: 1 })
      .toArray();
    return c.json(cameras.map((camera) => withDefaults(Camera, camera)));
  } catch (error) {
    console.error('Get cameras error:', error);
    return c.json({ message: 'Error fetching cameras' }, 500);
  }
});

// GET /api/cameras/:id - Get single camera
router.get('/:id', async (c) => {
  try {
    const _id = idParam(c);
    const camera = _id && (await (await collection(Camera)).findOne({ _id, user: c.get('user')._id }));
    if (!camera) {
      return c.json({ message: 'Camera not found' }, 404);
    }
    return c.json(withDefaults(Camera, camera));
  } catch (error) {
    console.error('Get camera error:', error);
    return c.json({ message: 'Error fetching camera' }, 500);
  }
});

// POST /api/cameras - Create camera
router.post('/', async (c) => {
  try {
    const { make, name, format, notes } = await readBody(c);
    const camera = await buildInsert(Camera, {
      make,
      name,
      format,
      notes,
      user: c.get('user')._id,
    });
    await (await collection(Camera)).insertOne(camera);
    return c.json(camera, 201);
  } catch (error) {
    console.error('Create camera error:', error);
    return c.json({ message: 'Error creating camera' }, 500);
  }
});

// PUT /api/cameras/:id - Update camera
router.put('/:id', async (c) => {
  try {
    const { make, name, format, notes } = await readBody(c);
    const update = await buildUpdate(Camera, { make, name, format, notes });
    const _id = idParam(c);
    const camera =
      _id &&
      (await (await collection(Camera)).findOneAndUpdate({ _id, user: c.get('user')._id }, update, {
        returnDocument: 'after',
      }));
    if (!camera) {
      return c.json({ message: 'Camera not found' }, 404);
    }
    return c.json(withDefaults(Camera, camera));
  } catch (error) {
    console.error('Update camera error:', error);
    return c.json({ message: 'Error updating camera' }, 500);
  }
});

// DELETE /api/cameras/:id - Delete camera
router.delete('/:id', async (c) => {
  try {
    const _id = idParam(c);
    const camera = _id && (await (await collection(Camera)).findOneAndDelete({ _id, user: c.get('user')._id }));
    if (!camera) {
      return c.json({ message: 'Camera not found' }, 404);
    }
    return c.json({ message: 'Camera deleted' });
  } catch (error) {
    console.error('Delete camera error:', error);
    return c.json({ message: 'Error deleting camera' }, 500);
  }
});

export default router;
