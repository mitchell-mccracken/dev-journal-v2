import { Router, Response } from 'express';
import { ChemicalBatch, FilmRoll } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/chemical-batches - Get all chemical batches for user (excludes soft-deleted)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { includeDeleted } = req.query;
    const query: any = { user: req.user!._id };
    
    // By default, exclude soft-deleted batches
    if (includeDeleted !== 'true') {
      query.deletedAt = null;
    }

    const batches = await ChemicalBatch.find(query).sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    console.error('Get chemical batches error:', error);
    res.status(500).json({ message: 'Error fetching chemical batches' });
  }
});

// GET /api/chemical-batches/:id - Get single chemical batch
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await ChemicalBatch.findOne({ _id: req.params.id, user: req.user!._id });
    if (!batch) {
      res.status(404).json({ message: 'Chemical batch not found' });
      return;
    }
    res.json(batch);
  } catch (error) {
    console.error('Get chemical batch error:', error);
    res.status(500).json({ message: 'Error fetching chemical batch' });
  }
});

// GET /api/chemical-batches/:id/rolls - Get all rolls developed with this batch
router.get('/:id/rolls', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await ChemicalBatch.findOne({ _id: req.params.id, user: req.user!._id });
    if (!batch) {
      res.status(404).json({ message: 'Chemical batch not found' });
      return;
    }

    const rolls = await FilmRoll.find({ 
      chemicalBatch: req.params.id, 
      user: req.user!._id 
    })
      .populate('filmStock')
      .populate('camera')
      .sort({ createdAt: 1 });

    res.json(rolls);
  } catch (error) {
    console.error('Get batch rolls error:', error);
    res.status(500).json({ message: 'Error fetching rolls for batch' });
  }
});

// POST /api/chemical-batches - Create chemical batch
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, chemicalType, status, notes } = req.body;
    const batch = await ChemicalBatch.create({
      name,
      description,
      chemicalType,
      status,
      notes,
      user: req.user!._id,
    });
    res.status(201).json(batch);
  } catch (error) {
    console.error('Create chemical batch error:', error);
    res.status(500).json({ message: 'Error creating chemical batch' });
  }
});

// PUT /api/chemical-batches/:id - Update chemical batch
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, chemicalType, status, notes } = req.body;
    const batch = await ChemicalBatch.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id, deletedAt: null },
      { name, description, chemicalType, status, notes },
      { new: true, runValidators: true }
    );
    if (!batch) {
      res.status(404).json({ message: 'Chemical batch not found' });
      return;
    }
    res.json(batch);
  } catch (error) {
    console.error('Update chemical batch error:', error);
    res.status(500).json({ message: 'Error updating chemical batch' });
  }
});

// DELETE /api/chemical-batches/:id - Soft delete chemical batch
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await ChemicalBatch.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!batch) {
      res.status(404).json({ message: 'Chemical batch not found' });
      return;
    }
    res.json({ message: 'Chemical batch deleted' });
  } catch (error) {
    console.error('Delete chemical batch error:', error);
    res.status(500).json({ message: 'Error deleting chemical batch' });
  }
});

// POST /api/chemical-batches/:id/restore - Restore soft-deleted batch
router.post('/:id/restore', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await ChemicalBatch.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );
    if (!batch) {
      res.status(404).json({ message: 'Deleted chemical batch not found' });
      return;
    }
    res.json(batch);
  } catch (error) {
    console.error('Restore chemical batch error:', error);
    res.status(500).json({ message: 'Error restoring chemical batch' });
  }
});

export default router;
