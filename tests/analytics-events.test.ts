/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

const url = process.env.SUPABASE_TEST_URL as string | undefined;
const key = process.env.SUPABASE_TEST_KEY as string | undefined;

const supabase = url && key ? createClient(url, key) : null;

describe('analytics_events', () => {
  it('stores and aggregates events', async () => {
    if (!supabase) {
      console.warn('Skipping analytics_events test due to missing Supabase env vars');
      return;
    }

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
