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
import { DebugMode } from '@/lib/debug-mode';

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
  console.warn('⚠️ MODO FALLBACK: Usando dados mock para testemunhas (API não disponível)');
  if (DebugMode.isEnabled()) {
    console.table({ mode: 'FALLBACK', type: 'TESTEMUNHAS', page, limit });
  }
  
  const mockData: PorTestemunha[] = [
    {
      nome: "Maria Silva Santos",
      qtd_depoimentos: 8,
      qtd_testemunha: 6,
      qtd_reclamante: 2,
      participa_troca_favor: true,
      participa_triangulacao: true,
      ambos_polos: true,
      ja_foi_reclamante: true,
    },
    {
      nome: "João Paulo Oliveira",
      qtd_depoimentos: 5,
      qtd_testemunha: 5,
      qtd_reclamante: 0,
      participa_troca_favor: false,
      participa_triangulacao: true,
      ambos_polos: false,
      ja_foi_reclamante: false,
    },
    {
      nome: "Ana Costa Ferreira",
      qtd_depoimentos: 12,
      qtd_testemunha: 8,
      qtd_reclamante: 4,
      participa_troca_favor: true,
      participa_triangulacao: false,
      ambos_polos: true,
      ja_foi_reclamante: true,
    },
  ];

  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: mockData.slice(start, end),
    total: mockData.length
  };
}

export async function fetchTestemunhas(params: {
  page?: number;
  limit?: number;
  search?: string;
  filters?: TestemunhaFilters;
}): Promise<{ data: PorTestemunha[]; total: number; error?: string }> {
  const requestId = Math.random().toString(36).substring(7);
  
  DebugMode.log(`🔍 [${requestId}] fetchTestemunhas iniciado`, {
    page: params.page,
    limit: params.limit,
    search: params.search,
    filters: params.filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      DebugMode.error(`❌ [${requestId}] Usuário não autenticado`);
      return getMockTestemunhasData(params.page || 1, params.limit || 20);
    }

    DebugMode.log(`✅ [${requestId}] Sessão válida`, {
      userId: sessionData.session.user?.id,
      hasToken: !!sessionData.session.access_token,
    });

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
    
    DebugMode.log(`📦 [${requestId}] Payload preparado`, body);
    TestemunhasRequestSchema.parse(body);

    // Use Edge Function com retry automático
    const result = await retryWithBackoff(async () => {
      DebugMode.log(`🚀 [${requestId}] Chamando Edge Function: ${MAPA_TESTEMUNHAS_TESTEMUNHAS_FN}`);
      
      const { data, error } = await supabase.functions.invoke(
        MAPA_TESTEMUNHAS_TESTEMUNHAS_FN,
        { body }
      );

      if (error) {
        DebugMode.error(`❌ [${requestId}] Erro na Edge Function:`, error);
        throw new Error(`Erro ao buscar testemunhas: ${error.message}`);
      }

      if (!data || !data.items) {
        DebugMode.log(`✅ [${requestId}] Empty dataset (0 records) - this is valid, not an error`);
        return { data: [], total: 0 };
      }

      DebugMode.log(`✅ [${requestId}] Resposta recebida`, {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        itemsCount: data.items?.length || 0,
      });

      return { data: data.items, total: data.total || 0 };
    });

    DebugMode.log(`🎉 [${requestId}] fetchTestemunhas concluído com sucesso`);
    return result;
  } catch (error) {
    DebugMode.error(`💥 [${requestId}] Erro fatal ao buscar testemunhas:`, error);
    // Fallback para dados mock em caso de erro
    const fallback = getMockTestemunhasData(params.page || 1, params.limit || 20);
    return {
      ...fallback,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar testemunhas'
    };
  }
}

/**
 * Fallback para dados mock de processos quando API falha
 */
function getMockProcessosData(page: number, limit: number): { data: any[]; total: number } {
  console.warn('⚠️ MODO FALLBACK: Usando dados mock para processos (API não disponível)');
  if (DebugMode.isEnabled()) {
    console.table({ mode: 'FALLBACK', type: 'PROCESSOS', page, limit });
  }
  
  const mockData = [
    {
      cnj: "0001234-56.2024.5.02.0001",
      reclamante: "EMPRESA XYZ LTDA",
      reclamada: "FORNECEDOR ABC S.A.",
      testemunhas_ativo: ["Maria Silva Santos", "João Paulo Oliveira"],
      testemunhas_passivo: ["Ana Costa Ferreira"],
      tem_triangulacao: true,
      tem_troca: true,
      tem_prova_emprestada: false,
      comarca: "São Paulo",
      vara: "1ª Vara do Trabalho",
    },
    {
      cnj: "0007890-12.2024.5.02.0002",
      reclamante: "TECH SOLUTIONS LTDA",
      reclamada: "CLIENTE SERVIÇOS S.A.",
      testemunhas_ativo: ["Ana Costa Ferreira"],
      testemunhas_passivo: ["Maria Silva Santos", "João Paulo Oliveira"],
      tem_triangulacao: false,
      tem_troca: true,
      tem_prova_emprestada: true,
      comarca: "Rio de Janeiro",
      vara: "3ª Vara do Trabalho",
    },
  ];

  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    data: mockData.slice(start, end),
    total: mockData.length
  };
}

export async function fetchProcessos(params: {
  page?: number;
  limit?: number;
  filters?: ProcessoFilters;
}): Promise<{ data: any[]; total: number; error?: string }> {
  const requestId = Math.random().toString(36).substring(7);
  
  DebugMode.log(`🔍 [${requestId}] fetchProcessos iniciado`, {
    page: params.page,
    limit: params.limit,
    filters: params.filters,
    timestamp: new Date().toISOString(),
  });

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) {
      DebugMode.error(`❌ [${requestId}] Usuário não autenticado`);
      return getMockProcessosData(params.page || 1, params.limit || 20);
    }

    DebugMode.log(`✅ [${requestId}] Sessão válida`, {
      userId: sessionData.session.user?.id,
      hasToken: !!sessionData.session.access_token,
    });

    const filtros = toSnakeCaseFilters(params.filters);

    const body = {
      paginacao: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
      filtros,
    } satisfies ProcessosRequest;
    
    DebugMode.log(`📦 [${requestId}] Payload preparado`, body);
    ProcessosRequestSchema.parse(body);

    // Use Edge Function com retry automático
    const result = await retryWithBackoff(async () => {
      DebugMode.log(`🚀 [${requestId}] Chamando Edge Function: ${MAPA_TESTEMUNHAS_PROCESSOS_FN}`);
      
      const { data, error } = await supabase.functions.invoke(
        MAPA_TESTEMUNHAS_PROCESSOS_FN,
        { body }
      );

      if (error) {
        DebugMode.error(`❌ [${requestId}] Erro na Edge Function:`, error);
        throw new Error(`Erro ao buscar processos: ${error.message}`);
      }

      if (!data || !data.items) {
        DebugMode.log(`✅ [${requestId}] Empty dataset (0 records) - this is valid, not an error`);
        return { data: [], total: 0 };
      }

      DebugMode.log(`✅ [${requestId}] Resposta recebida`, {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        itemsCount: data.items?.length || 0,
      });

      return { data: data.items, total: data.total || 0 };
    });

    DebugMode.log(`🎉 [${requestId}] fetchProcessos concluído com sucesso`);
    return result;
  } catch (error) {
    DebugMode.error(`💥 [${requestId}] Erro fatal ao buscar processos:`, error);
    // Fallback para dados mock em caso de erro
    const fallback = getMockProcessosData(params.page || 1, params.limit || 20);
    return {
      ...fallback,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar processos'
    };
  }
}