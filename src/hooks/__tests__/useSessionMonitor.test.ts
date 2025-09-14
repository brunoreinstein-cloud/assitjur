/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionMonitor } from '../useSessionMonitor';
import { supabase } from '@/integrations/supabase/client';
import { AuthErrorHandler } from '@/utils/authErrorHandler';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
}));

vi.mock('@/utils/authErrorHandler', () => ({
  AuthErrorHandler: {
    isAuthError: vi.fn((e: any) => e?.message === 'token_expired' || e?.message === 'session_inactive'),
    handleAuthError: vi.fn(),
  },
}));

describe('useSessionMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes session when token is about to expire', async () => {
    const now = Math.floor(Date.now() / 1000);
    (supabase.auth.getSession as any)
      .mockResolvedValueOnce({ data: { session: { expires_at: now + 15 * 60 } }, error: null })
      .mockResolvedValue({ data: { session: { expires_at: now + 5 * 60 } }, error: null });
    (supabase.auth.refreshSession as any).mockResolvedValue({ error: null });

    renderHook(() => useSessionMonitor({ checkInterval: 1, preemptiveRefresh: 10 }));

    await Promise.resolve();
    expect(supabase.auth.refreshSession).not.toHaveBeenCalled();

    await vi.advanceTimersByTime(60 * 1000);
    await Promise.resolve();
    expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('logs out user after inactivity timeout', async () => {
    const now = Math.floor(Date.now() / 1000);
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { expires_at: now + 60 * 60 } },
      error: null,
    });

    renderHook(() => useSessionMonitor({ inactivityTimeout: 0.5 }));

    await Promise.resolve();
    await vi.advanceTimersByTime(60 * 1000);
    expect(AuthErrorHandler.handleAuthError).toHaveBeenCalledWith({ message: 'session_inactive' });
  });

  it('handles auth errors during session check', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: { message: 'token_expired' },
    });

    renderHook(() => useSessionMonitor());

    await Promise.resolve();
    expect(AuthErrorHandler.handleAuthError).toHaveBeenCalledWith({ message: 'token_expired' });
  });
});

