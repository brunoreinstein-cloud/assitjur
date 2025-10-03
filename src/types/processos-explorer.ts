export type ProcessoRow = {
  id: string;
  org_id: string;
  version_id: string;
  cnj: string;
  cnj_digits: string;
  cnj_normalizado: string;
  status?: string;
  fase?: string;
  uf?: string;
  comarca?: string;
  tribunal?: string;
  vara?: string;
  reclamante_nome?: string;
  reclamante_cpf_mask?: string;
  reu_nome?: string;
  data_audiencia?: string;
  advogados_ativo?: string[];
  advogados_passivo?: string[];
  testemunhas_ativo?: string[];
  testemunhas_passivo?: string[];
  todas_testemunhas?: string[];
  // flags derivadas
  triangulacao_confirmada?: boolean;
  troca_direta?: boolean;
  prova_emprestada?: boolean;
  reclamante_foi_testemunha?: boolean;
  classificacao_final?: string; // Baixo/Médio/Alto
  score_risco?: number; // 0–100
  observacoes?: string;
  created_at: string;
  updated_at: string;
};

export type ProcessoQuery = {
  q?: string; // busca global
  uf?: string[]; // filtro multi
  comarca?: string[]; // depende de uf
  status?: string[];
  fase?: string[];
  testemunha?: string;
  class?: ("Baixo" | "Médio" | "Alto")[];
  scoreMin?: number;
  scoreMax?: number;
  flags?: {
    triang?: boolean;
    troca?: boolean;
    prova?: boolean;
    duplo?: boolean;
  };
  orderBy?: "updated_at" | "score_risco" | "uf" | "comarca" | "cnj";
  orderDir?: "asc" | "desc";
  page?: number;
  pageSize?: number; // 25/50/100
};

export type ProcessoFiltersState = {
  search: string;
  testemunha: string;
  uf: string[];
  comarca: string[];
  status: string[];
  fase: string[];
  classificacao: string[];
  scoreRange: [number, number];
  flags: {
    triangulacao: boolean;
    troca: boolean;
    prova: boolean;
    duplo: boolean;
  };
};

export type ColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
  width?: number;
};

export type ExportFormat = "csv" | "pdf" | "json";

export type ExportOptions = {
  format: ExportFormat;
  includeFilters: boolean;
  maskPII: boolean;
  selectedOnly: boolean;
};

export type AuditLogEntry = {
  user_id: string;
  action: string;
  table_name: string;
  filters_applied?: ProcessoQuery;
  export_format?: ExportFormat;
  pii_masked: boolean;
  records_count: number;
  timestamp: string;
};

export type VersionInfo = {
  number: number;
  publishedAt: string;
  totalRecords: number;
};
