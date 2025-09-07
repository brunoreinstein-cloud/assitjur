import { describe, it, expect, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {},
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { fetchPorProcesso } from '@/lib/supabase';

describe('get-processo handler fallback', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('falls back to mock data when supabase invoke fails', async () => {
    invokeMock.mockRejectedValue(new Error('invoke error'));

    const result = await fetchPorProcesso({
      page: 1,
      pageSize: 10,
      filters: {},
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].cnj).toBe('0001234-56.2024.5.01.0001');
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to mock data when supabase returns empty', async () => {
    invokeMock.mockResolvedValue({ data: { data: [], count: 0, total: 0 }, error: null });

    const result = await fetchPorProcesso({
      page: 1,
      pageSize: 10,
      filters: {},
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].cnj).toBe('0001234-56.2024.5.01.0001');
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });
});
