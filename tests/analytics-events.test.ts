/**
 * @vitest-environment node
 */
import { describe, it, expect, afterEach, afterAll, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock environment variables with static values
vi.stubEnv('SUPABASE_TEST_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_TEST_KEY', 'test-key');

// In-memory store for intercepted analytics events
const events: any[] = [];

// Custom fetch to intercept Supabase requests
const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();
  if (url.includes('/rest/v1/analytics_events')) {
    const body = JSON.parse(init?.body as string) as any[];
    events.push(...body);
    return new Response(JSON.stringify(body), { status: 201 });
  }
  if (url.includes('/rest/v1/rpc/analytics_events_summary')) {
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.event] = (counts[e.event] ?? 0) + 1;
    }
    const summary = Object.entries(counts).map(([event, count]) => ({ event, count }));
    return new Response(JSON.stringify(summary), { status: 200 });
  }
  return Response.error();
};

const supabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_KEY!,
  { global: { fetch: fetchMock } }
);

afterEach(() => {
  events.length = 0; // Cleanup events after each test run
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('analytics_events', () => {
  it('stores and aggregates events', async () => {
    await supabase.from('analytics_events').insert([
      { event: 'beta_signup', metadata: { source: 'test' } },
      { event: 'created_first_map', metadata: { source: 'test' } },
      { event: 'nps_score', metadata: { score: 9 } }
    ]);

    const start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.rpc('analytics_events_summary', {
      start_ts: start,
      end_ts: end
    });
    expect(error).toBeNull();
    const counts = Object.fromEntries(
      (data as any[]).map((row: any) => [row.event, row.count])
    );
    expect(counts.beta_signup).toBeGreaterThan(0);
    expect(counts.created_first_map).toBeGreaterThan(0);
    expect(counts.nps_score).toBeGreaterThan(0);
  });
});
