import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBanner } from '@/components/common/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders message and retry button', () => {
    const onRetry = vi.fn();
    render(<ErrorBanner message="Falha" onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: /tentar novamente/i });
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalled();
  });
});
