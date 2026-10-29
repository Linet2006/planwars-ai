/**
 * Re-plan Service: Key differentiator handling "+50 guests, lower budget, event 2 weeks earlier".
 * Generates structured trade-offs and updates the plan in place without restarting.
 */

import { LLMService } from '../llm/llmService.js';
import { buildReplanTradeoffsPrompt } from '../llm/prompts.js';
import { ReplanTradeoffsSchema } from '../llm/schemas.js';
import { calculateBudgetSummary } from '../utils/budgetMath.js';
import { shiftDate } from '../utils/date.js';
import { calculateBudgetItemDiff, calculateConstraintDiff } from '../utils/planDiff.js';
import { getEventById, updateEvent } from './eventService.js';

/**
 * Evaluates requested plan changes, returns constraint diff and 2-3 structured trade-off options.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} changeRequest - { guestCount, budgetTotal, eventDate, notes }
 * @param {object} [options]
 * @param {LLMService} [options.llmService]
 * @returns {Promise<object>}
 */
export async function evaluateReplan(db, eventId, changeRequest, { llmService } = {}) {
  const event = getEventById(db, eventId);
  if (!event) throw new Error('Event not found');

  const budgetItems = db.prepare('SELECT * FROM budget_items WHERE event_id = ?').all(eventId);
  const tasks = db.prepare('SELECT * FROM tasks WHERE event_id = ?').all(eventId);

  const budgetSummary = calculateBudgetSummary(event.budget_total, budgetItems, event.guest_count);

  const constraintDiff = calculateConstraintDiff(
    {
      guestCount: event.guest_count,
      budgetTotal: event.budget_total,
      eventDate: event.event_date
    },
    changeRequest
  );

  const service = llmService || new LLMService({ db });
  const prompt = buildReplanTradeoffsPrompt({
    currentPlan: {
      budgetTotal: event.budget_total,
      guestCount: event.guest_count,
      eventDate: event.event_date,
      budgetItems: budgetSummary.items,
      tasks
    },
    changeRequest
  });

  const fallback = {
    analysis: 'Changes require balancing higher guest count with reduced overall funds and an accelerated timeline.',
    options: [
      {
        id: 'opt-menu-favors',
        title: 'Optimize Menu & Streamline Favors',
        description: 'Reduce course count to 4 signature dishes and replace custom luxury favors with digital/seed packets.',
        strategy: 'Protects main venue hospitality while absorbing guest growth.',
        budgetAdjustments: [
          { category: 'Decor & Floral', newPercentage: 10, reason: 'Transition to seasonal marigolds & ambient warm lighting' }
        ],
        timelineAdjustmentDays: constraintDiff.timeline.daysShifted,
        consequences: [
          `Accommodates ${changeRequest.guestCount || event.guest_count} guests within budget`,
          'Venue and caterer must be finalized 7 days earlier'
        ]
      },
      {
        id: 'opt-format-pivot',
        title: 'Format Pivot to Interactive Stalls',
        description: 'Replace heavy seated buffet with interactive live food counters and curated playlist.',
        strategy: 'Lowers service staffing overhead and frees money for additional attendees.',
        budgetAdjustments: [
          { category: 'Music & Entertainment', newPercentage: 3, reason: 'Curated sound system rather than large ensemble' }
        ],
        timelineAdjustmentDays: constraintDiff.timeline.daysShifted,
        consequences: [
          'Frees ₹50,000 to maintain per-guest hospitality standards',
          'Faster vendor setup on event morning'
        ]
      }
    ]
  };

  const aiResult = await service.generateStructured({
    promptType: 'replan_tradeoffs',
    promptText: prompt,
    cachePayload: { eventId, changeRequest },
    schema: ReplanTradeoffsSchema,
    fallback
  });

  // Calculate projected budget diff for each option
  const evaluatedOptions = aiResult.options.map((opt) => {
    const newTotal = changeRequest.budgetTotal !== undefined ? changeRequest.budgetTotal : event.budget_total;
    const projectedItems = budgetSummary.items.map((item) => {
      const adjustment = opt.budgetAdjustments.find((a) => a.category.toLowerCase() === item.category.toLowerCase());
      const newEstimated = adjustment ? Math.round((adjustment.newPercentage / 100) * newTotal) : item.estimated_amount;
      return {
        category: item.category,
        estimated_amount: newEstimated
      };
    });

    const itemDiff = calculateBudgetItemDiff(budgetSummary.items, projectedItems);

    return {
      ...opt,
      projectedBudgetDiff: itemDiff
    };
  });

  return {
    constraintDiff,
    analysis: aiResult.analysis,
    options: evaluatedOptions
  };
}

/**
 * Applies a selected trade-off option to update the plan in-place without restarting.
 * @param {import('better-sqlite3').Database} db
 * @param {string} eventId
 * @param {object} payload
 * @returns {object}
 */
export function applyReplanOption(db, eventId, payload) {
  const { guestCount, budgetTotal, eventDate, budgetAdjustments = [], timelineAdjustmentDays = 0 } = payload;

  const event = getEventById(db, eventId);
  if (!event) throw new Error('Event not found');

  db.transaction(() => {
    // 1. Update event core metadata
    updateEvent(db, eventId, {
      guestCount,
      budgetTotal,
      eventDate
    });

    // 2. Adjust budget items that are NOT confirmed (protect user-confirmed actual costs)
    if (budgetAdjustments.length > 0) {
      const updateStmt = db.prepare(`
        UPDATE budget_items
        SET estimated_amount = ?, notes = ?, updated_at = ?
        WHERE event_id = ? AND category = ? AND is_confirmed = 0
      `);

      const now = new Date().toISOString();
      for (const adj of budgetAdjustments) {
        const newEstimated = Math.round((adj.newPercentage / 100) * budgetTotal);
        updateStmt.run(newEstimated, `AI Replan: ${adj.reason}`, now, eventId, adj.category);
      }
    }

    // 3. Shift timeline tasks if event date shifted
    if (timelineAdjustmentDays !== 0) {
      const tasks = db.prepare('SELECT id, due_date FROM tasks WHERE event_id = ?').all(eventId);
      const shiftStmt = db.prepare('UPDATE tasks SET due_date = ?, updated_at = ? WHERE id = ?');
      const now = new Date().toISOString();

      for (const t of tasks) {
        const shiftedDueDate = shiftDate(t.due_date, timelineAdjustmentDays);
        shiftStmt.run(shiftedDueDate, now, t.id);
      }
    }
  })();

  const updatedItems = db.prepare('SELECT * FROM budget_items WHERE event_id = ?').all(eventId);
  const updatedTasks = db.prepare('SELECT * FROM tasks WHERE event_id = ? ORDER BY due_date ASC').all(eventId);

  return {
    success: true,
    message: 'Plan successfully revised with selected trade-off strategy',
    event: getEventById(db, eventId),
    budget: calculateBudgetSummary(budgetTotal, updatedItems, guestCount),
    tasksCount: updatedTasks.length
  };
}
