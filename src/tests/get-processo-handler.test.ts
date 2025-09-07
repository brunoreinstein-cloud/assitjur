import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      functions: { invoke: vi.fn() },
      auth: {},
    },
  };
});

import { supabase } from '@/integrations/supabase/client';
import { fetchPorProcesso } from '@/lib/supabase';

const invokeMock = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;

describe('get-processo handler', () => {
  const params = { page: 1, pageSize: 10, filters: {} as any };

  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('returns data on 200', async () => {
    invokeMock.mockResolvedValue({ data: { data: [{ cnj: '1' }], count: 1 }, error: null });
    const result = await fetchPorProcesso(params);
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('falls back on 401', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { status: 401 } });
    const result = await fetchPorProcesso(params);
    expect(result.total).toBeGreaterThan(0);
  });

  it('falls back on 404', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { status: 404 } });
    const result = await fetchPorProcesso(params);
    expect(result.total).toBeGreaterThan(0);
  });

  it('falls back on 500', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { status: 500 } });
    const result = await fetchPorProcesso(params);
    expect(result.total).toBeGreaterThan(0);
  });
});
