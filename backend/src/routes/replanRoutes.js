import { Router } from 'express';
import { z } from 'zod';
import { llmLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import * as replanService from '../services/replanService.js';

export function createReplanRouter(db, llmService) {
  const router = Router({ mergeParams: true });

  const EvaluateReplanSchema = z.object({
    guestCount: z.number().int().positive().optional(),
    budgetTotal: z.number().nonnegative().optional(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().optional()
  });

  const ApplyReplanSchema = z.object({
    optionId: z.string().min(1),
    guestCount: z.number().int().positive(),
    budgetTotal: z.number().nonnegative(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    budgetAdjustments: z
      .array(
        z.object({
          category: z.string(),
          newPercentage: z.number().min(0).max(100),
          reason: z.string()
        })
      )
      .optional(),
    timelineAdjustmentDays: z.number().int().optional()
  });

  // Evaluate trade-offs for proposed changes
  router.post('/evaluate', llmLimiter, validateRequest({ body: EvaluateReplanSchema }), async (req, res, next) => {
    try {
      const evaluation = await replanService.evaluateReplan(db, req.params.id, req.body, { llmService });
      res.json(evaluation);
    } catch (err) {
      next(err);
    }
  });

  // Apply chosen trade-off option
  router.post('/apply', validateRequest({ body: ApplyReplanSchema }), (req, res, next) => {
    try {
      const result = replanService.applyReplanOption(db, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

