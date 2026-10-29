import { Router } from 'express';
import { z } from 'zod';
import { llmLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import * as timelineService from '../services/timelineService.js';

export function createTimelineRouter(db, llmService) {
  const router = Router({ mergeParams: true });

  const AddTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    dependsOnTaskIds: z.array(z.string()).optional()
  });

  const UpdateTaskSchema = z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).optional(),
    delayDays: z.number().int().positive().optional()
  });

  // Get timeline
  router.get('/', (req, res, next) => {
    try {
      const timeline = timelineService.getEventTimeline(db, req.params.id);
      if (!timeline) return res.status(404).json({ error: 'Event not found' });
      res.json(timeline);
    } catch (err) {
      next(err);
    }
  });

  // Add task
  router.post('/', validateRequest({ body: AddTaskSchema }), (req, res, next) => {
    try {
      const task = timelineService.addTimelineTask(db, req.params.id, req.body);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  });

  // Update task status or delay (auto-cascades downstream dependencies)
  router.patch('/:taskId', validateRequest({ body: UpdateTaskSchema }), (req, res, next) => {
    try {
      const result = timelineService.updateTaskStatusOrDelay(db, req.params.taskId, req.body);
      if (!result) return res.status(404).json({ error: 'Task not found' });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // AI generate backward timeline
  router.post('/generate', llmLimiter, async (req, res, next) => {
    try {
      const overwrite = Boolean(req.body.overwrite);
      const result = await timelineService.generateAITimeline(db, req.params.id, {
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

