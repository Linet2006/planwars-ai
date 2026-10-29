import { Router } from 'express';
import { z } from 'zod';
import { llmLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import * as intakeService from '../services/intakeService.js';

export function createIntakeRouter(db, llmService) {
  const router = Router();

  const IntakeChatSchema = z.object({
    eventId: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    partialData: z
      .object({
        title: z.string().optional(),
        eventType: z.enum(['wedding', 'birthday', 'community']).optional(),
        budgetTotal: z.number().nonnegative().optional(),
        guestCount: z.number().int().positive().optional(),
        eventDate: z.string().optional(),
        location: z.string().optional(),
        priorities: z.string().optional()
      })
      .optional()
  });

  const InitializePlanSchema = z.object({
    title: z.string().min(1),
    eventType: z.enum(['wedding', 'birthday', 'community']),
    budgetTotal: z.number().nonnegative(),
    guestCount: z.number().int().positive(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    location: z.string().optional(),
    culturalContext: z.string().optional(),
    priorities: z.string().optional()
  });

  // Guided intake chat
  router.post('/chat', llmLimiter, validateRequest({ body: IntakeChatSchema }), async (req, res, next) => {
    try {
      const response = await intakeService.processIntakeMessage(db, req.body, { llmService });
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // Initialize full plan from intake
  router.post('/initialize', llmLimiter, validateRequest({ body: InitializePlanSchema }), async (req, res, next) => {
    try {
      const fullPlan = await intakeService.initializeCompletePlan(db, req.body, { llmService });
      res.status(201).json(fullPlan);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
