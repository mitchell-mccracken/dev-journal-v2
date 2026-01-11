import { Router, Response } from 'express';
import { FilmRoll } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/film-rolls - Get all film rolls for user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query: any = { user: req.user!._id };
    
    if (status) {
      query.status = status;
    }

    const filmRolls = await FilmRoll.find(query)
      .populate('filmStock')
      .populate('camera')
      .populate('chemicalBatch')
      .sort({ createdAt: -1 });
    res.json(filmRolls);
  } catch (error) {
    console.error('Get film rolls error:', error);
    res.status(500).json({ message: 'Error fetching film rolls' });
  }
});

// GET /api/film-rolls/:id - Get single film roll
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filmRoll = await FilmRoll.findOne({ _id: req.params.id, user: req.user!._id })
      .populate('filmStock')
      .populate('camera')
      .populate('chemicalBatch');
    if (!filmRoll) {
      res.status(404).json({ message: 'Film roll not found' });
      return;
    }
    res.json(filmRoll);
  } catch (error) {
    console.error('Get film roll error:', error);
    res.status(500).json({ message: 'Error fetching film roll' });
  }
});

// POST /api/film-rolls - Create film roll
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filmStock, camera, chemicalBatch, dateLoaded, dateFinished, frameCount, status, notes } = req.body;
    const filmRoll = await FilmRoll.create({
      filmStock,
      camera: camera || null,
      chemicalBatch: chemicalBatch || null,
      dateLoaded,
      dateFinished,
      frameCount,
      status,
      notes,
      user: req.user!._id,
    });
    
    const populated = await filmRoll.populate(['filmStock', 'camera', 'chemicalBatch']);
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create film roll error:', error);
    res.status(500).json({ message: 'Error creating film roll' });
  }
});

// PUT /api/film-rolls/:id - Update film roll
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filmStock, camera, chemicalBatch, dateLoaded, dateFinished, frameCount, status, notes } = req.body;
    const filmRoll = await FilmRoll.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { 
        filmStock, 
        camera: camera || null,
        chemicalBatch: chemicalBatch || null,
        dateLoaded, 
        dateFinished, 
        frameCount, 
        status, 
        notes 
      },
      { new: true, runValidators: true }
    ).populate(['filmStock', 'camera', 'chemicalBatch']);
    
    if (!filmRoll) {
      res.status(404).json({ message: 'Film roll not found' });
      return;
    }
    res.json(filmRoll);
  } catch (error) {
    console.error('Update film roll error:', error);
    res.status(500).json({ message: 'Error updating film roll' });
  }
});

// DELETE /api/film-rolls/:id - Delete film roll
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filmRoll = await FilmRoll.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
    if (!filmRoll) {
      res.status(404).json({ message: 'Film roll not found' });
      return;
    }
    res.json({ message: 'Film roll deleted' });
  } catch (error) {
    console.error('Delete film roll error:', error);
    res.status(500).json({ message: 'Error deleting film roll' });
  }
});

export default router;
