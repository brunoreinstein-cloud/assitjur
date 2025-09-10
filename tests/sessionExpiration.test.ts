/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        refreshSession: vi.fn(),
      },
    },
  };
});

import { supabase } from '@/integrations/supabase/client';
import fetchWithAuth from '@/utils/fetchWithAuth';
import { AuthErrorHandler } from '@/utils/authErrorHandler';
import { useSessionStore } from '@/stores/useSessionStore';

describe('session expiration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useSessionStore.setState({ expired: false, redirectUrl: null });
  });

  it('refreshes token when session expired', async () => {
    const now = Math.floor(Date.now() / 1000);
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'old', expires_at: now - 10 } },
      error: null,
    });
    (supabase.auth.refreshSession as any).mockResolvedValue({
      data: { session: { access_token: 'new', expires_at: now + 3600 } },
      error: null,
    });
    global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    await fetchWithAuth('/test');
    expect(supabase.auth.refreshSession).toHaveBeenCalled();
  });

  it('opens session expired modal on auth error', async () => {
    await AuthErrorHandler.handleAuthError({ message: 'token_expired' });
    expect(useSessionStore.getState().expired).toBe(true);
  });
});
