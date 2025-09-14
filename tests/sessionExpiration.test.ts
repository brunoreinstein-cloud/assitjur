/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { supabaseMock } from './mocks/supabase';
import fetchWithAuth from '@/utils/fetchWithAuth';
import { AuthErrorHandler } from '@/utils/authErrorHandler';
import { useSessionStore } from '@/stores/useSessionStore';

describe('session expiration', () => {
  beforeEach(() => {
    useSessionStore.setState({ expired: false, redirectUrl: null });
  });

  it('refreshes token when session expired', async () => {
    const now = Math.floor(Date.now() / 1000);
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'old', expires_at: now - 10 } },
      error: null,
    });
    supabaseMock.auth.refreshSession.mockResolvedValue({
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
