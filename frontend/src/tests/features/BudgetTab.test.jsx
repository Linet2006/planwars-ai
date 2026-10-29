import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../api/client.js';
import { EventProvider } from '../../context/EventContext.jsx';
import { BudgetTab } from '../../features/budget/BudgetTab.jsx';

vi.mock('../../api/client.js', () => ({
  api: {
    getBudget: vi.fn(),
    addBudgetItem: vi.fn(),
    updateBudgetItem: vi.fn(),
    deleteBudgetItem: vi.fn(),
    generateBudget: vi.fn()
  }
}));

const testEvent = {
  id: 'test-event-1',
  title: 'Sharma Wedding',
  budget_total: 2500000,
  guest_count: 350,
  event_date: '2026-12-15'
};

const mockBudgetData = {
  budgetTotal: 2500000,
  totalAllocated: 2400000,
  remainingBudget: 100000,
  isOverBudget: false,
  overBudgetAmount: 0,
  percentageUsed: 96,
  items: [
    {
      id: 'item-1',
      category: 'Venue & Stay',
      estimated_amount: 1000000,
      actual_amount: 1050000,
      is_confirmed: 1,
      percentageOfTotal: 42,
      perGuest: 3000,
      notes: 'Main banquet hall'
    },
    {
      id: 'item-2',
      category: 'Catering',
      estimated_amount: 700000,
      actual_amount: null,
      is_confirmed: 0,
      percentageOfTotal: 28,
      perGuest: 2000,
      notes: 'Multi-cuisine spread'
    }
  ]
};

describe('BudgetTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getBudget.mockResolvedValue(mockBudgetData);
  });

  it('renders budget breakdown table with estimates and confirmed actuals', async () => {
    render(
      <EventProvider initialEvent={testEvent}>
        <BudgetTab />
      </EventProvider>
    );

    expect(await screen.findByText(/Budget Breakdown & Tracking/i)).toBeInTheDocument();
    expect(screen.getByText('Venue & Stay')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();

    // Check for Confirmed and AI Estimate* badges
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getAllByText(/AI Estimate\*/i).length).toBeGreaterThanOrEqual(1);
  });

  it('opens add custom category modal on click', async () => {
    render(
      <EventProvider initialEvent={testEvent}>
        <BudgetTab />
      </EventProvider>
    );

    const addBtn = await screen.findByRole('button', { name: /Add Custom Category/i });
    fireEvent.click(addBtn);

    expect(screen.getByLabelText(/Category Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estimated Amount/i)).toBeInTheDocument();
  });
});
