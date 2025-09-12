import { supabase } from '@/integrations/supabase/client';
import type {
  PorTestemunha,
  TestemunhaFilters,
  ProcessoFilters,
} from '@/types/mapa-testemunhas';
import {
  ProcessosRequestSchema,
  TestemunhasRequestSchema,
  type ProcessosRequest,
  type TestemunhasRequest,
  MAPA_TESTEMUNHAS_PROCESSOS_FN,
  MAPA_TESTEMUNHAS_TESTEMUNHAS_FN,
} from '@/contracts/mapa-contracts';

/**
 * Converte filtros em camelCase para snake_case aceito pela API
 */
function toSnakeCaseFilters(
  filters: TestemunhaFilters | ProcessoFilters | undefined
) {
  const map: Record<string, string> = {
    temTriangulacao: 'tem_triangulacao',
    temTroca: 'tem_troca',
    temProvaEmprestada: 'tem_prova_emprestada',
    qtdDeposMin: 'qtd_depoimentos_min',
    qtdDeposMax: 'qtd_depoimentos_max',
    ambosPolos: 'ambos_polos',
    jaFoiReclamante: 'ja_foi_reclamante',
  };

  return Object.fromEntries(
    Object.entries(filters ?? {}).map(([key, value]) => [
      map[key] ?? key,
      value,
    ])
  );
}

export async function fetchTestemunhas(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<{ data: PorTestemunha[]; total: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.access_token) throw new Error('Usuário não autenticado');

  const filtros = toSnakeCaseFilters({
    ...(params.filters ?? {}),
    ...(params.search ? { search: params.search } : {}),
  });

  const body = {
    paginacao: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
    filtros,
  } satisfies TestemunhasRequest;
  TestemunhasRequestSchema.parse(body);

  // Use RPC to leverage view with pre-joined data and avoid N+1 queries
  const { data, error } = await supabase.rpc(
    MAPA_TESTEMUNHAS_TESTEMUNHAS_FN,
    body
  );

  if (error) {
    console.error('Error fetching testemunhas:', error);
    throw new Error('Erro ao buscar testemunhas');
  }

  return data;
}

export async function fetchProcessos(params: {
  page?: number;
  limit?: number;
  filters?: ProcessoFilters;
}): Promise<{ data: any[]; total: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.access_token) throw new Error('Usuário não autenticado');

  const filtros = toSnakeCaseFilters(params.filters);

  const body = {
    paginacao: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
    filtros,
  } satisfies ProcessosRequest;
  ProcessosRequestSchema.parse(body);

  // Use RPC to fetch from a safe view with necessary joins
  const { data, error } = await supabase.rpc(
    MAPA_TESTEMUNHAS_PROCESSOS_FN,
    body
  );

  if (error) {
    console.error('Error fetching processos:', error);
    throw new Error('Erro ao buscar processos');
  }

  return data;
}