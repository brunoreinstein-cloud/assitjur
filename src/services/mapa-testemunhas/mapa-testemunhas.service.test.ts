import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MAPA_TESTEMUNHAS_PROCESSOS_FN,
  MAPA_TESTEMUNHAS_TESTEMUNHAS_FN,
} from '@/contracts/mapa-contracts';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { fetchTestemunhas, fetchProcessos } from './index';

const sessionMock = { data: { session: { access_token: 'token' } } };

beforeEach(() => {
  (supabase.auth.getSession as any).mockResolvedValue(sessionMock);
  (supabase.rpc as any).mockReset();
});

describe('fetchTestemunhas', () => {
  it('converte filtros para snake_case e chama RPC', async () => {
    const expected = { data: [], total: 0 };
    (supabase.rpc as any).mockResolvedValue({ data: expected, error: null });

    await fetchTestemunhas({
      page: 2,
      limit: 5,
      search: 'john',
      filters: { temTriangulacao: true, qtdDeposMin: 3 },
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      MAPA_TESTEMUNHAS_TESTEMUNHAS_FN,
      {
        paginacao: { page: 2, limit: 5 },
        filtros: {
          tem_triangulacao: true,
          qtd_depoimentos_min: 3,
          search: 'john',
        },
      }
    );
  });

  it('lança erro quando RPC falha', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('fail') });

    await expect(fetchTestemunhas({})).rejects.toThrow('Erro ao buscar testemunhas');
  });

  it('retorna vazio quando RPC não retorna dados', async () => {
    const empty = { data: [], total: 0 };
    (supabase.rpc as any).mockResolvedValue({ data: empty, error: null });

    const result = await fetchTestemunhas({});
    expect(result).toEqual(empty);
  });
});

describe('fetchProcessos', () => {
  it('converte filtros para snake_case e chama RPC', async () => {
    const expected = { data: [], total: 0 };
    (supabase.rpc as any).mockResolvedValue({ data: expected, error: null });

    await fetchProcessos({
      page: 1,
      limit: 10,
      filters: { temTroca: true, ambosPolos: true },
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      MAPA_TESTEMUNHAS_PROCESSOS_FN,
      {
        paginacao: { page: 1, limit: 10 },
        filtros: {
          tem_troca: true,
          ambos_polos: true,
        },
      }
    );
  });

  it('lança erro quando RPC falha', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('fail') });

    await expect(fetchProcessos({})).rejects.toThrow('Erro ao buscar processos');
  });

  it('retorna vazio quando RPC não retorna dados', async () => {
    const empty = { data: [], total: 0 };
    (supabase.rpc as any).mockResolvedValue({ data: empty, error: null });

    const result = await fetchProcessos({});
    expect(result).toEqual(empty);
  });
});
