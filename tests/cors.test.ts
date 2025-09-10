/**
 * @vitest-environment node
 */
import { describe, it, expect, afterEach } from 'vitest';
import { corsHeaders, handlePreflight } from '@/middleware/cors';

function setAllowedOrigins(value?: string) {
  if (value === undefined) delete process.env.ALLOWED_ORIGINS;
  else process.env.ALLOWED_ORIGINS = value;
}

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS;
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
    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
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

describe('handlePreflight', () => {
  it('returns 204 with proper headers when origin allowed', () => {
    setAllowedOrigins('https://*.lovable.dev');
    const req = new Request('https://example.com', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://foo.lovable.dev',
        'Access-Control-Request-Headers': 'authorization',
      },
    });
    const res = handlePreflight(req) as Response;
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://foo.lovable.dev');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('authorization');
  });

  it('blocks disallowed origin', () => {
    setAllowedOrigins('https://allowed.com');
    const req = new Request('https://example.com', {
      method: 'OPTIONS',
      headers: { origin: 'https://evil.com' },
    });
    const res = handlePreflight(req)!;
    expect(res.status).toBe(403);
  });
});

