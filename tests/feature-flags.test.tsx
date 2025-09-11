import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FeatureFlagGuard from '@/components/FeatureFlagGuard';
import { refreshFeatureFlags } from '@/hooks/useFeatureFlag';

let mockUser = { id: '1' };
let mockProfile = { plan: 'free' };

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, profile: mockProfile })
}));

let supabaseResponses: Record<string, { flag: string; enabled: boolean }[]> = {};

const from = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn((column: string, value: string) =>
      Promise.resolve({ data: supabaseResponses[`${column}.eq.${value}`] || [] })
    )
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
    supabaseResponses = {
      'plan.eq.free': [{ flag: 'advanced-report', enabled: false }],
      'user_id.eq.1': [],
      'plan.eq.pro': [{ flag: 'advanced-report', enabled: true }],
      'user_id.eq.2': []
    };
  });

  afterEach(() => {
    localStorage.clear();
    mockUser = { id: '1' };
    mockProfile = { plan: 'free' };
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
        eq: vi.fn(() => Promise.reject(new Error('fetch failed')))
      }))
    }));

    await refreshFeatureFlags('1', 'free');
    expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': false }));
  });

  it('clears cache when switching users', async () => {
    mockUser = { id: '2' };
    mockProfile = { plan: 'pro' };
    const { rerender } = render(
      <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
    );

    await waitFor(() =>
      expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': true }))
    );
    expect(screen.getByText('Secret')).toBeInTheDocument();

    mockUser = { id: '1' };
    mockProfile = { plan: 'free' };
    rerender(
      <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
    );

    expect(localStorage.getItem('featureFlags')).toBeNull();

    await waitFor(() =>
      expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': false }))
    );
    expect(screen.queryByText('Secret')).toBeNull();
  });

  it('user flags override plan flags', async () => {
    supabaseResponses['plan.eq.free'] = [{ flag: 'advanced-report', enabled: true }];
    supabaseResponses['user_id.eq.1'] = [{ flag: 'advanced-report', enabled: false }];

    await refreshFeatureFlags('1', 'free');
    expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ 'advanced-report': false }));
  });
});

