/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from '@/App';

describe('Demo Mapa Testemunhas tour', () => {
  it('walks through tour steps and final CTA points to /beta', async () => {
    window.history.pushState({}, '', '/demo/mapa-testemunhas');
    render(<App />);
    const user = userEvent.setup();

    // Step 0
    expect(await screen.findByText('Crie um novo mapa de testemunhas.')).toBeVisible();
    await user.click(screen.getByText('Próximo'));

    // Step 1
    expect(await screen.findByText('Simule a importação de dados do CNJ.')).toBeVisible();
    await user.click(screen.getByText('Próximo'));

    // Step 2
    expect(await screen.findByText('Revise as testemunhas e seus vínculos.')).toBeVisible();
    await user.click(screen.getByText('Próximo'));

    // Step 3
    expect(await screen.findByText('Visualize as relações no grafo.')).toBeVisible();
    await user.click(screen.getByText('Próximo'));

    // Step 4
    expect(await screen.findByText('Gere um PDF demonstrativo.')).toBeVisible();
    const cta = screen.getByRole('link', { name: 'Entrar na Beta' });
    expect(cta).toHaveAttribute('href', '/beta');
  });
});
