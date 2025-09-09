import { ensureSessionOrThrow } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface FetchWithAuthOptions extends RequestInit {
  cid?: string;
}

export async function fetchWithAuth(route: string, options: FetchWithAuthOptions = {}) {
  const { cid = uuidv4(), headers, ...init } = options;
  const session = await ensureSessionOrThrow();
  const token = session.access_token;
  const start = Date.now();
  try {
    const response = await fetch(route, {
      ...init,
      headers: {
        ...(headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const ms = Date.now() - start;
    console.info(JSON.stringify({ route, status: response.status, ms, cid }));
    return response;
  } catch (error) {
    const ms = Date.now() - start;
    console.info(JSON.stringify({ route, status: 'error', ms, cid }));
    throw error;
  }
}
