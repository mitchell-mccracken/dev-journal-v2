import { Router, Request, Response } from 'express';
import { GenericChemical } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/generic-chemicals - Get all chemicals for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chemicals = await GenericChemical.find({ user: req.user!._id })
      .sort({ type: 1, name: 1 });
    res.json({ data: chemicals });
  } catch (error) {
    console.error('Error fetching chemicals:', error);
    res.status(500).json({ message: 'Error fetching chemicals' });
  }
});

// POST /api/generic-chemicals - Create a new chemical
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ratio, type, expirationDate, notes } = req.body;
    
    const chemical = await GenericChemical.create({
      name,
      ratio,
      type,
      expirationDate,
      notes,
      user: req.user!._id,
    });
    
    res.status(201).json({ data: chemical });
  } catch (error: any) {
    console.error('Error creating chemical:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Chemical with this name and ratio already exists' });
    } else {
      res.status(500).json({ message: 'Error creating chemical' });
    }
  }
});

// PUT /api/generic-chemicals/:id - Update a chemical
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ratio, type, expirationDate, notes } = req.body;
    
    const chemical = await GenericChemical.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { name, ratio, type, expirationDate, notes },
      { new: true, runValidators: true }
    );
    
    if (!chemical) {
      res.status(404).json({ message: 'Chemical not found' });
      return;
    }
    
    res.json({ data: chemical });
  } catch (error: any) {
    console.error('Error updating chemical:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Chemical with this name and ratio already exists' });
    } else {
      res.status(500).json({ message: 'Error updating chemical' });
    }
  }
});

// DELETE /api/generic-chemicals/:id - Delete a chemical
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chemical = await GenericChemical.findOneAndDelete({
      _id: req.params.id,
      user: req.user!._id,
    });
    
    if (!chemical) {
      res.status(404).json({ message: 'Chemical not found' });
      return;
    }
    
    res.json({ message: 'Chemical deleted successfully' });
  } catch (error) {
    console.error('Error deleting chemical:', error);
    res.status(500).json({ message: 'Error deleting chemical' });
  }
});

export default router;