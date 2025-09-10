/**
 * @vitest-environment node
 */
import { describe, it, expect, afterEach } from 'vitest';
import { corsHeaders } from '@/middleware/cors';

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

