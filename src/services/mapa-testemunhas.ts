import { supabase } from '@/integrations/supabase/client';
import type { PorTestemunha, TestemunhaFilters, ProcessoFilters } from '@/types/mapa-testemunhas';

export async function fetchTestemunhas(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<{ data: PorTestemunha[]; total: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const { data, error } = await supabase.functions.invoke('mapa-testemunhas-testemunhas', {
    body: {
      paginacao: { page: params.page || 1, limit: params.limit || 20 },
      filtros: { ...(params.filters || {}), search: params.search }
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (error) {
    console.error('Error fetching testemunhas:', error);
    throw new Error('Erro ao buscar testemunhas');
  }

  return { data: data.items, total: data.total };
}

export async function fetchProcessos(params: {
  page?: number;
  limit?: number;
  filters?: ProcessoFilters;
}): Promise<{ data: any[]; total: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const { data, error } = await supabase.functions.invoke('mapa-testemunhas-processos', {
    body: {
      paginacao: { page: params.page || 1, limit: params.limit || 20 },
      filtros: params.filters
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (error) {
    console.error('Error fetching processos:', error);
    throw new Error('Erro ao buscar processos');
  }

  return { data: data.items, total: data.total };
}