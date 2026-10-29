import { Router } from 'express';
import { z } from 'zod';
import { llmLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import * as ideaService from '../services/ideaService.js';

export function createIdeaRouter(db, llmService) {
  const router = Router({ mergeParams: true });

  const GenerateIdeasSchema = z.object({
    focusArea: z.string().optional()
  });

  const RefineIdeaSchema = z.object({
    ideaId: z.string().min(1),
    instruction: z.string().min(3, 'Instruction must be at least 3 characters')
  });

  // Get ideas
  router.get('/', (req, res, next) => {
    try {
      const filters = {
        category: req.query.category,
        savedOnly: req.query.savedOnly === 'true'
      };
      const ideas = ideaService.getIdeas(db, req.params.id, filters);
      res.json(ideas);
    } catch (err) {
      next(err);
    }
  });

  // Generate personalized ideas
  router.post('/generate', llmLimiter, validateRequest({ body: GenerateIdeasSchema }), async (req, res, next) => {
    try {
      const ideas = await ideaService.generatePersonalizedIdeas(db, req.params.id, {
        focusArea: req.body.focusArea,
        llmService
      });
      res.json(ideas);
    } catch (err) {
      next(err);
    }
  });

  // Refine idea (chat feedback)
  router.post('/refine', llmLimiter, validateRequest({ body: RefineIdeaSchema }), async (req, res, next) => {
    try {
      const refined = await ideaService.refineIdea(db, req.params.id, {
        ideaId: req.body.ideaId,
        instruction: req.body.instruction,
        llmService
      });
      res.json(refined);
    } catch (err) {
      next(err);
    }
  });

  // Toggle save idea
  router.patch('/:ideaId', (req, res, next) => {
    try {
      const isSaved = Boolean(req.body.isSaved);
      const updated = ideaService.toggleSaveIdea(db, req.params.ideaId, isSaved);
      if (!updated) return res.status(404).json({ error: 'Idea not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

