import { describe, it, expect, vi } from 'vitest';
import { logger, createLogger } from '../../supabase/functions/_shared/logger';

describe('logger utility', () => {
  it('logs info with JSON structure', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test message', '123');
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse(spy.mock.calls[0][0]);
    expect(payload).toMatchObject({ level: 'info', msg: 'test message', correlation_id: '123' });
    expect(payload.timestamp).toBeDefined();
    spy.mockRestore();
  });

  it('logs warn with JSON structure', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('warn message', 'abc');
    const payload = JSON.parse(spy.mock.calls[0][0]);
    expect(payload).toMatchObject({ level: 'warn', msg: 'warn message', correlation_id: 'abc' });
    expect(payload.timestamp).toBeDefined();
    spy.mockRestore();
  });

  it('logs error with JSON structure using createLogger', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger('xyz');
    log.error('error occurred');
    const payload = JSON.parse(spy.mock.calls[0][0]);
    expect(payload).toMatchObject({ level: 'error', msg: 'error occurred', correlation_id: 'xyz' });
    expect(payload.timestamp).toBeDefined();
    spy.mockRestore();
  });
});
