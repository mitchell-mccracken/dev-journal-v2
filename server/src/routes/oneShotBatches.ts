import { Router, Response } from 'express';
import { OneShotChemicalBatch } from '../models/OneShotChemicalBatch';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/one-shot-batches - Get all one-shot batches for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batches = await OneShotChemicalBatch.find({ user: req.user!._id })
      .populate('developer')
      .populate('fixer')
      .populate('stopBath')
      .populate({
        path: 'filmRolls',
        populate: [
          { path: 'filmStock' },
          { path: 'camera' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json({ data: batches });
  } catch (error) {
    console.error('Error fetching one-shot batches:', error);
    res.status(500).json({ message: 'Error fetching one-shot batches' });
  }
});

// GET /api/one-shot-batches/:id - Get a single one-shot batch
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await OneShotChemicalBatch.findOne({
      _id: req.params.id,
      user: req.user!._id,
    })
      .populate('developer')
      .populate('fixer')
      .populate('stopBath')
      .populate({
        path: 'filmRolls',
        populate: [
          { path: 'filmStock' },
          { path: 'camera' }
        ]
      });
    
    if (!batch) {
      res.status(404).json({ message: 'One-shot batch not found' });
      return;
    }
    
    res.json({ data: batch });
  } catch (error) {
    console.error('Error fetching one-shot batch:', error);
    res.status(500).json({ message: 'Error fetching one-shot batch' });
  }
});

// POST /api/one-shot-batches - Create a new one-shot batch
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { developer, fixer, stopBath, developedAt, filmRolls, notes } = req.body;
    
    const batch = await OneShotChemicalBatch.create({
      developer,
      fixer,
      stopBath,
      developedAt,
      filmRolls,
      notes,
      user: req.user!._id,
    });
    
    const populatedBatch = await OneShotChemicalBatch.findById(batch._id)
      .populate('developer')
      .populate('fixer')
      .populate('stopBath')
      .populate({
        path: 'filmRolls',
        populate: [
          { path: 'filmStock' },
          { path: 'camera' }
        ]
      });
    
    res.status(201).json({ data: populatedBatch });
  } catch (error: any) {
    console.error('Error creating one-shot batch:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error creating one-shot batch' });
    }
  }
});

// PUT /api/one-shot-batches/:id - Update a one-shot batch
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { developer, fixer, stopBath, developedAt, filmRolls, notes } = req.body;
    
    const batch = await OneShotChemicalBatch.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { developer, fixer, stopBath, developedAt, filmRolls, notes },
      { new: true, runValidators: true }
    )
      .populate('developer')
      .populate('fixer')
      .populate('stopBath')
      .populate({
        path: 'filmRolls',
        populate: [
          { path: 'filmStock' },
          { path: 'camera' }
        ]
      });
    
    if (!batch) {
      res.status(404).json({ message: 'One-shot batch not found' });
      return;
    }
    
    res.json({ data: batch });
  } catch (error: any) {
    console.error('Error updating one-shot batch:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Error updating one-shot batch' });
    }
  }
});

// DELETE /api/one-shot-batches/:id - Delete a one-shot batch
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await OneShotChemicalBatch.findOneAndDelete({
      _id: req.params.id,
      user: req.user!._id,
    });
    
    if (!batch) {
      res.status(404).json({ message: 'One-shot batch not found' });
      return;
    }
    
    res.json({ message: 'One-shot batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting one-shot batch:', error);
    res.status(500).json({ message: 'Error deleting one-shot batch' });
  }
});

export default router;
