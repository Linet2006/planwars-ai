import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../../components/common/ErrorBoundary.jsx';

function ProblemChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test crash in child component');
  }
  return <div>Normal Content</div>;
}

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('catches render error, displays alert, and allows reset', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Test crash in child component/)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    // Clicking try again triggers onReset
    fireEvent.click(retryBtn);
    expect(onReset).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
