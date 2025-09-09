import { supabase } from '@/integrations/supabase/client';
import { v4 as uuid } from 'uuid';

export async function fetchWithAuth(url: string, init?: RequestInit) {
  const cid = uuid();
  const headers = new Headers(init?.headers || {});
  headers.set('x-correlation-id', cid);

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // Ignore session retrieval errors
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      cid,
      error: 'network_error',
      details: err instanceof Error ? err.message : String(err)
    };
  }

  let body: any;
  try {
    body = await response.clone().json();
  } catch {
    body = undefined;
  }

  const responseCid =
    body?.cid || response.headers.get('x-correlation-id') || cid;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      cid: responseCid,
      error: body?.error || response.statusText,
      details: body?.details
    };
  }

  return {
    ok: true,
    status: response.status,
    cid: responseCid,
    data: body
  };
}

export default fetchWithAuth;
