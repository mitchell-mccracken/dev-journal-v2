import { Router, Response } from 'express';
import { FilmStock } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/film-stocks - Get all film stocks for user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filmStocks = await FilmStock.find({ user: req.user!._id }).sort({ make: 1, name: 1 });
    res.json(filmStocks);
  } catch (error) {
    console.error('Get film stocks error:', error);
    res.status(500).json({ message: 'Error fetching film stocks' });
  }
});

// GET /api/film-stocks/:id - Get single film stock
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filmStock = await FilmStock.findOne({ _id: req.params.id, user: req.user!._id });
    if (!filmStock) {
      res.status(404).json({ message: 'Film stock not found' });
      return;
    }
    res.json(filmStock);
  } catch (error) {
    console.error('Get film stock error:', error);
    res.status(500).json({ message: 'Error fetching film stock' });
  }
});

// POST /api/film-stocks - Create film stock
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { make, name, iso, format, type } = req.body;
    const filmStock = await FilmStock.create({
      make,
      name,
      iso,
      format,
      type,
      user: req.user!._id,
    });
    res.status(201).json(filmStock);
  } catch (error) {
    console.error('Create film stock error:', error);
    res.status(500).json({ message: 'Error creating film stock' });
  }
});

// PUT /api/film-stocks/:id - Update film stock
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { make, name, iso, format, type } = req.body;
    const filmStock = await FilmStock.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { make, name, iso, format, type },
      { new: true, runValidators: true }
    );
    if (!filmStock) {
      res.status(404).json({ message: 'Film stock not found' });
      return;
    }
    res.json(filmStock);
  } catch (error) {
    console.error('Update film stock error:', error);
    res.status(500).json({ message: 'Error updating film stock' });
  }
});

// DELETE /api/film-stocks/:id - Delete film stock
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filmStock = await FilmStock.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
    if (!filmStock) {
      res.status(404).json({ message: 'Film stock not found' });
      return;
    }
    res.json({ message: 'Film stock deleted' });
  } catch (error) {
    console.error('Delete film stock error:', error);
    res.status(500).json({ message: 'Error deleting film stock' });
  }
});

export default router;
