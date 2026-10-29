import { describe, expect, it } from 'vitest';
import {
  calculateBudgetSummary,
  calculatePerGuestCost,
  deriveAllocationsFromPercentages
} from '../../utils/budgetMath.js';

describe('Budget Math Utility (Deterministic Calculations)', () => {
  it('calculates budget summary with mixed estimates and confirmed actuals', () => {
    const budgetTotal = 1000000; // ₹10 Lakhs
    const guestCount = 200;
    const items = [
      { category: 'Venue', estimated_amount: 400000, actual_amount: 420000, is_confirmed: 1 },
      { category: 'Catering', estimated_amount: 350000, actual_amount: null, is_confirmed: 0 },
      { category: 'Decor', estimated_amount: 150000, actual_amount: 130000, is_confirmed: 1 }
    ];

    const summary = calculateBudgetSummary(budgetTotal, items, guestCount);

    // Active amounts: Venue (420,000 actual), Catering (350,000 est), Decor (130,000 actual)
    // Total Allocated = 420,000 + 350,000 + 130,000 = 900,000
    expect(summary.totalAllocated).toBe(900000);
    expect(summary.remainingBudget).toBe(100000);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.overBudgetAmount).toBe(0);
    expect(summary.percentageUsed).toBe(90);
    expect(summary.perGuestTotal).toBe(5000); // 10L / 200
    expect(summary.perGuestAllocated).toBe(4500); // 900K / 200
    expect(summary.confirmedCount).toBe(2);
    expect(summary.estimateOnlyCount).toBe(1);
  });

  it('detects over-budget scenarios accurately', () => {
    const budgetTotal = 500000;
    const items = [
      { category: 'Venue', estimated_amount: 300000, actual_amount: 350000, is_confirmed: 1 },
      { category: 'Food', estimated_amount: 200000, actual_amount: 220000, is_confirmed: 1 }
    ];

    const summary = calculateBudgetSummary(budgetTotal, items, 100);
    expect(summary.totalAllocated).toBe(570000);
    expect(summary.remainingBudget).toBe(-70000);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.overBudgetAmount).toBe(70000);
    expect(summary.percentageUsed).toBe(114);
  });

  it('calculates per guest cost safely', () => {
    expect(calculatePerGuestCost(100000, 50)).toBe(2000);
    expect(calculatePerGuestCost(100000, 0)).toBe(0);
  });

  it('derives exact rupee allocations from percentage splits without rounding drift', () => {
    const total = 2500000;
    const categories = [
      { category: 'Venue', percentage: 40 },
      { category: 'Catering', percentage: 30 },
      { category: 'Decor', percentage: 15 },
      { category: 'Photo', percentage: 10 },
      { category: 'Buffer', percentage: 5 }
    ];

    const result = deriveAllocationsFromPercentages(total, categories);
    const sumAllocated = result.reduce((acc, c) => acc + c.estimated_amount, 0);

    expect(sumAllocated).toBe(total);
    expect(result[0].estimated_amount).toBe(1000000);
    expect(result[1].estimated_amount).toBe(750000);
  });
});

