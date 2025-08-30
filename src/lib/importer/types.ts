import { z } from 'zod';

// Schemas de validação alinhados com a tabela processos do Supabase
export const ProcessoRowSchema = z.object({
  cnj: z.string().min(1, 'CNJ é obrigatório'),
  cnj_digits: z.string().length(20).refine(v => /^\d{20}$/.test(v), 'CNJ deve ter 20 dígitos'),
  reclamante_nome: z.string().min(1, 'Nome do reclamante é obrigatório'),
  reu_nome: z.string().min(1, 'Nome do réu é obrigatório'),
  comarca: z.string().optional().nullable(),
  tribunal: z.string().optional().nullable(),
  vara: z.string().optional().nullable(),
  fase: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  reclamante_cpf_mask: z.string().optional().nullable(),
  data_audiencia: z.string().optional().nullable(), // String que será convertida para date
  advogados_ativo: z.array(z.string()).optional().nullable(),
  advogados_passivo: z.array(z.string()).optional().nullable(),
  testemunhas_ativo: z.array(z.string()).optional().nullable(),
  testemunhas_passivo: z.array(z.string()).optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

// Para compatibilidade com sistema antigo
export const TestemunhaRowSchema = z.object({
  cnj: z.string().min(1),
  cnj_digits: z.string().length(20).refine(v => /^\d{20}$/.test(v), 'CNJ deve ter 20 dígitos'),
  nome_testemunha: z.string().min(1, 'Nome da testemunha é obrigatório'),
  reclamante_nome: z.string().optional().nullable(),
  reu_nome: z.string().optional().nullable(),
});

export type ProcessoRow = z.infer<typeof ProcessoRowSchema>;
export type TestemunhaRow = z.infer<typeof TestemunhaRowSchema>;

// Tipos para detecção e mapeamento  
export type SheetModel = 'processo' | 'testemunha' | 'ambiguous' | 'ignore';

export interface DetectedSheet {
  name: string;
  model: SheetModel;
  rows: number;
  headers: string[];
  sampleData: Record<string, any>[];
  hasListColumn?: boolean; // Para CNJs_Como_Testemunha
}

export interface ImportSession {
  fileName: string;
  fileSize: number;
  sheets: DetectedSheet[];
  uploadedAt: Date;
  sessionId: string;
}

// Tipos para validação
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  sheet: string;
  row: number;
  column: string;
  severity: ValidationSeverity;
  rule: string;
  message?: string; // Make optional temporarily
  value: any;
  autofilled?: boolean;
  originalColumn?: string; // Nome original da coluna no arquivo
}

export interface ValidationSummary {
  analyzed: number;
  valid: number;
  errors: number;
  warnings: number;
  infos: number;
}

export interface ValidationResult {
  summary: ValidationSummary;
  issues: ValidationIssue[];
  normalizedData: {
    processos?: ProcessoRow[];
    testemunhas?: TestemunhaRow[];
  };
  downloadUrls?: {
    fixedXlsx: string;
    reportCsv: string;
    reportJson: string;
  };
  corrections?: Map<string, any>;
}

// Configurações da organização
export interface OrgSettings {
  orgId: string;
  defaultReuNome?: string;
  applyDefaultReuOnTestemunha: boolean;
  requireReuOnProcesso: boolean;
  updatedAt: Date;
}

// Tipos para mapeamento de colunas
export interface ColumnMapping {
  original: string;
  normalized: string;
  required: boolean;
  mapped: boolean;
}

export interface HeaderMappingResult {
  mappings: ColumnMapping[];
  unmapped: string[];
  ambiguous: string[];
  confidence: number;
}