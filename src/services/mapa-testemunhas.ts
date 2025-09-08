import { supabase } from '@/integrations/supabase/client';
import type { PorTestemunha, TestemunhaFilters } from '@/types/mapa-testemunhas';

export async function fetchTestemunhas(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<{ data: PorTestemunha[]; total: number }> {
  const { data, error } = await supabase.functions.invoke('mapa-testemunhas-testemunhas', {
    body: {
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search,
      ...params.filters
    }
  });

  if (error) {
    console.error('Error fetching testemunhas:', error);
    throw new Error('Erro ao buscar testemunhas');
  }

  return data;
}

export async function fetchProcessos(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: any[]; total: number }> {
  const { data, error } = await supabase.functions.invoke('mapa-testemunhas-processos', {
    body: {
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search
    }
  });

  if (error) {
    console.error('Error fetching processos:', error);
    throw new Error('Erro ao buscar processos');
  }

  return data;
}