import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ServiceHealthProvider, useServiceHealth } from '@/hooks/useServiceHealth';
import { StatusBanner } from '@/components/common/StatusBanner';

function TestComponent({ action }: { action: () => Promise<any> }) {
  const { execute } = useServiceHealth();
  return <button onClick={() => execute(action)}>run</button>;
}

describe('StatusBanner', () => {
  it('shows banner on failure and retries action', async () => {
    const action = vi
      .fn<[], Promise<any>>()
      .mockRejectedValueOnce(Object.assign(new Error('fail'), { status: 500 }))
      .mockResolvedValueOnce('ok');

    render(
      <ServiceHealthProvider>
        <StatusBanner />
        <TestComponent action={action} />
      </ServiceHealthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /run/i }));
    expect(await screen.findByText(/Serviços indisponíveis/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText(/Serviços indisponíveis/i)).not.toBeInTheDocument()
    );
  });
});

