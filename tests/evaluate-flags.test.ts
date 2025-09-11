/* @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { evaluateFlags, hashPercentage } from '../supabase/functions/evaluate_flags/evaluator';
import { RateLimiter } from '../supabase/functions/evaluate_flags/rateLimiter';

describe('evaluateFlags', () => {
  const base = {
    flag_id: 'flag1',
    key: 'f1',
    enabled: true,
    start_time: '2020-01-01T00:00:00Z',
    end_time: '2100-01-01T00:00:00Z',
  };

  it('segments', () => {
    const flag = { ...base, user_segments: ['beta'] };
    const yes = evaluateFlags([flag], 'user', ['beta'], [], new Date());
    expect(yes.f1).toBe(true);
    const no = evaluateFlags([flag], 'user', ['prod'], [], new Date());
    expect(no.f1).toBe(false);
  });

  it('rollout percentage', () => {
    const pct = hashPercentage('flag1', 'user1');
    const flag = { ...base, rollout_percentage: pct + 1 };
    const res = evaluateFlags([flag], 'user1', [], [], new Date());
    expect(res.f1).toBe(true);
    const flag2 = { ...base, rollout_percentage: pct };
    const res2 = evaluateFlags([flag2], 'user1', [], [], new Date());
    expect(res2.f1).toBe(false);
  });

  it('date window', () => {
    const futureFlag = { ...base, start_time: '2999-01-01T00:00:00Z' };
    const pastFlag = { ...base, end_time: '2000-01-01T00:00:00Z' };
    const resFuture = evaluateFlags([futureFlag], 'user', [], [], new Date());
    expect(resFuture.f1).toBeUndefined();
    const resPast = evaluateFlags([pastFlag], 'user', [], [], new Date());
    expect(resPast.f1).toBeUndefined();
    const activeFlag = { ...base };
    const resActive = evaluateFlags([activeFlag], 'user', [], [], new Date());
    expect(resActive.f1).toBe(true);
  });

  it('kill switch', () => {
    const flag = { ...base };
    const res = evaluateFlags([flag], 'user', [], ['flag1'], new Date());
    expect(res.f1).toBe(false);
  });
});

describe('RateLimiter', () => {
  it('denies after limit', () => {
    const rl = new RateLimiter(2, 60_000);
    expect(rl.check('u')).toBe(true);
    expect(rl.check('u')).toBe(true);
    expect(rl.check('u')).toBe(false);
  });
});
