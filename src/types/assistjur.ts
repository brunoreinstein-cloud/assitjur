// Tipos específicos do pipeline AssistJur.IA

export type Mode = "A" | "B" | "C";

export interface Citation {
  tribunal: string;
  data: string;
  numero: string;
  ementa: string;
  link: string;
}

export interface AssistJurProcessoRow {
  cnj: string;
  status?: string;
  fase?: string;
  uf?: string;
  comarca?: string;
  reclamantes?: string[];
  advogados_ativo?: string[];
  testemunhas_ativo?: string[];
  testemunhas_passivo?: string[];
  todas_testemunhas?: string[];
  
  // Flags analíticas derivadas
  triangulacao_confirmada?: boolean;
  desenho_triangulacao?: string;
  cnjs_triangulacao?: string[];
  contem_prova_emprestada?: boolean;
  testemunhas_prova_emprestada?: string[];
  reclamante_foi_testemunha?: boolean;
  qtd_reclamante_testemunha?: number;
  cnjs_reclamante_testemunha?: string[];
  reclamante_testemunha_polo_passivo?: boolean;
  cnjs_passivo?: string[];
  troca_direta?: boolean;
  cnjs_troca_direta?: string[];
  classificacao_final?: string;
  insight_estrategico?: string;
}

export interface TestemunhaRow {
  nome_testemunha: string;
  qtd_depoimentos: number;
  cnjs_como_testemunha: string[];
  ja_foi_reclamante?: boolean;
  cnjs_como_reclamante?: string[];
  foi_testemunha_ativo?: boolean;
  foi_testemunha_passivo?: boolean;
  cnjs_passivo?: string[];
  foi_ambos_polos?: boolean;
  participou_troca_favor?: boolean;
  cnjs_troca_favor?: string[];
  participou_triangulacao?: boolean;
  cnjs_triangulacao?: string[];
  e_prova_emprestada?: boolean;
  classificacao?: string;
  classificacao_estrategica?: string;
}

export interface ValidationIssue {
  sheet: string;
  row: number;
  column?: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  original?: any;
  fixed?: any;
}

export interface ValidationSummary {
  total_sheets: number;
  total_rows: number;
  valid_rows: number;
  error_count: number;
  warning_count: number;
  success_rate: number;
}

export interface ValidationReport {
  summary: ValidationSummary;
  issues: ValidationIssue[];
  samples: {
    processos: AssistJurProcessoRow[];
    testemunhas: TestemunhaRow[];
  };
  compliance: {
    lgpd_compliant: boolean;
    warning_message: string;
  };
}

export interface AssistJurImportResult {
  success: boolean;
  upload_id?: string;
  report?: ValidationReport;
  error?: string;
}

export interface ImportJob {
  id: string;
  org_id: string;
  upload_id: string;
  filename: string;
  file_size?: number;
  status: 'processing' | 'completed' | 'completed_with_errors' | 'failed';
  total_sheets: number;
  total_rows: number;
  valid_rows: number;
  error_count: number;
  warning_count: number;
  success_rate: number;
  processing_duration_ms?: number;
  validation_report?: ValidationReport;
  issues: ValidationIssue[];
  error_message?: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
}