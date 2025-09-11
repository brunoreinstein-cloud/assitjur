import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeatureFlagGuard from '@/components/FeatureFlagGuard';
import { FeatureFlagProvider, refreshFeatureFlags } from '@/hooks/useFeatureFlag';

let mockUser = { id: '1' } as any;
let mockProfile = { plan: 'free', organization_id: 'org1' } as any;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, profile: mockProfile })
}));

const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke } }
}));

describe('feature flags', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUser = { id: '1' } as any;
    mockProfile = { plan: 'free', organization_id: 'org1' } as any;
    invoke.mockReset();
  });

  it('caches flag evaluations and switches users', async () => {
    invoke.mockResolvedValueOnce({ data: { flags: { 'advanced-report': false } }, error: null });
    const { rerender } = render(
      <FeatureFlagProvider>
        <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
      </FeatureFlagProvider>
    );
    const key1 = `ff:org1:1:test`;
    await waitFor(() => expect(localStorage.getItem(key1)).not.toBeNull());
    expect(JSON.parse(localStorage.getItem(key1)!).flags).toEqual({ 'advanced-report': false });

    mockUser = { id: '2' } as any;
    mockProfile = { plan: 'pro', organization_id: 'org2' } as any;
    invoke.mockResolvedValueOnce({ data: { flags: { 'advanced-report': true } }, error: null });
    rerender(
      <FeatureFlagProvider>
        <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
      </FeatureFlagProvider>
    );
    const key2 = `ff:org2:2:test`;
    await waitFor(() => expect(localStorage.getItem(key2)).not.toBeNull());
    expect(localStorage.getItem(key1)).toBeNull();
    expect(JSON.parse(localStorage.getItem(key2)!).flags).toEqual({ 'advanced-report': true });
  });

  it('keeps cache on fetch failure', async () => {
    invoke.mockResolvedValueOnce({ data: { flags: { 'advanced-report': true } }, error: null });
    render(
      <FeatureFlagProvider>
        <FeatureFlagGuard flag="advanced-report"><div>Secret</div></FeatureFlagGuard>
      </FeatureFlagProvider>
    );
    const key = `ff:org1:1:test`;
    await waitFor(() => expect(localStorage.getItem(key)).not.toBeNull());
    expect(screen.getByText('Secret')).toBeInTheDocument();

    invoke.mockRejectedValueOnce(new Error('fail'));
    await refreshFeatureFlags();

    expect(screen.getByText('Secret')).toBeInTheDocument();
    expect(localStorage.getItem(key)).not.toBeNull();
  });
});
