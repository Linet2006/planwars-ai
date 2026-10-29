/**
 * Event service: Manages event lifecycle, querying, and full plan aggregation.
 */

import crypto from 'crypto';
import { calculateBudgetSummary } from '../utils/budgetMath.js';
import { getDaysRemaining } from '../utils/date.js';
import { getNextUrgentTasks } from '../utils/timelineMath.js';

/**
 * Creates a new event record.
 * @param {import('better-sqlite3').Database} db
 * @param {object} data
 * @returns {object}
 */
export function createEvent(db, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO events (
      id, title, event_type, budget_total, guest_count,
      event_date, location, cultural_context, priorities, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.title,
    data.eventType,
    data.budgetTotal || 0,
    data.guestCount || 1,
    data.eventDate,
    data.location || '',
    data.culturalContext || '',
    data.priorities || '',
    data.status || 'planning',
    now,
    now
  );

  return getEventById(db, id);
}

/**
 * Retrieves an event by its ID.
 * @param {import('better-sqlite3').Database} db
 * @param {string} id
 * @returns {object|null}
 */
export function getEventById(db, id) {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) || null;
}

/**
 * Lists events with pagination.
 * @param {import('better-sqlite3').Database} db
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {object}
 */
export function listEvents(db, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM events').get();
  const events = db
    .prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(safeLimit, offset);

  return {
    events,
    total: totalRow.count,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(totalRow.count / safeLimit)
  };
}

/**
 * Updates event parameters.
 * @param {import('better-sqlite3').Database} db
 * @param {string} id
 * @param {object} updates
 * @returns {object|null}
 */
export function updateEvent(db, id, updates) {
  const existing = getEventById(db, id);
  if (!existing) return null;

  const title = updates.title !== undefined ? updates.title : existing.title;
  const budgetTotal = updates.budgetTotal !== undefined ? updates.budgetTotal : existing.budget_total;
  const guestCount = updates.guestCount !== undefined ? updates.guestCount : existing.guest_count;
  const eventDate = updates.eventDate !== undefined ? updates.eventDate : existing.event_date;
  const location = updates.location !== undefined ? updates.location : existing.location;
  const culturalContext = updates.culturalContext !== undefined ? updates.culturalContext : existing.cultural_context;
  const priorities = updates.priorities !== undefined ? updates.priorities : existing.priorities;
  const status = updates.status !== undefined ? updates.status : existing.status;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE events
    SET title = ?, budget_total = ?, guest_count = ?, event_date = ?,
        location = ?, cultural_context = ?, priorities = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(title, budgetTotal, guestCount, eventDate, location, culturalContext, priorities, status, now, id);

  return getEventById(db, id);
}

/**
 * Deletes an event and cascades child entities.
 * @param {import('better-sqlite3').Database} db
 * @param {string} id
 * @returns {boolean}
 */
export function deleteEvent(db, id) {
  const res = db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return res.changes > 0;
}

/**
 * Aggregates complete event plan with deterministic calculations for dashboard.
 * Efficient: Queries each relation in batch to prevent N+1 queries.
 * @param {import('better-sqlite3').Database} db
 * @param {string} id
 * @returns {object|null}
 */
export function getEventFullPlan(db, id) {
  const event = getEventById(db, id);
  if (!event) return null;

  const budgetRows = db.prepare('SELECT * FROM budget_items WHERE event_id = ?').all(id);
  const tasks = db.prepare('SELECT * FROM tasks WHERE event_id = ? ORDER BY due_date ASC').all(id);
  const taskDeps = db.prepare(`
    SELECT td.task_id, td.depends_on_task_id
    FROM task_dependencies td
    JOIN tasks t ON td.task_id = t.id
    WHERE t.event_id = ?
  `).all(id);

  // Group task dependencies
  const depsMap = new Map();
  taskDeps.forEach((dep) => {
    if (!depsMap.has(dep.task_id)) depsMap.set(dep.task_id, []);
    depsMap.get(dep.task_id).push(dep.depends_on_task_id);
  });

  const hydratedTasks = tasks.map((t) => ({
    ...t,
    depends_on_task_ids: depsMap.get(t.id) || []
  }));

  const vendors = db.prepare('SELECT * FROM vendors WHERE event_id = ?').all(id);
  const ideas = db.prepare('SELECT * FROM ideas WHERE event_id = ?').all(id);

  const budgetSummary = calculateBudgetSummary(event.budget_total, budgetRows, event.guest_count);
  const nextTasks = getNextUrgentTasks(hydratedTasks, 3);
  const daysRemaining = getDaysRemaining(event.event_date);

  return {
    event,
    budget: budgetSummary,
    tasks: hydratedTasks,
    nextTasks,
    daysRemaining,
    vendorsCount: vendors.length,
    ideasCount: ideas.length
  };
}

