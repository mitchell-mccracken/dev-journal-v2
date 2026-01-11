import { Router, Response } from 'express';
import { Camera } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/cameras - Get all cameras for user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cameras = await Camera.find({ user: req.user!._id }).sort({ make: 1, name: 1 });
    res.json(cameras);
  } catch (error) {
    console.error('Get cameras error:', error);
    res.status(500).json({ message: 'Error fetching cameras' });
  }
});

// GET /api/cameras/:id - Get single camera
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const camera = await Camera.findOne({ _id: req.params.id, user: req.user!._id });
    if (!camera) {
      res.status(404).json({ message: 'Camera not found' });
      return;
    }
    res.json(camera);
  } catch (error) {
    console.error('Get camera error:', error);
    res.status(500).json({ message: 'Error fetching camera' });
  }
});

// POST /api/cameras - Create camera
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { make, name, format, notes } = req.body;
    const camera = await Camera.create({
      make,
      name,
      format,
      notes,
      user: req.user!._id,
    });
    res.status(201).json(camera);
  } catch (error) {
    console.error('Create camera error:', error);
    res.status(500).json({ message: 'Error creating camera' });
  }
});

// PUT /api/cameras/:id - Update camera
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { make, name, format, notes } = req.body;
    const camera = await Camera.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { make, name, format, notes },
      { new: true, runValidators: true }
    );
    if (!camera) {
      res.status(404).json({ message: 'Camera not found' });
      return;
    }
    res.json(camera);
  } catch (error) {
    console.error('Update camera error:', error);
    res.status(500).json({ message: 'Error updating camera' });
  }
});

// DELETE /api/cameras/:id - Delete camera
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const camera = await Camera.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
    if (!camera) {
      res.status(404).json({ message: 'Camera not found' });
      return;
    }
    res.json({ message: 'Camera deleted' });
  } catch (error) {
    console.error('Delete camera error:', error);
    res.status(500).json({ message: 'Error deleting camera' });
  }
});

export default router;
