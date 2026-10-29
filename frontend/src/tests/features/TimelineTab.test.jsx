import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../api/client.js';
import { EventProvider } from '../../context/EventContext.jsx';
import { TimelineTab } from '../../features/timeline/TimelineTab.jsx';

vi.mock('../../api/client.js', () => ({
  api: {
    getTimeline: vi.fn(),
    addTimelineTask: vi.fn(),
    updateTimelineTask: vi.fn(),
    generateTimeline: vi.fn()
  }
}));

const testEvent = {
  id: 'test-event-1',
  title: 'Sharma Wedding',
  event_date: '2026-12-15'
};

const mockTimelineData = {
  tasks: [
    {
      id: 'task-1',
      title: 'Book Primary Venue',
      description: 'Confirm dates and advance token',
      due_date: '2026-09-15',
      priority: 'high',
      status: 'pending',
      depends_on_task_ids: []
    },
    {
      id: 'task-2',
      title: 'Finalize Catering Menu',
      description: 'Tasting session',
      due_date: '2026-10-15',
      priority: 'medium',
      status: 'pending',
      depends_on_task_ids: ['task-1']
    }
  ],
  nextTasks: [],
  daysRemaining: 47
};

describe('TimelineTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTimeline.mockResolvedValue(mockTimelineData);
  });

  it('renders dependency-aware timeline tasks and priority badges', async () => {
    render(
      <EventProvider initialEvent={testEvent}>
        <TimelineTab />
      </EventProvider>
    );

    expect(await screen.findByText(/Dependency-Aware Timeline/i)).toBeInTheDocument();
    expect(screen.getByText('Book Primary Venue')).toBeInTheDocument();
    expect(screen.getByText('Finalize Catering Menu')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('allows marking a task as done', async () => {
    api.updateTimelineTask.mockResolvedValue({ task: { id: 'task-1', status: 'completed' } });

    render(
      <EventProvider initialEvent={testEvent}>
        <TimelineTab />
      </EventProvider>
    );

    const markDoneBtns = await screen.findAllByRole('button', { name: /Mark Done/i });
    expect(markDoneBtns.length).toBeGreaterThan(0);

    fireEvent.click(markDoneBtns[0]);
    expect(api.updateTimelineTask).toHaveBeenCalled();
  });

  it('allows delaying a task by +7 days', async () => {
    api.updateTimelineTask.mockResolvedValue({
      task: { id: 'task-1', status: 'delayed' },
      cascadedUpdates: [{ id: 'task-2', title: 'Finalize Catering Menu' }]
    });

    render(
      <EventProvider initialEvent={testEvent}>
        <TimelineTab />
      </EventProvider>
    );

    const delayBtns = await screen.findAllByRole('button', { name: /Delay \+7 Days/i });
    expect(delayBtns.length).toBeGreaterThan(0);

    fireEvent.click(delayBtns[0]);
    expect(api.updateTimelineTask).toHaveBeenCalledWith('test-event-1', 'task-1', { delayDays: 7 });
  });
});
