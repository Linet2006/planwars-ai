/**
 * Timeline Service: Dependency-aware task management, backward scheduling, and cascading delays.
 */

import crypto from 'crypto';
import { LLMService } from '../llm/llmService.js';
import { buildTimelinePrompt } from '../llm/prompts.js';
import { TimelineTasksSchema } from '../llm/schemas.js';
import { calculateBackScheduledDate, getDaysRemaining, shiftDate } from '../utils/date.js';
import { cascadeTaskDelay, getNextUrgentTasks, sortTasksByDependencies } from '../utils/timelineMath.js';
import { getEventById } from './eventService.js';

/**
 * Gets tasks and dependency relations for an event.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @returns {object|null}
 */
export function getEventTimeline(db, eventId) {
  const event = getEventById(db, eventId);
  if (!event) return null;

  const tasks = db.prepare('SELECT * FROM tasks WHERE event_id = ? ORDER BY due_date ASC').all(eventId);
  const taskDeps = db.prepare(`
    SELECT td.task_id, td.depends_on_task_id
    FROM task_dependencies td
    JOIN tasks t ON td.task_id = t.id
    WHERE t.event_id = ?
  `).all(eventId);

  const depsMap = new Map();
  taskDeps.forEach((d) => {
    if (!depsMap.has(d.task_id)) depsMap.set(d.task_id, []);
    depsMap.get(d.task_id).push(d.depends_on_task_id);
  });

  const hydrated = tasks.map((t) => ({
    ...t,
    depends_on_task_ids: depsMap.get(t.id) || []
  }));

  const sorted = sortTasksByDependencies(hydrated);
  return {
    tasks: sorted,
    nextTasks: getNextUrgentTasks(sorted, 3),
    daysRemaining: getDaysRemaining(event.event_date)
  };
}

/**
 * Adds a new task with dependencies.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} data
 * @returns {object}
 */
export function addTimelineTask(db, eventId, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO tasks (
        id, event_id, title, description, due_date, priority, status, order_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      eventId,
      data.title,
      data.description || '',
      data.dueDate,
      data.priority || 'medium',
      data.status || 'pending',
      data.orderIndex || 0,
      now,
      now
    );

    if (Array.isArray(data.dependsOnTaskIds)) {
      const depStmt = db.prepare(`
        INSERT INTO task_dependencies (id, task_id, depends_on_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const depId of data.dependsOnTaskIds) {
        depStmt.run(crypto.randomUUID(), id, depId, now);
      }
    }
  })();

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * Updates task status or shifts due date, triggering cascading re-dating for downstream tasks.
 * @param {import('better-sqlite3').Database} db
 * @param {string} taskId
 * @param {object} updates
 * @param {string} [updates.status]
 * @param {number} [updates.delayDays]
 * @returns {object|null}
 */
export function updateTaskStatusOrDelay(db, taskId, updates) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return null;

  const now = new Date().toISOString();
  let cascadedUpdates = [];

  db.transaction(() => {
    let newDueDate = task.due_date;
    let newStatus = updates.status !== undefined ? updates.status : task.status;

    if (updates.delayDays && updates.delayDays > 0) {
      newDueDate = shiftDate(task.due_date, updates.delayDays);
      newStatus = 'delayed';

      // Fetch all tasks for this event to calculate downstream cascade
      const allTasks = db.prepare('SELECT * FROM tasks WHERE event_id = ?').all(task.event_id);
      const allDeps = db.prepare(`
        SELECT td.task_id, td.depends_on_task_id
        FROM task_dependencies td
        JOIN tasks t ON td.task_id = t.id
        WHERE t.event_id = ?
      `).all(task.event_id);

      const depMap = new Map();
      allDeps.forEach((d) => {
        if (!depMap.has(d.task_id)) depMap.set(d.task_id, []);
        depMap.get(d.task_id).push(d.depends_on_task_id);
      });

      const hydrated = allTasks.map((t) => ({
        ...t,
        depends_on_task_ids: depMap.get(t.id) || []
      }));

      cascadedUpdates = cascadeTaskDelay(taskId, updates.delayDays, hydrated);

      const updateStmt = db.prepare('UPDATE tasks SET due_date = ?, status = ?, updated_at = ? WHERE id = ?');
      for (const cascade of cascadedUpdates) {
        updateStmt.run(cascade.newDueDate, 'delayed', now, cascade.id);
      }
    }

    db.prepare('UPDATE tasks SET status = ?, due_date = ?, updated_at = ? WHERE id = ?').run(
      newStatus,
      newDueDate,
      now,
      taskId
    );
  })();

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  return {
    task: updatedTask,
    cascadedUpdates
  };
}

/**
 * Generates an AI-backed backward timeline from the event date.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} [options]
 * @param {LLMService} [options.llmService]
 * @param {boolean} [options.overwrite=false]
 * @returns {Promise<object>}
 */
export async function generateAITimeline(db, eventId, { llmService, overwrite = false } = {}) {
  const event = getEventById(db, eventId);
  if (!event) throw new Error('Event not found');

  const existing = db.prepare('SELECT * FROM tasks WHERE event_id = ?').all(eventId);
  if (existing.length > 0 && !overwrite) {
    return getEventTimeline(db, eventId);
  }

  const service = llmService || new LLMService({ db });
  const prompt = buildTimelinePrompt(event);

  const fallback = {
    tasks: [
      { title: 'Lock Primary Venue', description: 'Confirm venue and pay token deposit', daysBeforeEvent: 90, priority: 'high', dependsOnTitles: [] },
      { title: 'Book Main Caterer', description: 'Select meal courses and confirm per-plate rates', daysBeforeEvent: 60, priority: 'high', dependsOnTitles: ['Lock Primary Venue'] },
      { title: 'Send Invitations', description: 'Finalize guest list and dispatch invites', daysBeforeEvent: 30, priority: 'high', dependsOnTitles: ['Lock Primary Venue'] },
      { title: 'Final Coordination & Rehearsal', description: 'Verify all vendor arrival schedules', daysBeforeEvent: 3, priority: 'high', dependsOnTitles: ['Book Main Caterer'] }
    ]
  };

  const aiResult = await service.generateStructured({
    promptType: 'timeline_generation',
    promptText: prompt,
    cachePayload: { eventId, date: event.event_date, eventType: event.event_type },
    schema: TimelineTasksSchema,
    fallback
  });

  db.transaction(() => {
    if (overwrite) {
      db.prepare('DELETE FROM tasks WHERE event_id = ?').run(eventId);
    }

    const titleToId = new Map();
    const taskInsert = db.prepare(`
      INSERT INTO tasks (
        id, event_id, title, description, due_date, priority, status, order_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    aiResult.tasks.forEach((t, index) => {
      const taskId = crypto.randomUUID();
      titleToId.set(t.title, taskId);
      const dueDate = calculateBackScheduledDate(event.event_date, t.daysBeforeEvent);
      taskInsert.run(taskId, eventId, t.title, t.description, dueDate, t.priority, 'pending', index, now, now);
    });

    const depInsert = db.prepare(`
      INSERT INTO task_dependencies (id, task_id, depends_on_task_id, created_at)
      VALUES (?, ?, ?, ?)
    `);

    aiResult.tasks.forEach((t) => {
      const currentId = titleToId.get(t.title);
      (t.dependsOnTitles || []).forEach((depTitle) => {
        const depId = titleToId.get(depTitle);
        if (depId && depId !== currentId) {
          depInsert.run(crypto.randomUUID(), currentId, depId, now);
        }
      });
    });
  })();

  return getEventTimeline(db, eventId);
}
