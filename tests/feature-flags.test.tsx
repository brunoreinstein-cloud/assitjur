import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, act, beforeEach, afterEach } from 'vitest';
import FeatureFlagGuard from '@/components/FeatureFlagGuard';
import { refreshFeatureFlags } from '@/hooks/useFeatureFlag';

let user: { id: string | undefined } = { id: '1' };
let profile: { plan: string | undefined } = { plan: 'free' };

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user, profile })
}));

const mockOr = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ or: mockOr })
    })
  }
}));

beforeEach(() => {
  user = { id: '1' };
  profile = { plan: 'free' };
  localStorage.clear();
  mockOr.mockImplementation((query: string) => {
    if (query === 'user_id.eq.1') {
      return Promise.resolve({ data: [{ flag: 'advanced-report', enabled: true }] });
    }
    if (query.includes('plan.eq.pro')) {
      return Promise.resolve({ data: [{ flag: 'advanced-report', enabled: true }] });
    }
    return Promise.resolve({ data: [] });
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('feature flags', () => {
  it('loads and caches flags from supabase', async () => {
    await refreshFeatureFlags('1', undefined);
    expect(JSON.parse(localStorage.getItem('featureFlags') || '{}')).toEqual({
      'advanced-report': true
    });
  });

  it('updates component when plan changes', async () => {
    await refreshFeatureFlags('1', 'free');
    const { rerender } = render(
      <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
    );
    expect(screen.queryByText('Secret')).toBeNull();

    profile = { plan: 'pro' };
    await act(async () => {
      rerender(
        <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
      );
    });
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('keeps previous flags when fetch fails', async () => {
    localStorage.setItem('featureFlags', JSON.stringify({ 'advanced-report': true }));
    mockOr.mockRejectedValueOnce(new Error('network'));
    await refreshFeatureFlags('1', 'free');
    expect(JSON.parse(localStorage.getItem('featureFlags') || '{}')).toEqual({
      'advanced-report': true
    });
  });
});
