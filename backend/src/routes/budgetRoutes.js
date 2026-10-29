import { Router } from 'express';
import { z } from 'zod';
import { llmLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import * as budgetService from '../services/budgetService.js';

export function createBudgetRouter(db, llmService) {
  const router = Router({ mergeParams: true });

  const AddItemSchema = z.object({
    category: z.string().min(1, 'Category name is required'),
    estimatedAmount: z.number().nonnegative(),
    actualAmount: z.number().nonnegative().nullable().optional(),
    isConfirmed: z.boolean().optional(),
    notes: z.string().optional()
  });

  const UpdateItemSchema = z.object({
    category: z.string().min(1).optional(),
    estimatedAmount: z.number().nonnegative().optional(),
    actualAmount: z.number().nonnegative().nullable().optional(),
    isConfirmed: z.boolean().optional(),
    notes: z.string().optional()
  });

  // Get budget breakdown & summary
  router.get('/', (req, res, next) => {
    try {
      const budget = budgetService.getEventBudget(db, req.params.id);
      if (!budget) return res.status(404).json({ error: 'Event not found' });
      res.json(budget);
    } catch (err) {
      next(err);
    }
  });

  // Add custom item
  router.post('/', validateRequest({ body: AddItemSchema }), (req, res, next) => {
    try {
      const item = budgetService.addBudgetItem(db, req.params.id, req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  // Update item (confirm actual cost)
  router.patch('/:itemId', validateRequest({ body: UpdateItemSchema }), (req, res, next) => {
    try {
      const item = budgetService.updateBudgetItem(db, req.params.itemId, req.body);
      if (!item) return res.status(404).json({ error: 'Budget item not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  // Delete item
  router.delete('/:itemId', (req, res, next) => {
    try {
      const success = budgetService.deleteBudgetItem(db, req.params.itemId);
      if (!success) return res.status(404).json({ error: 'Budget item not found' });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // AI-generated budget allocation
  router.post('/generate', llmLimiter, async (req, res, next) => {
    try {
      const overwrite = Boolean(req.body.overwrite);
      const result = await budgetService.generateAIBudgetAllocation(db, req.params.id, {
        llmService,
        overwrite
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
