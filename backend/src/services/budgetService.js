/**
 * Budget Service: Deterministic allocation, item updates, and LLM category proposal.
 */

import crypto from 'crypto';
import { LLMService } from '../llm/llmService.js';
import { buildBudgetAllocationPrompt } from '../llm/prompts.js';
import { BudgetAllocationSchema } from '../llm/schemas.js';
import {
  calculateBudgetSummary,
  deriveAllocationsFromPercentages
} from '../utils/budgetMath.js';
import { getEventById } from './eventService.js';

/**
 * Gets budget items and calculated summary for an event.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @returns {object|null}
 */
export function getEventBudget(db, eventId) {
  const event = getEventById(db, eventId);
  if (!event) return null;

  const items = db.prepare('SELECT * FROM budget_items WHERE event_id = ? ORDER BY estimated_amount DESC').all(eventId);
  return calculateBudgetSummary(event.budget_total, items, event.guest_count);
}

/**
 * Adds a new budget item.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} data
 * @returns {object}
 */
export function addBudgetItem(db, eventId, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO budget_items (
      id, event_id, category, estimated_amount, actual_amount, is_confirmed, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    eventId,
    data.category,
    data.estimatedAmount || 0,
    data.actualAmount !== undefined ? data.actualAmount : null,
    data.isConfirmed ? 1 : 0,
    data.notes || '',
    now,
    now
  );

  return db.prepare('SELECT * FROM budget_items WHERE id = ?').get(id);
}

/**
 * Updates a budget item (e.g. entering actual cost, toggling confirmed status).
 * @param {import('better-sqlite3').Database} db
 * @param {string} itemId
 * @param {object} updates
 * @returns {object|null}
 */
export function updateBudgetItem(db, itemId, updates) {
  const existing = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(itemId);
  if (!existing) return null;

  const category = updates.category !== undefined ? updates.category : existing.category;
  const estimatedAmount = updates.estimatedAmount !== undefined ? updates.estimatedAmount : existing.estimated_amount;
  const actualAmount = updates.actualAmount !== undefined ? updates.actualAmount : existing.actual_amount;
  const isConfirmed = updates.isConfirmed !== undefined ? (updates.isConfirmed ? 1 : 0) : existing.is_confirmed;
  const notes = updates.notes !== undefined ? updates.notes : existing.notes;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE budget_items
    SET category = ?, estimated_amount = ?, actual_amount = ?, is_confirmed = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(category, estimatedAmount, actualAmount, isConfirmed, notes, now, itemId);

  return db.prepare('SELECT * FROM budget_items WHERE id = ?').get(itemId);
}

/**
 * Deletes a budget item.
 * @param {import('better-sqlite3').Database} db
 * @param {string} itemId
 * @returns {boolean}
 */
export function deleteBudgetItem(db, itemId) {
  const res = db.prepare('DELETE FROM budget_items WHERE id = ?').run(itemId);
  return res.changes > 0;
}

/**
 * Uses LLM to propose realistic category percentage splits and calculates exact rupee figures.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} [options]
 * @param {LLMService} [options.llmService]
 * @param {boolean} [options.overwrite=false]
 * @returns {Promise<object>}
 */
export async function generateAIBudgetAllocation(db, eventId, { llmService, overwrite = false } = {}) {
  const event = getEventById(db, eventId);
  if (!event) throw new Error('Event not found');

  const existingItems = db.prepare('SELECT * FROM budget_items WHERE event_id = ?').all(eventId);
  if (existingItems.length > 0 && !overwrite) {
    return {
      message: 'Budget items already exist',
      summary: calculateBudgetSummary(event.budget_total, existingItems, event.guest_count)
    };
  }

  const service = llmService || new LLMService({ db });
  const prompt = buildBudgetAllocationPrompt(event);

  const fallback = {
    rationale: 'Standard baseline distribution based on event type',
    categories: [
      { category: 'Venue & Logistics', percentage: 35, reasoning: 'Core location rental' },
      { category: 'Catering & Beverages', percentage: 35, reasoning: 'Food and drink services' },
      { category: 'Decor & Production', percentage: 15, reasoning: 'Theme and ambience' },
      { category: 'Entertainment / Media', percentage: 10, reasoning: 'Photography and audio' },
      { category: 'Contingency Buffer', percentage: 5, reasoning: 'Unforeseen costs' }
    ]
  };

  const aiResult = await service.generateStructured({
    promptType: 'budget_allocation',
    promptText: prompt,
    cachePayload: { eventId, budgetTotal: event.budget_total, guestCount: event.guest_count },
    schema: BudgetAllocationSchema,
    fallback
  });

  // Pure deterministic arithmetic: Map AI percentages to exact rupee values matching event.budget_total
  const allocatedCategories = deriveAllocationsFromPercentages(event.budget_total, aiResult.categories);

  db.transaction(() => {
    if (overwrite) {
      db.prepare('DELETE FROM budget_items WHERE event_id = ?').run(eventId);
    }
    const insertStmt = db.prepare(`
      INSERT INTO budget_items (
        id, event_id, category, estimated_amount, actual_amount, is_confirmed, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const cat of allocatedCategories) {
      insertStmt.run(crypto.randomUUID(), eventId, cat.category, cat.estimated_amount, null, 0, cat.reasoning, now, now);
    }
  })();

  const items = db.prepare('SELECT * FROM budget_items WHERE event_id = ?').all(eventId);
  return {
    rationale: aiResult.rationale,
    summary: calculateBudgetSummary(event.budget_total, items, event.guest_count)
  };
}
