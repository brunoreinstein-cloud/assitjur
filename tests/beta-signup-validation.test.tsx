/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { BetaSignup } from '@/components/beta/BetaSignup';

describe('BetaSignup form validation', () => {
  it('shows error for invalid email immediately', async () => {
    render(<BetaSignup />);
    const emailInput = screen.getByLabelText(/E-mail corporativo/i);
    await userEvent.type(emailInput, 'invalid');
    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
  });

  it('rejects disposable email domains', async () => {
    render(<BetaSignup />);
    const emailInput = screen.getByLabelText(/E-mail corporativo/i);
    await userEvent.type(emailInput, 'user@mailinator.com');
    expect(
      await screen.findByText('Domínio de e-mail descartável não permitido')
    ).toBeInTheDocument();
  });

  it('disables submit until consent checkboxes are checked', async () => {
    render(<BetaSignup />);

    const nomeInput = screen.getByLabelText(/Nome completo/i);
    const emailInput = screen.getByLabelText(/E-mail corporativo/i);
    const organizacaoInput = screen.getByLabelText(/Organização/);
    const necessidade = screen.getByLabelText('Reduzir tempo operacional');
    const submitButton = screen.getByRole('button', { name: /lista Beta/i });

    await userEvent.type(nomeInput, 'Ana Silva');
    await userEvent.type(emailInput, 'ana@gmail.com');
    await userEvent.type(organizacaoInput, 'OrgX');
    await userEvent.click(necessidade);

    expect(submitButton).toBeDisabled();

    const consentimento = screen.getByLabelText(/Autorizo o uso dos meus dados/i);
    const termos = screen.getByLabelText(/Li e concordo/i);

    await userEvent.click(consentimento);
    expect(submitButton).toBeDisabled();

    await userEvent.click(termos);
    expect(submitButton).not.toBeDisabled();
  });
});
