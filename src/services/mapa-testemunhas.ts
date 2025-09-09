import { supabase } from '@/integrations/supabase/client';
import type {
  PorTestemunha,
  TestemunhaFilters,
  ProcessoFilters,
  PaginatedResponse,
  Cursor
} from '@/types/mapa-testemunhas';

export async function fetchTestemunhas(params: {
  cursor?: Cursor | null;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<PaginatedResponse<PorTestemunha>> {
  const { data, error } = await supabase.functions.invoke<{
    data?: PorTestemunha[];
    next_cursor?: Cursor | null;
  }>('mapa-testemunhas-testemunhas', {
    body: {
      cursor: params.cursor,
      limit: params.limit || 20,
      search: params.search,
      ...params.filters
    }
  });

  if (error) {
    console.error('Error fetching testemunhas:', error);
    throw new Error('Erro ao buscar testemunhas');
  }

  return {
    data: data?.data || [],
    next_cursor: data?.next_cursor ?? null,
  };
}

export async function fetchProcessos(params: {
  cursor?: Cursor | null;
  limit?: number;
  filters?: ProcessoFilters;
}): Promise<PaginatedResponse<any>> {
  const { data, error } = await supabase.functions.invoke<{
    data?: any[];
    next_cursor?: Cursor | null;
  }>('mapa-testemunhas-processos', {
    body: {
      cursor: params.cursor,
      limit: params.limit || 20,
      filters: params.filters
    }
  });

  if (error) {
    console.error('Error fetching processos:', error);
    throw new Error('Erro ao buscar processos');
  }

  return {
    data: data?.data || [],
    next_cursor: data?.next_cursor ?? null,
  };
}