import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { MaintenanceProvider } from '@/hooks/useMaintenance';

describe('maintenance mode', () => {
  it('shows banner and status page when enabled', async () => {
    window.history.pushState({}, '', '/mapa');
    render(
      <MaintenanceProvider value={true}>
        <App />
      </MaintenanceProvider>
    );
    expect(await screen.findByText(/Sistema em manutenção/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Status do Sistema/i })
    ).toBeInTheDocument();
  });
});
