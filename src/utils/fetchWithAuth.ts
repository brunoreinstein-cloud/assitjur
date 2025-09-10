import { supabase } from '@/integrations/supabase/client';
import { v4 as uuid } from 'uuid';
import { AuthErrorHandler } from '@/utils/authErrorHandler';

export async function fetchWithAuth(url: string, init?: RequestInit) {
  const cid = uuid();
  const headers = new Headers(init?.headers || {});
  headers.set('x-correlation-id', cid);

  let token: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = session.expires_at ? session.expires_at - now : 0;
      if (expiresIn < 60) {
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        if (!error && refreshed.session) {
          token = refreshed.session.access_token;
        } else if (error && AuthErrorHandler.isAuthError(error)) {
          AuthErrorHandler.handleAuthError(error);
        } else {
          token = session.access_token;
        }
      } else {
        token = session.access_token;
      }
    }
  } catch {
    // ignore
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  let body: any;
  const execute = async () => {
    response = await fetch(url, { ...init, headers });
    try {
      body = await response.clone().json();
    } catch {
      body = undefined;
    }
  };

  try {
    await execute();
  } catch (err) {
    return {
      ok: false,
      status: 0,
      cid,
      error: 'network_error',
      details: err instanceof Error ? err.message : String(err)
    };
  }

  let refreshAttempted = false;
  if ((response.status === 401 || response.status === 403) && !refreshAttempted) {
    refreshAttempted = true;
    try {
      const { data: refreshed, error } = await supabase.auth.refreshSession();
      if (!error && refreshed.session) {
        headers.set('Authorization', `Bearer ${refreshed.session.access_token}`);
        await execute();
      } else if (error && AuthErrorHandler.isAuthError(error)) {
        AuthErrorHandler.handleAuthError(error);
      }
    } catch {
      // ignore
    }
  }

  const responseCid =
    body?.cid || response.headers.get('x-correlation-id') || cid;

  if (!response.ok) {
    const errorResponse = {
      ok: false,
      status: response.status,
      cid: responseCid,
      error: body?.error || response.statusText,
      details: body?.details
    };

    if (response.status === 401 || response.status === 403) {
      const isAuthError =
        AuthErrorHandler.isAuthError(body) ||
        AuthErrorHandler.isAuthError({ message: response.statusText });

      if (isAuthError) {
        AuthErrorHandler.handleAuthError(body || { message: response.statusText });
      }
    }

    return errorResponse;
  }

  return {
    ok: true,
    status: response.status,
    cid: responseCid,
    data: body
  };
}

export default fetchWithAuth;
