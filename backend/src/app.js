import express from 'express';
import { getDatabase } from './db/index.js';
import { LLMService } from './llm/llmService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { setupSecurityMiddleware } from './middleware/security.js';
import { createBudgetRouter } from './routes/budgetRoutes.js';
import { createEventRouter } from './routes/eventRoutes.js';
import { healthRouter } from './routes/healthRoutes.js';
import { createIdeaRouter } from './routes/ideaRoutes.js';
import { createIntakeRouter } from './routes/intakeRoutes.js';
import { createReplanRouter } from './routes/replanRoutes.js';
import { createTimelineRouter } from './routes/timelineRoutes.js';
import { createVendorRouter } from './routes/vendorRoutes.js';

/**
 * Creates and configures the Express application.
 * Accepts optional db and llmService overrides for dependency injection during testing.
 * @param {object} [deps]
 * @param {import('better-sqlite3').Database} [deps.db]
 * @param {LLMService} [deps.llmService]
 * @returns {import('express').Express}
 */
export function createApp(deps = {}) {
  const app = express();
  const db = deps.db || getDatabase();
  const llmService = deps.llmService || new LLMService({ db });

  // Security headers, CORS, body size limit
  setupSecurityMiddleware(app);

  // Global rate limiter
  app.use('/api', generalLimiter);

  // Health route
  app.use('/api', healthRouter);

  // Intake routes
  app.use('/api/intake', createIntakeRouter(db, llmService));

  // Events root
  app.use('/api/events', createEventRouter(db));

  // Sub-resource routers mounted on /api/events/:id/...
  app.use('/api/events/:id/budget', createBudgetRouter(db, llmService));
  app.use('/api/events/:id/timeline', createTimelineRouter(db, llmService));
  app.use('/api/events/:id/vendors', createVendorRouter(db, llmService));
  app.use('/api/events/:id/ideas', createIdeaRouter(db, llmService));
  app.use('/api/events/:id/replan', createReplanRouter(db, llmService));

  // 404 Handler
  app.use((_req, res) => {
    res.status(404).json({
      status: 404,
      error: 'Not Found',
      message: 'The requested API endpoint does not exist'
    });
  });

  // Centralized Error Handler (never leaks stack traces in production)
  app.use(errorHandler);

  return app;
}

