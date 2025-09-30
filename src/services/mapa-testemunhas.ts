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

/**
 * Retry helper com backoff exponencial
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Tentativa ${attempt + 1} falhou, aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Fallback para dados mock quando API falha
 */
function getMockTestemunhasData(page: number, limit: number): { data: PorTestemunha[]; total: number } {
  console.warn('Usando dados mock para testemunhas (API não disponível)');
  return {
    data: [],
    total: 0
  };
}

export async function fetchTestemunhas(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<{ data: PorTestemunha[]; total: number }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      console.error('Usuário não autenticado');
      return getMockTestemunhasData(params.page || 1, params.limit || 20);
    }

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

    // Use RPC com retry automático
    const result = await retryWithBackoff(async () => {
      const { data, error } = await supabase.rpc(
        MAPA_TESTEMUNHAS_TESTEMUNHAS_FN,
        body
      );

      if (error) {
        console.error('Error fetching testemunhas:', error);
        throw new Error(`Erro ao buscar testemunhas: ${error.message}`);
      }

      return data;
    });

    return result;
  } catch (error) {
    console.error('Erro fatal ao buscar testemunhas:', error);
    // Fallback para dados mock em caso de erro
    return getMockTestemunhasData(params.page || 1, params.limit || 20);
  }
}

/**
 * Fallback para dados mock de processos quando API falha
 */
function getMockProcessosData(page: number, limit: number): { data: any[]; total: number } {
  console.warn('Usando dados mock para processos (API não disponível)');
  return {
    data: [],
    total: 0
  };
}

export async function fetchProcessos(params: {
  page?: number;
  limit?: number;
  filters?: ProcessoFilters;
}): Promise<{ data: any[]; total: number }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      console.error('Usuário não autenticado');
      return getMockProcessosData(params.page || 1, params.limit || 20);
    }

    const filtros = toSnakeCaseFilters(params.filters);

    const body = {
      paginacao: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
      filtros,
    } satisfies ProcessosRequest;
    
    ProcessosRequestSchema.parse(body);

    // Use RPC com retry automático
    const result = await retryWithBackoff(async () => {
      const { data, error } = await supabase.rpc(
        MAPA_TESTEMUNHAS_PROCESSOS_FN,
        body
      );

      if (error) {
        console.error('Error fetching processos:', error);
        throw new Error(`Erro ao buscar processos: ${error.message}`);
      }

      return data;
    });

    return result;
  } catch (error) {
    console.error('Erro fatal ao buscar processos:', error);
    // Fallback para dados mock em caso de erro
    return getMockProcessosData(params.page || 1, params.limit || 20);
  }
}