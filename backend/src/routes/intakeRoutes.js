import { Router } from 'express';
import { z } from 'zod';
import { llmLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import * as intakeService from '../services/intakeService.js';
import { normalizeDateToISO } from '../utils/date.js';

export function createIntakeRouter(db, llmService) {
  const router = Router();

  const IntakeChatSchema = z.object({
    eventId: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    history: z
      .array(
        z.object({
          sender: z.string(),
          content: z.string()
        })
      )
      .optional(),
    partialData: z
      .object({
        title: z.string().optional(),
        eventType: z.enum(['wedding', 'birthday', 'community', '']).optional(),
        budgetTotal: z.union([z.number(), z.string()]).optional().nullable(),
        guestCount: z.union([z.number(), z.string()]).optional().nullable(),
        eventDate: z.string().optional(),
        location: z.string().optional(),
        priorities: z.string().optional()
      })
      .optional()
  });

  const InitializePlanSchema = z.object({
    title: z.string().min(1).optional(),
    eventType: z.enum(['wedding', 'birthday', 'community']).default('birthday'),
    budgetTotal: z.union([z.number(), z.string()]).transform((v) => Number(v) || 20000),
    guestCount: z.union([z.number(), z.string()]).transform((v) => Number(v) || 20),
    eventDate: z.string().optional(),
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
      const rawDate = req.body.eventDate || '';
      const eventDate = normalizeDateToISO(rawDate) || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const typeStr = req.body.eventType || 'birthday';
      const title = req.body.title || `${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} Celebration`;

      const fullPlan = await intakeService.initializeCompletePlan(
        db,
        {
          ...req.body,
          title,
          eventType: typeStr,
          eventDate,
          location: req.body.location || 'India',
          priorities: req.body.priorities || 'Warm hospitality & celebration'
        },
        { llmService }
      );
      res.status(201).json(fullPlan);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

