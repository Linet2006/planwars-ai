/**
 * Pure deterministic budget calculation functions.
 * Rule: The LLM NEVER performs arithmetic.
 */

/**
 * Calculates complete budget summary with itemized breakdown.
 * @param {number} budgetTotal - Total sanctioned budget
 * @param {Array<{ category: string, estimated_amount: number, actual_amount: number|null, is_confirmed: boolean|number }>} items
 * @param {number} guestCount - Number of guests
 * @returns {object} Summary statistics
 */
export function calculateBudgetSummary(budgetTotal, items = [], guestCount = 1) {
  const safeTotal = Math.max(0, budgetTotal || 0);
  const safeGuests = Math.max(1, guestCount || 1);

  let totalAllocated = 0;
  let totalEstimated = 0;
  let totalActual = 0;
  let confirmedCount = 0;
  let estimateOnlyCount = 0;

  const itemDetails = items.map((item) => {
    const isConfirmed = Boolean(item.is_confirmed);
    const est = Math.max(0, item.estimated_amount || 0);
    const act = item.actual_amount !== null && item.actual_amount !== undefined ? Math.max(0, item.actual_amount) : null;
    
    // An item's active charge is actual if confirmed, otherwise estimate
    const activeAmount = isConfirmed && act !== null ? act : est;

    totalAllocated += activeAmount;
    totalEstimated += est;
    if (act !== null) totalActual += act;

    if (isConfirmed) confirmedCount += 1;
    else estimateOnlyCount += 1;

    const percentageOfTotal = safeTotal > 0 ? (activeAmount / safeTotal) * 100 : 0;
    const perGuest = activeAmount / safeGuests;

    return {
      ...item,
      activeAmount,
      percentageOfTotal: Number(percentageOfTotal.toFixed(2)),
      perGuest: Math.round(perGuest)
    };
  });

  const remaining = safeTotal - totalAllocated;
  const isOverBudget = remaining < 0;
  const overBudgetAmount = isOverBudget ? Math.abs(remaining) : 0;
  const percentageUsed = safeTotal > 0 ? (totalAllocated / safeTotal) * 100 : 0;
  const perGuestTotal = safeTotal / safeGuests;
  const perGuestAllocated = totalAllocated / safeGuests;

  return {
    budgetTotal: safeTotal,
    guestCount: safeGuests,
    totalAllocated,
    totalEstimated,
    totalActual,
    remainingBudget: remaining,
    isOverBudget,
    overBudgetAmount,
    percentageUsed: Number(percentageUsed.toFixed(2)),
    perGuestTotal: Math.round(perGuestTotal),
    perGuestAllocated: Math.round(perGuestAllocated),
    confirmedCount,
    estimateOnlyCount,
    items: itemDetails
  };
}

/**
 * Calculates per-guest cost.
 * @param {number} totalAmount
 * @param {number} guestCount
 * @returns {number}
 */
export function calculatePerGuestCost(totalAmount, guestCount) {
  if (!guestCount || guestCount <= 0) return 0;
  return Math.round(totalAmount / guestCount);
}

/**
 * Normalizes allocation percentages to ensure they sum exactly to 100%
 * and derives rupee allocations strictly based on budgetTotal.
 * @param {number} budgetTotal
 * @param {Array<{ category: string, percentage: number, reasoning?: string }>} categories
 * @returns {Array<{ category: string, estimated_amount: number, percentage: number, reasoning: string }>}
 */
export function deriveAllocationsFromPercentages(budgetTotal, categories = []) {
  if (!categories.length) return [];
  const safeTotal = Math.max(0, budgetTotal);
  const totalPct = categories.reduce((sum, c) => sum + (c.percentage || 0), 0) || 100;

  let allocatedRunningSum = 0;
  const results = categories.map((cat, idx) => {
    const normalizedPct = (cat.percentage / totalPct) * 100;
    // For the last item, assign remaining to avoid rounding error
    let amount;
    if (idx === categories.length - 1) {
      amount = Math.max(0, safeTotal - allocatedRunningSum);
    } else {
      amount = Math.round((normalizedPct / 100) * safeTotal);
      allocatedRunningSum += amount;
    }

    return {
      category: cat.category,
      estimated_amount: amount,
      percentage: Number(normalizedPct.toFixed(2)),
      reasoning: cat.reasoning || ''
    };
  });

  return results;
}

