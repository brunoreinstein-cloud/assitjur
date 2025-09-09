import { supabase } from "@/integrations/supabase/client";
import {
  PorProcesso,
  PorTestemunha,
  ProcessoFilters,
  TestemunhaFilters,
  MapaTestemunhasRequest,
} from "@/types/mapa-testemunhas";
import { z } from "zod";
import { fetchWithAuth } from "./fetchWithAuth";

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

// Zod schema to coerce and sanitize request params before sending
const mapaRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z
    .coerce.number()
    .int()
    .min(1)
    .default(20)
    .transform(n => (n > 200 ? 200 : n)),
  sortBy: z.string().trim().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  filters: z
    .object({
      uf: z.string().trim().optional(),
      status: z.string().trim().optional(),
      fase: z.string().trim().optional(),
      search: z.string().trim().optional(),
      testemunha: z.string().trim().optional(),
      ambosPolos: z.coerce.boolean().optional(),
      jaFoiReclamante: z.coerce.boolean().optional(),
      temTriangulacao: z.coerce.boolean().optional(),
      temTroca: z.coerce.boolean().optional(),
      temProvaEmprestada: z.coerce.boolean().optional(),
      qtdDeposMin: z.coerce.number().optional(),
      qtdDeposMax: z.coerce.number().optional(),
    })
    .passthrough()
    .default({}),
});

// Fetch functions with Supabase fallback to mocks
export const fetchPorProcesso = async (
  params: MapaTestemunhasRequest<ProcessoFilters>
): Promise<{ data: PorProcesso[]; total: number; error?: string; cid?: string }> => {
  const parsed = mapaRequestSchema.parse(params) as MapaTestemunhasRequest<ProcessoFilters>;
  const sanitized = {
    ...parsed,
    filters: parsed.filters
      ? Object.fromEntries(Object.keys(parsed.filters).map(k => [k, '[redacted]']))
      : undefined
  };
  console.debug('mapa-testemunhas-processos payload', sanitized);
  let cid: string | undefined;
  try {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase not configured, using mock data');
      throw new Error('Supabase not configured');
    }

    const { data, error, cid: fetchCid } = await fetchWithAuth<{
      data?: PorProcesso[];
      count?: number;
      total?: number;
    }>('mapa-testemunhas-processos', { body: parsed });
    cid = fetchCid;

    if (error) {
      console.error(`[cid=${cid}] fetchPorProcesso HTTP error`, {
        payload: sanitized,
        error
      });
      return { data: [], total: 0, error, cid };
    }

    const payload = data as { data?: PorProcesso[]; count?: number; total?: number };
    if (!payload?.data || payload.data.length === 0) {
      console.log(`[cid=${cid}] 📊 Supabase returned empty processos dataset`);
    } else {
      console.log(`[cid=${cid}] 📊 Fetched processos from API:`, {
        count: payload.data.length,
        total: payload.count || payload.total || 0
      });
    }

    return {
      data: payload.data || [],
      total: payload.count || payload.total || 0,
      cid
    };
  } catch (error) {
    console.warn(`[cid=${cid}] 📊 Request failed, using mock processos data:`, error);

    // Mock filtering logic
    let filteredData = [...mockProcessos];

    if (parsed.filters.search) {
      const search = parsed.filters.search.toLowerCase();
      filteredData = filteredData.filter(p =>
        p.cnj?.toLowerCase().includes(search) ||
        p.reclamante_limpo?.toLowerCase().includes(search) ||
        p.comarca?.toLowerCase().includes(search)
      );
    }

    if (parsed.filters.testemunha) {
      const search = parsed.filters.testemunha.toLowerCase();
      filteredData = filteredData.filter(p =>
        p.todas_testemunhas?.some(t => t.toLowerCase().includes(search))
      );
    }

    if (parsed.filters.uf?.length) {
      filteredData = filteredData.filter(p => parsed.filters.uf!.includes(p.uf!));
    }

    if (parsed.filters.status?.length) {
      filteredData = filteredData.filter(p => parsed.filters.status!.includes(p.status!));
    }

    if (parsed.filters.fase?.length) {
      filteredData = filteredData.filter(p => parsed.filters.fase!.includes(p.fase!));
    }

    if (parsed.filters.testemunha) {
      const search = parsed.filters.testemunha.toLowerCase();
      filteredData = filteredData.filter(p =>
        p.testemunhas_ativo_limpo?.some(t => t.toLowerCase().includes(search)) ||
        p.testemunhas_passivo_limpo?.some(t => t.toLowerCase().includes(search)) ||
        p.todas_testemunhas?.some(t => t.toLowerCase().includes(search))
      );
    }

    if (parsed.filters.temTriangulacao) {
      filteredData = filteredData.filter(p => p.triangulacao_confirmada === true);
    }

    if (parsed.filters.temProvaEmprestada) {
      filteredData = filteredData.filter(p => p.contem_prova_emprestada === true);
    }

    if (parsed.filters.testemunha) {
      const witness = parsed.filters.testemunha.toLowerCase();
      filteredData = filteredData.filter(p =>
        p.todas_testemunhas?.some(t => t.toLowerCase().includes(witness))
      );
    }

    // Mock pagination
    const start = (parsed.page - 1) * parsed.limit;
    const end = start + parsed.limit;

    return {
      data: filteredData.slice(start, end),
      total: filteredData.length,
      cid
    };
  }
};

