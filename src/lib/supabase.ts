import { supabase } from "@/integrations/supabase/client";
import {
  PorProcesso,
  PorTestemunha,
  ProcessoFilters,
  TestemunhaFilters,
  MapaTestemunhasRequest,
} from "@/types/mapa-testemunhas";
import { FunctionsHttpError } from '@supabase/supabase-js';
import { mapFunctionsError } from './functions-errors';
import { normalizeMapaRequest } from './normalizeMapaRequest';
import { SUPABASE_ANON_KEY } from './supabaseClient';
import { toast } from "@/hooks/use-toast";

// Mock data for offline functionality
const mockProcessos: PorProcesso[] = [
  {
    cnj: "0001234-56.2024.5.01.0001",
    status: "Ativo",
    uf: "RJ",
    comarca: "Rio de Janeiro",
    fase: "Instrução",
    reclamante_limpo: "Ana Lima",
    advogados_parte_ativa: ["Dr. João Silva", "Dra. Maria Santos"],
    testemunhas_ativo_limpo: ["João Pereira", "Beatriz Nunes"],
    testemunhas_passivo_limpo: ["Carlos Oliveira"],
    todas_testemunhas: ["João Pereira", "Beatriz Nunes", "Carlos Oliveira"],
    reclamante_foi_testemunha: true,
    qtd_vezes_reclamante_foi_testemunha: 2,
    cnjs_em_que_reclamante_foi_testemunha: ["0009876-12.2023.5.04.0002"],
    reclamante_testemunha_polo_passivo: false,
    cnjs_passivo: [],
    troca_direta: false,
    desenho_troca_direta: null,
    cnjs_troca_direta: [],
    triangulacao_confirmada: true,
    desenho_triangulacao: "Ana Lima → João Pereira → Beatriz Nunes",
    cnjs_triangulacao: ["0009876-12.2023.5.04.0002", "0012345-00.2022.5.02.0003"],
    testemunha_do_reclamante_ja_foi_testemunha_antes: true,
    qtd_total_depos_unicos: 2,
    cnjs_depos_unicos: ["0009876-12.2023.5.04.0002", "0012345-00.2022.5.02.0003"],
    contem_prova_emprestada: true,
    testemunhas_prova_emprestada: ["João Pereira"],
    classificacao_final: "Risco Médio",
    insight_estrategico: "Atenção especial à testemunha João Pereira que aparece em múltiplos processos.",
    org_id: "org-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    cnj: "0009876-12.2023.5.04.0002",
    status: "Ativo",
    uf: "RS",
    comarca: "Porto Alegre",
    fase: "Recurso",
    reclamante_limpo: "Carlos Souza",
    advogados_parte_ativa: ["Dr. Pedro Costa"],
    testemunhas_ativo_limpo: ["Rafael Gomes"],
    testemunhas_passivo_limpo: ["Ana Lima"],
    todas_testemunhas: ["Rafael Gomes", "Ana Lima"],
    reclamante_foi_testemunha: false,
    qtd_vezes_reclamante_foi_testemunha: 0,
    cnjs_em_que_reclamante_foi_testemunha: [],
    reclamante_testemunha_polo_passivo: false,
    cnjs_passivo: [],
    troca_direta: true,
    desenho_troca_direta: "Carlos Souza ↔ Ana Lima",
    cnjs_troca_direta: ["0001234-56.2024.5.01.0001"],
    triangulacao_confirmada: true,
    desenho_triangulacao: "Carlos Souza → Rafael Gomes → Ana Lima",
    cnjs_triangulacao: ["0001234-56.2024.5.01.0001"],
    testemunha_do_reclamante_ja_foi_testemunha_antes: false,
    qtd_total_depos_unicos: 1,
    cnjs_depos_unicos: ["0001234-56.2024.5.01.0001"],
    contem_prova_emprestada: false,
    testemunhas_prova_emprestada: [],
    classificacao_final: "Risco Alto",
    insight_estrategico: "Troca direta confirmada entre reclamante e testemunha de processo anterior.",
    org_id: "org-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    cnj: "0012345-00.2022.5.02.0003",
    status: "Encerrado",
    uf: "SP",
    comarca: "São Paulo",
    fase: "Sentença",
    reclamante_limpo: "Marina Rocha",
    advogados_parte_ativa: ["Dra. Lucia Fernandes"],
    testemunhas_ativo_limpo: [],
    testemunhas_passivo_limpo: ["João Pereira"],
    todas_testemunhas: ["João Pereira"],
    reclamante_foi_testemunha: false,
    qtd_vezes_reclamante_foi_testemunha: 0,
    cnjs_em_que_reclamante_foi_testemunha: [],
    reclamante_testemunha_polo_passivo: false,
    cnjs_passivo: [],
    troca_direta: false,
    desenho_troca_direta: null,
    cnjs_troca_direta: [],
    triangulacao_confirmada: false,
    desenho_triangulacao: null,
    cnjs_triangulacao: [],
    testemunha_do_reclamante_ja_foi_testemunha_antes: false,
    qtd_total_depos_unicos: 0,
    cnjs_depos_unicos: [],
    contem_prova_emprestada: false,
    testemunhas_prova_emprestada: [],
    classificacao_final: "Baixo",
    insight_estrategico: null,
    org_id: "org-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockTestemunhas: PorTestemunha[] = [
  {
    nome_testemunha: "João Pereira",
    qtd_depoimentos: 4,
    cnjs_como_testemunha: ["0001234-56.2024.5.01.0001", "0009876-12.2023.5.04.0002", "0012345-00.2022.5.02.0003"],
    ja_foi_reclamante: false,
    cnjs_como_reclamante: [],
    foi_testemunha_ativo: true,
    cnjs_ativo: ["0001234-56.2024.5.01.0001"],
    foi_testemunha_passivo: true,
    cnjs_passivo: ["0012345-00.2022.5.02.0003"],
    foi_testemunha_em_ambos_polos: true,
    participou_troca_favor: false,
    cnjs_troca_favor: [],
    participou_triangulacao: true,
    cnjs_triangulacao: ["0001234-56.2024.5.01.0001", "0009876-12.2023.5.04.0002"],
    e_prova_emprestada: true,
    classificacao: "Testemunha Recorrente",
    classificacao_estrategica: "Atenção",
    org_id: "org-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    nome_testemunha: "Beatriz Nunes",
    qtd_depoimentos: 2,
    cnjs_como_testemunha: ["0001234-56.2024.5.01.0001"],
    ja_foi_reclamante: true,
    cnjs_como_reclamante: ["0009876-12.2023.5.04.0002"],
    foi_testemunha_ativo: true,
    cnjs_ativo: ["0001234-56.2024.5.01.0001"],
    foi_testemunha_passivo: false,
    cnjs_passivo: [],
    foi_testemunha_em_ambos_polos: false,
    participou_troca_favor: true,
    cnjs_troca_favor: ["0009876-12.2023.5.04.0002"],
    participou_triangulacao: true,
    cnjs_triangulacao: ["0001234-56.2024.5.01.0001"],
    e_prova_emprestada: false,
    classificacao: "Testemunha e Reclamante",
    classificacao_estrategica: "Observação",
    org_id: "org-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    nome_testemunha: "Rafael Gomes",
    qtd_depoimentos: 6,
    cnjs_como_testemunha: ["0009876-12.2023.5.04.0002", "0012345-00.2022.5.02.0003"],
    ja_foi_reclamante: false,
    cnjs_como_reclamante: [],
    foi_testemunha_ativo: true,
    cnjs_ativo: ["0009876-12.2023.5.04.0002"],
    foi_testemunha_passivo: true,
    cnjs_passivo: ["0012345-00.2022.5.02.0003"],
    foi_testemunha_em_ambos_polos: true,
    participou_troca_favor: false,
    cnjs_troca_favor: [],
    participou_triangulacao: true,
    cnjs_triangulacao: ["0009876-12.2023.5.04.0002"],
    e_prova_emprestada: false,
    classificacao: "Testemunha Profissional",
    classificacao_estrategica: "Crítico",
    org_id: "org-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  try {
    return Boolean(supabase && supabase.auth);
  } catch {
    return false;
  }
};

// Fetch functions with Supabase fallback to mocks
export const fetchPorProcesso = async (
  params: MapaTestemunhasRequest<ProcessoFilters>
): Promise<{ data: PorProcesso[]; total: number }> => {
  const normalized = normalizeMapaRequest<ProcessoFilters>(params);
  const safePayload = {
    ...normalized,
    filters: normalized.filters
      ? Object.fromEntries(Object.keys(normalized.filters).map(k => [k, '[redacted]']))
      : undefined
  };
  console.debug('mapa-testemunhas-processos payload', safePayload);
  try {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase not configured, using mock data');
      throw new Error('Supabase not configured');
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Sessão inválida');
    }

    const { data, error } = await supabase.functions.invoke('mapa-testemunhas-processos', {
      method: 'POST',
      body: JSON.stringify(normalized),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (error instanceof FunctionsHttpError && error.context?.response?.status >= 400) {
      let errorPayload: any;
      try {
        errorPayload = await error.context.response.json();
      } catch {}

      const message = errorPayload?.detail || 'Falha ao carregar dados. Verifique filtros/página.';
      toast({
        title: 'Erro ao carregar dados',
        description: message,
        variant: 'destructive'
      });
      console.error('fetchPorProcesso HTTP error', {
        status: error.context.response.status,
        url: error.context.response.url,
        error: errorPayload,
        payload: safePayload
      });
      return { data: [], total: 0 };
    }

    if (error) {
      console.error('Error in fetchPorProcesso:', error.message);
      console.info('Hint: verifique filtros ou tente novamente.');
      throw error;
    }

    const payload = data as { data?: PorProcesso[]; count?: number; total?: number };
    if (!payload?.data || payload.data.length === 0) {
      console.log('📊 Supabase returned empty processos dataset');
    } else {
      console.log('📊 Fetched processos from API:', {
        count: payload.data.length,
        total: payload.count || payload.total || 0
      });
    }

    return {
      data: payload.data || [],
      total: payload.count || payload.total || 0
    };
  } catch (error) {
    if (error instanceof FunctionsHttpError) {
      throw new Error(mapFunctionsError(error));
    }
    console.warn('📊 Request failed, using mock processos data:', error);

    // Mock filtering logic
    let filteredData = [...mockProcessos];

    if (normalized.filters.search) {
      const search = normalized.filters.search.toLowerCase();
      filteredData = filteredData.filter(p =>
        p.cnj?.toLowerCase().includes(search) ||
        p.reclamante_limpo?.toLowerCase().includes(search) ||
        p.comarca?.toLowerCase().includes(search)
      );
    }

    if (normalized.filters.uf?.length) {
      filteredData = filteredData.filter(p => normalized.filters.uf!.includes(p.uf!));
    }

    if (normalized.filters.status?.length) {
      filteredData = filteredData.filter(p => normalized.filters.status!.includes(p.status!));
    }

    if (normalized.filters.fase?.length) {
      filteredData = filteredData.filter(p => normalized.filters.fase!.includes(p.fase!));
    }

    if (normalized.filters.temTriangulacao) {
      filteredData = filteredData.filter(p => p.triangulacao_confirmada === true);
    }

    if (normalized.filters.temProvaEmprestada) {
      filteredData = filteredData.filter(p => p.contem_prova_emprestada === true);
    }

    // Mock pagination
    const start = (normalized.page - 1) * normalized.limit;
    const end = start + normalized.limit;

    return {
      data: filteredData.slice(start, end),
      total: filteredData.length
    };
  }
};

export const fetchPorTestemunha = async (
  params: MapaTestemunhasRequest<TestemunhaFilters>
): Promise<{ data: PorTestemunha[]; total: number }> => {
  const normalized = normalizeMapaRequest<TestemunhaFilters>(params);
  const safePayload = {
    ...normalized,
    filters: normalized.filters
      ? Object.fromEntries(Object.keys(normalized.filters).map(k => [k, '[redacted]']))
      : undefined
  };
  console.debug('mapa-testemunhas-testemunhas payload', safePayload);
  try {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase not configured, using mock data');
      throw new Error('Supabase not configured');
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Sessão inválida');
    }

    const { data, error } = await supabase.functions.invoke('mapa-testemunhas-testemunhas', {
      method: 'POST',
      body: JSON.stringify(normalized),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (error instanceof FunctionsHttpError && error.context?.response?.status >= 400) {
      let errorPayload: any;
      try {
        errorPayload = await error.context.response.json();
      } catch {}

      const message = errorPayload?.detail || 'Falha ao carregar dados. Verifique filtros/página.';
      toast({
        title: 'Erro ao carregar dados',
        description: message,
        variant: 'destructive'
      });
      console.error('fetchPorTestemunha HTTP error', {
        status: error.context.response.status,
        url: error.context.response.url,
        error: errorPayload,
        payload: safePayload
      });
      return { data: [], total: 0 };
    }

    if (error) {
      console.error('Error in fetchPorTestemunha:', error.message);
      console.info('Hint: verifique filtros ou tente novamente.');
      throw error;
    }

    const payload = data as { data?: PorTestemunha[]; count?: number; total?: number };
    if (!payload?.data || payload.data.length === 0) {
      console.log('📊 Supabase returned empty testemunhas dataset');
    } else {
      console.log('📊 Fetched testemunhas from API:', {
        count: payload.data.length,
        total: payload.count || payload.total || 0
      });
    }

    return {
      data: payload.data || [],
      total: payload.count || payload.total || 0
    };
  } catch (error) {
    if (error instanceof FunctionsHttpError) {
      throw new Error(mapFunctionsError(error));
    }
    console.warn('📊 Request failed, using mock testemunhas data:', error);

    // Mock filtering logic
    let filteredData = [...mockTestemunhas];

    if (normalized.filters.search) {
      const search = normalized.filters.search.toLowerCase();
      filteredData = filteredData.filter(t =>
        t.nome_testemunha?.toLowerCase().includes(search)
      );
    }

    if (normalized.filters.ambosPolos !== undefined) {
      filteredData = filteredData.filter(t => t.foi_testemunha_em_ambos_polos === normalized.filters.ambosPolos);
    }

    if (normalized.filters.jaFoiReclamante !== undefined) {
      filteredData = filteredData.filter(t => t.ja_foi_reclamante === normalized.filters.jaFoiReclamante);
    }

    if (normalized.filters.temTriangulacao !== undefined) {
      filteredData = filteredData.filter(t => t.participou_triangulacao === normalized.filters.temTriangulacao);
    }

    if (normalized.filters.temTroca !== undefined) {
      filteredData = filteredData.filter(t => t.participou_troca_favor === normalized.filters.temTroca);
    }

    // Mock pagination
    const start = (normalized.page - 1) * normalized.limit;
    const end = start + normalized.limit;

    return {
      data: filteredData.slice(start, end),
      total: filteredData.length
    };
  }
};