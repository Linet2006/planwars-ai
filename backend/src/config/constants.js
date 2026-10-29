/**
 * Application constants and configuration defaults.
 * Adheres to rule: No magic numbers.
 */

export const EVENT_TYPES = Object.freeze({
  WEDDING: 'wedding',
  BIRTHDAY: 'birthday',
  COMMUNITY: 'community'
});

export const EVENT_STATUS = Object.freeze({
  PLANNING: 'planning',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
});

export const TASK_PRIORITIES = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
});

export const TASK_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed'
});

export const VENDOR_STATUS = Object.freeze({
  RESEARCHING: 'researching',
  CONTACTED: 'contacted',
  QUOTED: 'quoted',
  BOOKED: 'booked',
  DECLINED: 'declined'
});

export const CACHE_CONFIG = Object.freeze({
  MAX_ENTRIES: 500,
  TTL_SECONDS: 24 * 60 * 60 // 24 hours
});

export const RATE_LIMITS = Object.freeze({
  GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 mins
  GENERAL_MAX_REQUESTS: 100,
  LLM_WINDOW_MS: 15 * 60 * 1000,
  LLM_MAX_REQUESTS: 30
});

export const BUDGET_DEFAULTS = Object.freeze({
  OVER_BUDGET_THRESHOLD_PERCENT: 100, // alert when > 100% of budget
  WARNING_THRESHOLD_PERCENT: 90
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
});
