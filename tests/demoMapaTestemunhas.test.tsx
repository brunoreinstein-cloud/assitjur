/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import React from 'react';
import DemoMapaTestemunhas from '@/pages/DemoMapaTestemunhas';

describe('DemoMapaTestemunhas tour', () => {
  it('shows popovers in sequence and final CTA', async () => {
    render(<DemoMapaTestemunhas />);
    const user = userEvent.setup();

    // Aguarda o componente carregar
    expect(
      await screen.findByRole('heading', { name: 'Mapa de Testemunhas (Demo)' })
    ).toBeInTheDocument();

    // Step 0: Novo Mapa
    expect(await screen.findByTestId('tour-step-0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próximo' }));

    // Step 1: Importar do CNJ
    expect(await screen.findByTestId('tour-step-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próximo' }));

    // Step 2: Revisar testemunhas
    expect(await screen.findByTestId('tour-step-2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próximo' }));

    // Step 3: Visualizar grafo
    expect(await screen.findByTestId('tour-step-3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próximo' }));

    // Step 4: Gerar PDF e CTA
    expect(await screen.findByTestId('tour-step-4')).toBeInTheDocument();

    // Verifica o link para beta
    const betaLink = screen.getByRole('link', { name: 'Entrar na Beta' });
    expect(betaLink).toHaveAttribute('href', '/beta');
  });

  it('allows tour restart', async () => {
    render(<DemoMapaTestemunhas />);
    const user = userEvent.setup();

    // Navega até o final do tour
    expect(
      await screen.findByRole('heading', { name: 'Mapa de Testemunhas (Demo)' })
    ).toBeInTheDocument();

    // Clica em todos os "Próximo" até chegar ao final
    for (let i = 0; i < 4; i++) {
      const proximoButton = screen.getByRole('button', { name: 'Próximo' });
      await user.click(proximoButton);
    }

    // Verifica se chegou no final
    expect(await screen.findByTestId('tour-step-4')).toBeInTheDocument();

    // Clica em "Reiniciar"
    const reiniciarButton = screen.getByRole('button', { name: 'Reiniciar' });
    await user.click(reiniciarButton);

    // Verifica se voltou ao início
    expect(await screen.findByTestId('tour-step-0')).toBeInTheDocument();
  });
});

