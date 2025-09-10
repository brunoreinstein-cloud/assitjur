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

    // Aguarda o componente carregar
    expect(await screen.findByText('Mapa de Testemunhas (Demo)')).toBeInTheDocument();

    // Step 0: Novo Mapa
    expect(
      await screen.findByText('Crie um novo mapa de testemunhas.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    
    // Step 1: Importar do CNJ
    expect(
      await screen.findByText('Simule a importação de dados do CNJ.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    
    // Step 2: Revisar testemunhas
    expect(
      await screen.findByText('Revise as testemunhas e seus vínculos.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    
    // Step 3: Visualizar grafo
    expect(
      await screen.findByText('Visualize as relações no grafo.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    
    // Step 4: Gerar PDF e CTA
    expect(
      await screen.findByText('Gere um PDF demonstrativo.')
    ).toBeInTheDocument();

    // Verifica o link para beta
    const betaLink = screen.getByRole('link', { name: 'Entrar na Beta' });
    expect(betaLink).toHaveAttribute('href', '/beta');
  });

  it('allows tour restart', async () => {
    window.history.pushState({}, '', '/demo/mapa-testemunhas');
    render(<App />);

    // Navega até o final do tour
    expect(await screen.findByText('Mapa de Testemunhas (Demo)')).toBeInTheDocument();
    
    // Clica em todos os "Próximo" até chegar ao final
    for (let i = 0; i < 4; i++) {
      const proximoButton = screen.getByRole('button', { name: 'Próximo' });
      fireEvent.click(proximoButton);
    }

    // Verifica se chegou no final
    expect(await screen.findByText('Gere um PDF demonstrativo.')).toBeInTheDocument();

    // Clica em "Reiniciar"
    const reiniciarButton = screen.getByRole('button', { name: 'Reiniciar' });
    fireEvent.click(reiniciarButton);

    // Verifica se voltou ao início
    expect(await screen.findByText('Crie um novo mapa de testemunhas.')).toBeInTheDocument();
  });
});

