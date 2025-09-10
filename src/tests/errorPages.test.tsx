import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import NotFound from '@/pages/NotFound';
import ServerError from '@/pages/ServerError';

describe('Error pages', () => {
  it('NotFound provides navigation and search', () => {
    render(<NotFound />);
    expect(
      screen.getByRole('heading', { name: /página não encontrada/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /buscar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /início/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /suporte/i })).toHaveAttribute(
      'href',
      'mailto:suporte@assistjur.com'
    );
    expect(screen.getByRole('link', { name: /status/i })).toHaveAttribute(
      'href',
      'https://status.assistjur.com'
    );
  });

  it('ServerError calls retry handler', () => {
    const onRetry = vi.fn();
    render(<ServerError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
