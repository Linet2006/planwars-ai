import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.js';
import * as eventService from '../services/eventService.js';

export function createEventRouter(db) {
  const router = Router();

  const CreateEventSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    eventType: z.enum(['wedding', 'birthday', 'community']),
    budgetTotal: z.number().nonnegative(),
    guestCount: z.number().int().positive(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    location: z.string().optional(),
    culturalContext: z.string().optional(),
    priorities: z.string().optional()
  });

  const UpdateEventSchema = z.object({
    title: z.string().min(1).optional(),
    budgetTotal: z.number().nonnegative().optional(),
    guestCount: z.number().int().positive().optional(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    location: z.string().optional(),
    culturalContext: z.string().optional(),
    priorities: z.string().optional(),
    status: z.enum(['planning', 'confirmed', 'completed', 'archived']).optional()
  });

  // Create event
  router.post('/', validateRequest({ body: CreateEventSchema }), (req, res, next) => {
    try {
      const event = eventService.createEvent(db, req.body);
      res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  });

  // List events (paginated)
  router.get('/', (req, res, next) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const result = eventService.listEvents(db, { page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // Get full plan
  router.get('/:id', (req, res, next) => {
    try {
      const plan = eventService.getEventFullPlan(db, req.params.id);
      if (!plan) return res.status(404).json({ error: 'Event not found' });
      res.json(plan);
    } catch (err) {
      next(err);
    }
  });

  // Update event
  router.patch('/:id', validateRequest({ body: UpdateEventSchema }), (req, res, next) => {
    try {
      const updated = eventService.updateEvent(db, req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Event not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Delete event
  router.delete('/:id', (req, res, next) => {
    try {
      const success = eventService.deleteEvent(db, req.params.id);
      if (!success) return res.status(404).json({ error: 'Event not found' });
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

