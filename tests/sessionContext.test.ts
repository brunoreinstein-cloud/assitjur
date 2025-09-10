import { describe, it, expect } from 'vitest';
import { getSessionContext } from '@/security/sessionContext';
import { calculateRiskScore } from '@/security/sessionService';

describe('session context', () => {
  it('collects basic fingerprint', () => {
    const ctx = getSessionContext();
    expect(ctx).toHaveProperty('userAgent');
    expect(ctx).toHaveProperty('timezone');
    expect(ctx).toHaveProperty('language');
  });

  it('calculates risk score for new ip and unusual hour', () => {
    const score = calculateRiskScore({ last_ip: '1.1.1.1', timezone: 'UTC', hour: 2 }, []);
    expect(score).toBeGreaterThan(0);
  });
});
