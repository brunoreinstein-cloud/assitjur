import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, act } from 'vitest';
import FeatureFlagGuard from '@/components/FeatureFlagGuard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1' }, profile: { plan: 'free' } })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        or: () => Promise.resolve({ data: [] })
      })
    })
  }
}));

describe('FeatureFlagGuard', () => {
  it('toggles visibility when flag changes', async () => {
    localStorage.setItem('featureFlags', JSON.stringify({ 'advanced-report': true }));
    const { rerender } = render(
      <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();

    await act(async () => {
      localStorage.setItem('featureFlags', JSON.stringify({ 'advanced-report': false }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'featureFlags' }));
    });
    rerender(
      <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
    );
    expect(screen.queryByText('Secret')).toBeNull();
  });
});
