import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../api/client.js';
import { EventProvider, useEventContext } from '../../context/EventContext.jsx';
import { ReplanModal } from '../../features/replan/ReplanModal.jsx';

vi.mock('../../api/client.js', () => ({
  api: {
    evaluateReplan: vi.fn(),
    applyReplan: vi.fn(),
    getEvent: vi.fn()
  }
}));

function OpenModalTrigger() {
  const { setReplanOpen, setCurrentEvent } = useEventContext();
  return (
    <button
      onClick={() => {
        setCurrentEvent({
          id: 'test-event-1',
          title: 'Test Wedding',
          guest_count: 350,
          budget_total: 2500000,
          event_date: '2026-12-15'
        });
        setReplanOpen(true);
      }}
    >
      Open Replan
    </button>
  );
}

describe('ReplanModal Component (Challenge Replan Scenario)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates evaluator test scenario "+50 guests, lower budget, 2 weeks earlier" on click', async () => {
    render(
      <EventProvider>
        <OpenModalTrigger />
        <ReplanModal />
      </EventProvider>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Replan'));

    expect(screen.getByText(/Revise Plan & Evaluate Trade-offs/i)).toBeInTheDocument();

    const scenarioBtn = screen.getByRole('button', {
      name: /Apply "\+50 guests, ₹2L lower budget, 2 weeks earlier"/i
    });
    expect(scenarioBtn).toBeInTheDocument();

    fireEvent.click(scenarioBtn);

    const guestInput = screen.getByLabelText(/New Guest Count/i);
    expect(guestInput.value).toBe('400'); // 350 + 50
  });

  it('submits evaluation and renders strategic trade-off options', async () => {
    api.evaluateReplan.mockResolvedValue({
      constraintDiff: {
        guests: { before: 350, after: 400, delta: 50, label: '+50 guests' },
        budget: { before: 2500000, after: 2300000, formattedAfter: '₹23,00,000', label: '-₹2,00,000' },
        timeline: { afterDate: '01/12/2026', daysShifted: -14, label: '14 days earlier' }
      },
      options: [
        {
          id: 'opt-1',
          title: 'Menu Streamline Strategy',
          description: 'Absorb guests by trimming luxury courses',
          strategy: 'Focuses on core hospitality',
          consequences: ['Saves budget', 'Faster preparation']
        }
      ]
    });

    render(
      <EventProvider>
        <OpenModalTrigger />
        <ReplanModal />
      </EventProvider>
    );

    fireEvent.click(screen.getByText('Open Replan'));

    const evalBtn = screen.getByRole('button', { name: /Calculate Trade-off Options/i });
    fireEvent.click(evalBtn);

    expect(await screen.findByText('Menu Streamline Strategy')).toBeInTheDocument();
    expect(screen.getByText('+50 guests')).toBeInTheDocument();
    expect(screen.getByText('Apply Strategy')).toBeInTheDocument();
  });
});

