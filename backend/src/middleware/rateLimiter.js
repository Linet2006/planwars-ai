import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

/**
 * Standard API rate limiter for regular REST endpoints.
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.generalWindowMs,
  max: config.rateLimit.generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'development',
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Stricter rate limiter specifically protecting LLM generation endpoints
 * against exhaustion, cost inflation, and denial-of-service.
 */
export const llmLimiter = rateLimit({
  windowMs: config.rateLimit.generalWindowMs,
  max: config.rateLimit.llmMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'development',
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'AI generation rate limit reached. Please wait before requesting additional AI operations.'
  }
});

