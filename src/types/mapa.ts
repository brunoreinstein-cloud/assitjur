// Strong typing for Mapa de Testemunhas
export type Processo = {
  cnj: string;
  uf?: string;
  comarca?: string;
  fase?: string;
  status?: string;
  reclamante_limpo: string;
  qtd_total_depos_unicos: number;
  classificacao_final: "Risco Alto" | "Risco Médio" | "Baixo" | string;
  triangulacao_confirmada: boolean;
  troca_direta: boolean;
  contem_prova_emprestada: boolean;
  todas_testemunhas: string[];
  // Additional fields from PorProcesso type
  advogados_parte_ativa?: string[] | null;
  testemunhas_ativo_limpo?: string[] | null;
  testemunhas_passivo_limpo?: string[] | null;
  reclamante_foi_testemunha?: boolean | null;
  qtd_vezes_reclamante_foi_testemunha?: number | null;
  cnjs_em_que_reclamante_foi_testemunha?: string[] | null;
  reclamante_testemunha_polo_passivo?: boolean | null;
  cnjs_passivo?: string[] | null;
  desenho_troca_direta?: string | null;
  cnjs_troca_direta?: string[] | null;
  desenho_triangulacao?: string | null;
  cnjs_triangulacao?: string[] | null;
  testemunha_do_reclamante_ja_foi_testemunha_antes?: boolean | null;
  cnjs_depos_unicos?: string[] | null;
  testemunhas_prova_emprestada?: string[] | null;
  insight_estrategico?: string | null;
  org_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Testemunha = {
  nome_testemunha: string;
  qtd_depoimentos: number;
  foi_testemunha_em_ambos_polos: boolean;
  ja_foi_reclamante: boolean;
  classificacao_estrategica: "Crítico" | "Atenção" | "Observação" | string;
  cnjs_como_testemunha: string[];
  // Additional fields from PorTestemunha type
  cnjs_como_reclamante?: string[] | null;
  foi_testemunha_ativo?: boolean | null;
  cnjs_ativo?: string[] | null;
  foi_testemunha_passivo?: boolean | null;
  cnjs_passivo?: string[] | null;
  participou_troca_favor?: boolean | null;
  cnjs_troca_favor?: string[] | null;
  participou_triangulacao?: boolean | null;
  cnjs_triangulacao?: string[] | null;
  e_prova_emprestada?: boolean | null;
  classificacao?: string | null;
  org_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FilterProcesso = {
  uf?: string;
  status?: string;
  fase?: string;
  search?: string;
  qtdDeposMin?: number;
  qtdDeposMax?: number;
};

export type FilterTestemunha = {
  ambosPolos?: boolean;
  jaFoiReclamante?: boolean;
  qtdDeposMin?: number;
  qtdDeposMax?: number;
  search?: string;
  temTriangulacao?: boolean;
  temTroca?: boolean;
};

// Export data types for CSV export
export type ExportData = Processo[] | Testemunha[];

// Error handling types
export type ErrorState = {
  hasError: boolean;
  message?: string;
};

// Statistics types
export type StatsData = {
  totalProcessos: number;
  totalTestemunhas: number;
  processosAltoRisco: number;
  testemunhasAmbosPolos: number;
  pctProcAlto: number;
  pctAmbos: number;
};

// URL sync types
export type TabType = 'processos' | 'testemunhas';