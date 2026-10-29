import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IntakeChat } from '../../features/intake/IntakeChat.jsx';

describe('IntakeChat Component', () => {
  it('renders welcome message and evaluation preset buttons', () => {
    render(<IntakeChat onPlanInitialized={vi.fn()} />);

    expect(screen.getByText(/PlanWars AI Event Planner/i)).toBeInTheDocument();
    expect(screen.getByText(/Sharma Wedding/i)).toBeInTheDocument();
    expect(screen.getByText(/Anita's 10th Birthday/i)).toBeInTheDocument();
    expect(screen.getByText(/Diwali Community Mela/i)).toBeInTheDocument();
  });

  it('allows user to type in chat input and submit', () => {
    render(<IntakeChat onPlanInitialized={vi.fn()} />);

    const input = screen.getByLabelText(/Chat with planning assistant/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Planning 350 guests wedding in Jaipur' } });
    expect(input.value).toBe('Planning 350 guests wedding in Jaipur');
  });

  it('displays the generate full plan button', () => {
    render(<IntakeChat onPlanInitialized={vi.fn()} />);

    const generateBtn = screen.getByText(/Generate Full Plan/i);
    expect(generateBtn).toBeInTheDocument();
  });
});
