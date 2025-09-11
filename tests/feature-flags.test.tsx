import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeatureFlagGuard from '@/components/FeatureFlagGuard';
import { refreshFeatureFlags } from '@/hooks/useFeatureFlag';

let mockUser = { id: '1' };
let mockProfile = { plan: 'free' };

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, profile: mockProfile })
}));

const supabaseResponses: Record<string, { flag: string; enabled: boolean }[]> = {
  'user_id.eq.1,plan.eq.free': [{ flag: 'advanced-report', enabled: false }],
  'user_id.eq.2,plan.eq.pro': [{ flag: 'advanced-report', enabled: true }]
};

const from = vi.fn(() => ({
  select: vi.fn(() => ({
    or: vi.fn((filter: string) => Promise.resolve({ data: supabaseResponses[filter] || [] }))
  }))
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from }
}));

describe('feature flags', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUser = { id: '1' };
    mockProfile = { plan: 'free' };
    from.mockClear();
  });

  it('loadFlags updates cache', async () => {
    await refreshFeatureFlags('1', 'free');
    expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': false }));

    await refreshFeatureFlags('2', 'pro');
    expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': true }));
  });

  it('keeps cache on fetch failure', async () => {
    await refreshFeatureFlags('1', 'free');
    expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': false }));

    from.mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => Promise.reject(new Error('fetch failed')))
      }))
    }));

    await refreshFeatureFlags('1', 'free');
    expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': false }));
  });

  it('FeatureFlagGuard reacts to user/plan changes', async () => {
    const { rerender } = render(
      <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
    );

    await waitFor(() =>
      expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': false }))
    );
    expect(screen.queryByText('Secret')).toBeNull();

    mockUser = { id: '2' };
    mockProfile = { plan: 'pro' };
    rerender(
      <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
    );

    await waitFor(() =>
      expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': true }))
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});