export const fetchPorTestemunha = async (
  params: MapaTestemunhasRequest<TestemunhaFilters>
): Promise<{ data: PorTestemunha[]; total: number; error?: string; cid?: string }> => {
  const parsed = mapaRequestSchema.parse(params) as MapaTestemunhasRequest<TestemunhaFilters>;
  const sanitized = {
    ...parsed,
    filters: parsed.filters
      ? Object.fromEntries(Object.keys(parsed.filters).map(k => [k, '[redacted]']))
      : undefined
  };
  console.debug('mapa-testemunhas-testemunhas payload', sanitized);
  let cid: string | undefined;
  try {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase not configured, using mock data');
      throw new Error('Supabase not configured');
    }

    const { data, error, cid: fetchCid } = await fetchWithAuth<{
      data?: PorTestemunha[];
      count?: number;
      total?: number;
    }>('mapa-testemunhas-testemunhas', { body: parsed });
    cid = fetchCid;

    if (error) {
      console.error(`[cid=${cid}] fetchPorTestemunha HTTP error`, {
        payload: sanitized,
        error
      });
      return { data: [], total: 0, error, cid };
    }

    const payload = data as { data?: PorTestemunha[]; count?: number; total?: number };
    if (!payload?.data || payload.data.length === 0) {
      console.log(`[cid=${cid}] 📊 Supabase returned empty testemunhas dataset`);
    } else {
      console.log(`[cid=${cid}] 📊 Fetched testemunhas from API:`, {
        count: payload.data.length,
        total: payload.count || payload.total || 0
      });
    }

    return {
      data: payload.data || [],
      total: payload.count || payload.total || 0,
      cid
    };
  } catch (error) {
    console.warn(`[cid=${cid}] 📊 Request failed, using mock testemunhas data:`, error);

    // Mock filtering logic
    let filteredData = [...mockTestemunhas];

    if (parsed.filters.search) {
      const search = parsed.filters.search.toLowerCase();
      filteredData = filteredData.filter(t =>
        t.nome_testemunha?.toLowerCase().includes(search)
      );
    }

    if (parsed.filters.ambosPolos !== undefined) {
      filteredData = filteredData.filter(t => t.foi_testemunha_em_ambos_polos === parsed.filters.ambosPolos);
    }

    if (parsed.filters.jaFoiReclamante !== undefined) {
      filteredData = filteredData.filter(t => t.ja_foi_reclamante === parsed.filters.jaFoiReclamante);
    }

    if (parsed.filters.temTriangulacao !== undefined) {
      filteredData = filteredData.filter(t => t.participou_triangulacao === parsed.filters.temTriangulacao);
    }

    if (parsed.filters.temTroca !== undefined) {
      filteredData = filteredData.filter(t => t.participou_troca_favor === parsed.filters.temTroca);
    }

    // Mock pagination
    const start = (parsed.page - 1) * parsed.limit;
    const end = start + parsed.limit;

    return {
      data: filteredData.slice(start, end),
      total: filteredData.length,
      cid
    };
  }
};