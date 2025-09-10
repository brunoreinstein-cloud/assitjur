/**
 * @vitest-environment node
 */
import { describe, it, expect, afterEach } from 'vitest';
import { corsHeaders } from '../supabase/functions/_shared/cors';

function setAllowedOrigins(value?: string) {
  (globalThis as any).Deno = {
    env: {
      get: (name: string) => (name === 'ALLOWED_ORIGINS' ? value : undefined),
    },
  } as any;
}

afterEach(() => {
  // clean up Deno mock
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (globalThis as any).Deno;
});

describe('corsHeaders', () => {
  it('does not set header when ALLOWED_ORIGINS is unset', () => {
    setAllowedOrigins(undefined);
    const req = new Request('https://example.com', {
      headers: { origin: 'https://foo.com' },
    });
    const headers = corsHeaders(req);
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('sets header when origin matches allowed list', () => {
    setAllowedOrigins('https://allowed.com');
    const req = new Request('https://example.com', {
      headers: { origin: 'https://allowed.com' },
    });
    const headers = corsHeaders(req);
    expect(headers['Access-Control-Allow-Origin']).toBe('https://allowed.com');
  });

  it('does not set header when origin does not match', () => {
    setAllowedOrigins('https://allowed.com');
    const req = new Request('https://example.com', {
      headers: { origin: 'https://other.com' },
    });
    const headers = corsHeaders(req);
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

