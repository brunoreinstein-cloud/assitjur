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

export async function fetchTestemunhas(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<{ data: PorTestemunha[]; total: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('Usuário não autenticado');

  const body = {
    paginacao: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
    filtros: {
      ...(params.filters ?? {}),
      ...(params.search ? { search: params.search } : {}),
    },
  } satisfies TestemunhasRequest;
  TestemunhasRequestSchema.parse(body);

  const { data, error } = await supabase.functions.invoke(
    MAPA_TESTEMUNHAS_TESTEMUNHAS_FN,
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

  const body = {
    paginacao: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
    filtros: params.filters ?? {},
  } satisfies ProcessosRequest;
  ProcessosRequestSchema.parse(body);

  const { data, error } = await supabase.functions.invoke(
    MAPA_TESTEMUNHAS_PROCESSOS_FN,
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