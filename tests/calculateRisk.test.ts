/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateRisk, type SessionContext } from '@/security/sessionContext';

describe('calculateRisk', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns minimum risk when no factors trigger', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const ctx: SessionContext = {
      userAgent: 'Mozilla/5.0',
      timezone: 'UTC',
      language: 'en-US',
      platform: 'test',
    };
    const risk = calculateRisk('UTC', ctx);
    expect(risk).toBe(0);
    expect(risk).toBeGreaterThanOrEqual(0);
  });

  it('adds 40 points for timezone change', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const ctx: SessionContext = {
      userAgent: 'Mozilla/5.0',
      timezone: 'Europe/London',
      language: 'en-GB',
      platform: 'test',
    };
    const risk = calculateRisk('America/New_York', ctx);
    expect(risk).toBe(40);
  });

  it('adds 30 points for unusual login time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T02:00:00Z'));
    const ctx: SessionContext = {
      userAgent: 'Mozilla/5.0',
      timezone: 'UTC',
      language: 'en-US',
      platform: 'test',
    };
    const risk = calculateRisk('UTC', ctx);
    expect(risk).toBe(30);
  });

  it('adds 30 points for suspicious user agent', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const ctx: SessionContext = {
      userAgent: 'HeadlessChrome',
      timezone: 'UTC',
      language: 'en-US',
      platform: 'test',
    };
    const risk = calculateRisk('UTC', ctx);
    expect(risk).toBe(30);
  });

  it('returns maximum risk when all factors trigger', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T23:00:00Z'));
    const ctx: SessionContext = {
      userAgent: 'test-bot',
      timezone: 'Europe/London',
      language: 'en-GB',
      platform: 'test',
    };
    const risk = calculateRisk('America/New_York', ctx);
    expect(risk).toBe(100);
    expect(risk).toBeLessThanOrEqual(100);
  });
});

