import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../api/client.js';
import { EventProvider } from '../../context/EventContext.jsx';
import { VendorsTab } from '../../features/vendors/VendorsTab.jsx';

vi.mock('../../api/client.js', () => ({
  api: {
    getVendors: vi.fn(),
    createVendor: vi.fn(),
    generateVendorCategories: vi.fn(),
    addVendorChecklistItem: vi.fn(),
    toggleVendorChecklistItem: vi.fn(),
    compareVendorQuote: vi.fn()
  }
}));

const testEvent = {
  id: 'test-event-1',
  title: 'Sharma Wedding'
};

const mockVendorsData = [
  {
    id: 'v-1',
    category: 'Catering',
    name: 'Royal Feast',
    checklist: [
      { id: 'c-1', title: 'Live counter power checked', is_completed: 0, item_type: 'requirement' },
      { id: 'c-2', title: 'Per-plate tasting done', is_completed: 1, item_type: 'requirement' }
    ],
    quotes: [
      {
        id: 'q-1',
        vendor_name: 'Royal Feast',
        total_amount: 680000,
        inclusions: ['4 Starters', '6 Mains'],
        extraCharges: ['₹15,000 generator fuel'],
        openQuestions: ['Is drinking water extra?']
      }
    ]
  }
];

describe('VendorsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getVendors.mockResolvedValue(mockVendorsData);
  });

  it('renders coordinator transparency notice and vendor category tabs', async () => {
    render(
      <EventProvider initialEvent={testEvent}>
        <VendorsTab />
      </EventProvider>
    );

    expect(await screen.findByText(/Coordinator Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/Catering \(1 quotes\)/i)).toBeInTheDocument();
    expect(screen.getByText('Live counter power checked')).toBeInTheDocument();
    expect(screen.getByText('Royal Feast')).toBeInTheDocument();
  });

  it('allows toggling checklist items', async () => {
    render(
      <EventProvider initialEvent={testEvent}>
        <VendorsTab />
      </EventProvider>
    );

    const checkBtn = await screen.findByText('Live counter power checked');
    fireEvent.click(checkBtn);

    expect(api.toggleVendorChecklistItem).toHaveBeenCalledWith('test-event-1', 'c-1', true);
  });

  it('opens quote comparison modal', async () => {
    render(
      <EventProvider initialEvent={testEvent}>
        <VendorsTab />
      </EventProvider>
    );

    const compareBtn = await screen.findByRole('button', { name: /\+ Compare New Quote/i });
    fireEvent.click(compareBtn);

    expect(screen.getByLabelText(/Paste Proposal \/ Quotation Text/i)).toBeInTheDocument();
  });
});
