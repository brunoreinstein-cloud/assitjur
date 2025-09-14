/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { getSessionContext, calculateRisk } from '@/security/sessionContext';

describe('getSessionContext', () => {
  it('collects basic fingerprint data', () => {
    const ctx = getSessionContext();
    expect(ctx.userAgent).toBe(navigator.userAgent);
    expect(ctx.timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(ctx.language).toBe(navigator.language);
    expect(ctx.platform).toBe(navigator.platform);
  });
});

describe('calculateRisk', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for normal sessions', () => {
    vi.setSystemTime(new Date('2023-01-01T12:00:00'));
    const ctx = {
      userAgent: 'Mozilla/5.0',
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      platform: 'Win'
    };
    expect(calculateRisk('America/Sao_Paulo', ctx)).toBe(0);
  });

  it('handles missing previous timezone', () => {
    vi.setSystemTime(new Date('2023-01-01T12:00:00'));
    const ctx = {
      userAgent: 'Mozilla/5.0',
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      platform: 'Win'
    };
    expect(calculateRisk(null, ctx)).toBe(0);
  });

  it('detects suspicious contexts', () => {
    vi.setSystemTime(new Date('2023-01-01T03:00:00'));
    const ctx = {
      userAgent: 'HeadlessBot',
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      platform: 'Win'
    };
    expect(calculateRisk('Europe/London', ctx)).toBe(100);
  });
});
