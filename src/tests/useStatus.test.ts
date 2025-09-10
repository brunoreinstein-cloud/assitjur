import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStatus } from '@/hooks/useStatus';

describe('useStatus', () => {
  it('returns loading', () => {
    const { result } = renderHook(() => useStatus({ loading: true }));
    expect(result.current).toBe('loading');
  });

  it('returns error', () => {
    const { result } = renderHook(() => useStatus({ error: 'erro' }));
    expect(result.current).toBe('error');
  });

  it('returns empty when no data', () => {
    const { result } = renderHook(() => useStatus({}));
    expect(result.current).toBe('empty');
  });

  it('returns success when data present', () => {
    const { result } = renderHook(() => useStatus({ data: [1] }));
    expect(result.current).toBe('success');
  });

  it('detects offline', () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    const { result, unmount } = renderHook(() => useStatus({}));
    expect(result.current).toBe('offline');
    unmount();
    if (original) {
      Object.defineProperty(window.navigator, 'onLine', original);
    }
  });
});
