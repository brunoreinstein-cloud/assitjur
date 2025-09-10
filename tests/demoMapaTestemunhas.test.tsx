/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import App from '@/App';

vi.mock('@/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    profile: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    hasRole: vi.fn(),
    isAdmin: false,
  }),
}));

describe('DemoMapaTestemunhas tour', () => {
  it('shows popovers in sequence and final CTA', async () => {
    window.history.pushState({}, '', '/demo/mapa-testemunhas');
    render(<App />);

    expect(
      await screen.findByText('Crie um novo mapa de testemunhas.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(
      await screen.findByText('Simule a importação de dados do CNJ.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(
      await screen.findByText('Revise as testemunhas e seus vínculos.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(
      await screen.findByText('Visualize as relações no grafo.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(
      await screen.findByText('Gere um PDF demonstrativo.')
    ).toBeInTheDocument();

    const betaLink = screen.getByRole('link', { name: 'Entrar na Beta' });
    expect(betaLink).toHaveAttribute('href', '/beta');
  });
});

