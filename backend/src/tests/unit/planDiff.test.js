import { describe, expect, it } from 'vitest';
import { calculateBudgetItemDiff, calculateConstraintDiff } from '../../utils/planDiff.js';

describe('Plan Diff Utility (Constraint & Budget Changes)', () => {
  it('calculates constraint differences between current plan and revision', () => {
    const current = {
      guestCount: 350,
      budgetTotal: 2500000,
      eventDate: '2026-12-15'
    };
    const revision = {
      guestCount: 400, // +50 guests
      budgetTotal: 2300000, // -₹2,00,000
      eventDate: '2026-12-01' // 14 days earlier
    };

    const diff = calculateConstraintDiff(current, revision);

    expect(diff.guests.delta).toBe(50);
    expect(diff.guests.label).toBe('+50 guests');

    expect(diff.budget.delta).toBe(-200000);
    expect(diff.budget.formattedDelta).toBe('-₹2,00,000');

    expect(diff.timeline.daysShifted).toBe(-14);
    expect(diff.timeline.label).toBe('14 days earlier');
  });

  it('calculates category-by-category budget item deltas', () => {
    const oldItems = [
      { category: 'Venue', estimated_amount: 1000000 },
      { category: 'Decor', estimated_amount: 350000 }
    ];
    const newItems = [
      { category: 'Venue', estimated_amount: 1000000 },
      { category: 'Decor', estimated_amount: 250000 }, // cut by 1 Lakh
      { category: 'Buffer', estimated_amount: 50000 } // new
    ];

    const diff = calculateBudgetItemDiff(oldItems, newItems);
    const decorDiff = diff.find((d) => d.category === 'Decor');

    expect(decorDiff.delta).toBe(-100000);
    expect(decorDiff.isCut).toBe(true);
    expect(decorDiff.percentChange).toBe(-28.6);
  });
});
