import { supabase } from '@/integrations/supabase/client';
import type {
  PorTestemunha,
  TestemunhaFilters,
  ProcessoFilters,
} from '@/types/mapa-testemunhas';
import {
  ProcessosRequestSchema,
  TestemunhasRequestSchema,
} from '@/contracts/mapa-contracts';

export async function fetchTestemunhas(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<{ data: PorTestemunha[]; total: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('Usuário não autenticado');

  const body = TestemunhasRequestSchema.parse({
    paginacao: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
    filtros: {
      ...(params.filters ?? {}),
      ...(params.search ? { search: params.search } : {}),
    },
  });

  const { data, error } = await supabase.functions.invoke(
    'mapa-testemunhas-testemunhas',
    {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
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
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('Usuário não autenticado');

  const body = ProcessosRequestSchema.parse({
    paginacao: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
    filtros: params.filters ?? {},
  });

  const { data, error } = await supabase.functions.invoke(
    'mapa-testemunhas-processos',
    {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (error) {
    console.error('Error fetching processos:', error);
    throw new Error('Erro ao buscar processos');
  }

  return data;
}