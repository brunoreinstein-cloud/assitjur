export type PorProcesso = {
  cnj: string;
  status: string | null;
  uf: string | null;
  comarca: string | null;
  fase: string | null;
  reclamante_limpo: string | null;
  advogados_parte_ativa: string[] | null;
  testemunhas_ativo_limpo: string[] | null;
  testemunhas_passivo_limpo: string[] | null;
  todas_testemunhas: string[] | null;
  reclamante_foi_testemunha: boolean | null;
  qtd_vezes_reclamante_foi_testemunha: number | null;
  cnjs_em_que_reclamante_foi_testemunha: string[] | null;
  reclamante_testemunha_polo_passivo: boolean | null;
  cnjs_passivo: string[] | null;
  troca_direta: boolean | null;
  desenho_troca_direta: string | null;
  cnjs_troca_direta: string[] | null;
  triangulacao_confirmada: boolean | null;
  desenho_triangulacao: string | null;
  cnjs_triangulacao: string[] | null;
  testemunha_do_reclamante_ja_foi_testemunha_antes: boolean | null;
  qtd_total_depos_unicos: number | null;
  cnjs_depos_unicos: string[] | null;
  contem_prova_emprestada: boolean | null;
  testemunhas_prova_emprestada: string[] | null;
  classificacao_final: string | null;
  insight_estrategico: string | null;
  org_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PorTestemunha = {
  nome_testemunha: string;
  qtd_depoimentos: number;
  foi_testemunha_em_ambos_polos: boolean;
  ja_foi_reclamante: boolean;
  participou_triangulacao: boolean;
  participou_troca_favor: boolean;
  classificacao: string | null;
  created_at?: string;
  // Legacy fields for backward compatibility
  cnjs_como_testemunha?: string[] | null;
  cnjs_como_reclamante?: string[] | null;
  foi_testemunha_ativo?: boolean | null;
  cnjs_ativo?: string[] | null;
  foi_testemunha_passivo?: boolean | null;
  cnjs_passivo?: string[] | null;
  cnjs_troca_favor?: string[] | null;
  cnjs_triangulacao?: string[] | null;
  e_prova_emprestada?: boolean | null;
  classificacao_estrategica?: string | null;
  org_id?: string | null;
  updated_at?: string;
};

export type ProcessoFilters = {
  uf?: string;
  status?: string;
  fase?: string;
  search?: string;
  testemunha?: string;
  qtdDeposMin?: number;
  qtdDeposMax?: number;
  temTriangulacao?: boolean;
  temTroca?: boolean;
  temProvaEmprestada?: boolean;
};

export type TestemunhaFilters = {
  ambosPolos?: boolean;
  jaFoiReclamante?: boolean;
  qtdDeposMin?: number;
  qtdDeposMax?: number;
  search?: string;
  temTriangulacao?: boolean;
  temTroca?: boolean;
};

export type MapaTestemunhasRequest<F = ProcessoFilters | TestemunhaFilters> = {
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filters: F;
};

// ---------------------------------------------------------------------------
// API payload types (snake_case)
// ---------------------------------------------------------------------------

export type ProcessoFiltersApi = {
  uf?: string;
  status?: string;
  fase?: string;
  search?: string;
  testemunha?: string;
  qtd_depoimentos_min?: number;
  qtd_depoimentos_max?: number;
  tem_triangulacao?: boolean;
  tem_troca?: boolean;
  tem_prova_emprestada?: boolean;
};

export type TestemunhaFiltersApi = {
  ambos_polos?: boolean;
  ja_foi_reclamante?: boolean;
  qtd_depoimentos_min?: number;
  qtd_depoimentos_max?: number;
  search?: string;
  tem_triangulacao?: boolean;
  tem_troca?: boolean;
};

/**
 * Estrutura enviada ao backend. Utilize `toMapaEdgeRequest` para converter um
 * {@link MapaTestemunhasRequest} interno (camelCase) para este formato antes de
 * realizar requisições.
 */
export type MapaTestemunhasRequestApi<
  F = ProcessoFiltersApi | TestemunhaFiltersApi
> = {
  paginacao: { page: number; limit: number };
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  filtros: F;
};

export type ImportResult = {
  stagingRows: number;
  upserts: number;
  errors: string[];
};