import { supabase } from "@/integrations/supabase/client";
import { getProjectRef } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import {
  PorProcesso,
  PorTestemunha,
  ProcessoFilters,
  TestemunhaFilters,
  MapaTestemunhasRequest,
} from "@/types/mapa-testemunhas";
import { toMapaEdgeRequest } from "@/lib/normalizeMapaRequest";
import { z } from "zod";

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
    .max(100)
    .default(20),
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
  params: MapaTestemunhasRequest<ProcessoFilters>,
  signal?: AbortSignal
): Promise<{ data: PorProcesso[]; total: number; error?: string }> => {
  const parsed = mapaRequestSchema.parse(params) as MapaTestemunhasRequest<ProcessoFilters>;
  const sanitized = toMapaEdgeRequest({
    ...parsed,
    filters: parsed.filters
      ? Object.fromEntries(Object.keys(parsed.filters).map(k => [k, '[redacted]']))
      : undefined
  });
  // Payload debug removed for production build
  let requestId = uuidv4();
  try {
    if (!isSupabaseConfigured()) {
      // Supabase not configured, using mock data
      throw new Error('Supabase not configured');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const access_token = sessionData?.session?.access_token;
    if (!access_token) throw new Error("Usuário não autenticado");

    const projectRef = getProjectRef();
    const fnUrl = `https://${projectRef}.functions.supabase.co/mapa-testemunhas-processos`;
    const response = await fetch(fnUrl, {
      method: 'POST',
      body: JSON.stringify(toMapaEdgeRequest(parsed)),
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        Authorization: `Bearer ${access_token}`
      },
      signal
    });

    requestId = response.headers.get('x-request-id') ?? requestId;

    let payload: any;
    try {
      payload = await response.json();
    } catch {}

    if (!response.ok) {
      const { error: err, detail, hint, example } = payload || {};
      const message = detail || hint || 'Verifique filtros e tente novamente.';
      console.error(`[${requestId}] HTTP ${response.status}: ${message}`);
      return { data: [], total: 0, error: message };
    }

    // 🔧 CRITICAL FIX: Edge Function returns { items, total } but frontend expects { data, total }
    const payloadTyped = payload as { items?: PorProcesso[]; data?: PorProcesso[]; count?: number; total?: number };
    const items = payloadTyped.items || payloadTyped.data || [];
    const total = payloadTyped.total ?? payloadTyped.count ?? 0;
    
    if (items.length === 0) {
      console.log(`[${requestId}] ✅ Empty dataset (0 records) for org - this is valid, not an error`);
    } else {
      console.log(`[${requestId}] ✅ Successfully fetched ${items.length} processos`);
    }

    return {
      data: items,
      total
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    // Request failed, using mock processos data

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
      total: filteredData.length
    };
  }
};

export const fetchPorTestemunha = async (
  params: MapaTestemunhasRequest<TestemunhaFilters>,
  signal?: AbortSignal
): Promise<{ data: PorTestemunha[]; total: number; error?: string }> => {
  const parsed = mapaRequestSchema.parse(params) as MapaTestemunhasRequest<TestemunhaFilters>;
  const sanitized = toMapaEdgeRequest({
    ...parsed,
    filters: parsed.filters
      ? Object.fromEntries(Object.keys(parsed.filters).map(k => [k, '[redacted]']))
      : undefined
  });
  // Payload debug removed for production build
  let requestId = uuidv4();
  try {
    if (!isSupabaseConfigured()) {
      // Supabase not configured, using mock data
      throw new Error('Supabase not configured');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const access_token = sessionData?.session?.access_token;
    if (!access_token) throw new Error("Usuário não autenticado");

    const projectRef = getProjectRef();
    const fnUrl = `https://${projectRef}.functions.supabase.co/mapa-testemunhas-testemunhas`;
    const response = await fetch(fnUrl, {
      method: 'POST',
      body: JSON.stringify(toMapaEdgeRequest(parsed)),
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        Authorization: `Bearer ${access_token}`
      },
      signal
    });

    requestId = response.headers.get('x-request-id') ?? requestId;

    let payload: any;
    try {
      payload = await response.json();
    } catch {}

    if (!response.ok) {
      const { error: err, detail, hint, example } = payload || {};
      const message = detail || hint || 'Verifique filtros e tente novamente.';
      console.error(`[${requestId}] HTTP ${response.status}: ${message}`);
      return { data: [], total: 0, error: message };
    }

    // 🔧 CRITICAL FIX: Edge Function returns { items, total } but frontend expects { data, total }
    const payloadTyped = payload as { items?: PorTestemunha[]; data?: PorTestemunha[]; count?: number; total?: number };
    const items = payloadTyped.items || payloadTyped.data || [];
    const total = payloadTyped.total ?? payloadTyped.count ?? 0;
    
    if (items.length === 0) {
      console.log(`[${requestId}] ✅ Empty dataset (0 records) for org - this is valid, not an error`);
    } else {
      console.log(`[${requestId}] ✅ Successfully fetched ${items.length} testemunhas`);
    }

    return {
      data: items,
      total
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    // Request failed, using mock testemunhas data

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
      total: filteredData.length
    };
  }
};