import { supabase, getProjectRef } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface FetchWithAuthOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export async function fetchWithAuth<T = any>(
  path: string,
  options: FetchWithAuthOptions = {}
): Promise<{ data: T | null; error?: string; cid: string }> {
  const cid = uuidv4();
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error('Usuário não autenticado');

    const projectRef = getProjectRef();
    const response = await fetch(`https://${projectRef}.functions.supabase.co/${path}`, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-correlation-id': cid,
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error || data?.detail || data?.message || `HTTP ${response.status}`;
      return { data, error: message, cid };
    }

    return { data, cid };
  } catch (err: any) {
    return { data: null, error: err.message, cid };
  }
}
