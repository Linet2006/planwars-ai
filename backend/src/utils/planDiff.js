/**
 * Pure deterministic plan diffing engine.
 * Computes structured delta between current plan and revised plan.
 */

import { formatINR } from './currency.js';
import { getDaysDifference, formatDateDDMMYYYY } from './date.js';

/**
 * Compares current event plan parameters against new constraints.
 * @param {object} currentPlan - { guestCount, budgetTotal, eventDate }
 * @param {object} newParams - { guestCount, budgetTotal, eventDate }
 * @returns {object} High-level constraint diff
 */
export function calculateConstraintDiff(currentPlan, newParams) {
  const oldGuests = currentPlan.guestCount || 0;
  const newGuests = newParams.guestCount !== undefined ? newParams.guestCount : oldGuests;
  const guestDelta = newGuests - oldGuests;

  const oldBudget = currentPlan.budgetTotal || 0;
  const newBudget = newParams.budgetTotal !== undefined ? newParams.budgetTotal : oldBudget;
  const budgetDelta = newBudget - oldBudget;

  const oldDate = currentPlan.eventDate;
  const newDate = newParams.eventDate || oldDate;
  const daysShifted = getDaysDifference(oldDate, newDate);

  const oldPerGuest = oldGuests > 0 ? Math.round(oldBudget / oldGuests) : 0;
  const newPerGuest = newGuests > 0 ? Math.round(newBudget / newGuests) : 0;
  const perGuestDelta = newPerGuest - oldPerGuest;

  return {
    guests: {
      before: oldGuests,
      after: newGuests,
      delta: guestDelta,
      label: guestDelta === 0 ? 'Unchanged' : `${guestDelta > 0 ? '+' : ''}${guestDelta} guests`
    },
    budget: {
      before: oldBudget,
      after: newBudget,
      delta: budgetDelta,
      formattedBefore: formatINR(oldBudget),
      formattedAfter: formatINR(newBudget),
      formattedDelta: `${budgetDelta > 0 ? '+' : ''}${formatINR(budgetDelta)}`,
      label: budgetDelta === 0 ? 'Unchanged' : `${budgetDelta > 0 ? '+' : ''}${formatINR(budgetDelta)}`
    },
    perGuest: {
      before: oldPerGuest,
      after: newPerGuest,
      delta: perGuestDelta,
      formattedBefore: formatINR(oldPerGuest),
      formattedAfter: formatINR(newPerGuest),
      label: `${perGuestDelta > 0 ? '+' : ''}${formatINR(perGuestDelta)} / guest`
    },
    timeline: {
      beforeDate: formatDateDDMMYYYY(oldDate),
      afterDate: formatDateDDMMYYYY(newDate),
      daysShifted,
      label:
        daysShifted === 0
          ? 'Same date'
          : `${Math.abs(daysShifted)} days ${daysShifted > 0 ? 'later' : 'earlier'}`
    }
  };
}

/**
 * Computes category-by-category diff between old allocations and proposed allocations.
 * @param {Array<{ category: string, estimated_amount: number }>} oldItems
 * @param {Array<{ category: string, estimated_amount: number }>} newItems
 * @returns {Array<object>} Itemized delta
 */
export function calculateBudgetItemDiff(oldItems = [], newItems = []) {
  const oldMap = new Map(oldItems.map((item) => [item.category, item.estimated_amount || 0]));
  const allCategories = new Set([
    ...oldItems.map((i) => i.category),
    ...newItems.map((i) => i.category)
  ]);

  const diffs = [];
  for (const cat of allCategories) {
    const before = oldMap.get(cat) || 0;
    const newItem = newItems.find((i) => i.category === cat);
    const after = newItem ? newItem.estimated_amount : 0;
    const delta = after - before;
    const pctChange = before > 0 ? ((delta / before) * 100).toFixed(1) : 100;

    diffs.push({
      category: cat,
      before,
      after,
      delta,
      formattedBefore: formatINR(before),
      formattedAfter: formatINR(after),
      formattedDelta: `${delta > 0 ? '+' : ''}${formatINR(delta)}`,
      percentChange: Number(pctChange),
      isCut: delta < 0,
      isIncrease: delta > 0,
      isUnchanged: delta === 0
    });
  }

  return diffs;
}
