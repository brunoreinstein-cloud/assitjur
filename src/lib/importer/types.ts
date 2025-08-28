import { z } from 'zod';

// Schemas de validação seguindo as regras específicas
export const BaseRowSchema = z.object({
  cnj: z.string().min(1),
  cnj_digits: z.string().length(20).refine(v => /^\d{20}$/.test(v), 'CNJ deve ter 20 dígitos'),
});

export const TestemunhaRowSchema = BaseRowSchema.extend({
  nome_testemunha: z.string().min(1, 'Nome da testemunha é obrigatório'),
  reclamante_nome: z.string().optional().nullable(),
  reu_nome: z.string().optional().nullable(),
});

export const ProcessoRowSchema = BaseRowSchema.extend({
  reclamante_nome: z.string().min(1, 'Nome do reclamante é obrigatório'),
  reu_nome: z.string().min(1, 'Nome do réu é obrigatório'),
});

export type TestemunhaRow = z.infer<typeof TestemunhaRowSchema>;
export type ProcessoRow = z.infer<typeof ProcessoRowSchema>;

// Tipos para detecção e mapeamento
export type SheetModel = 'testemunha' | 'processo' | 'ambiguous';

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
    testemunhas?: TestemunhaRow[];
    processos?: ProcessoRow[];
  };
  downloadUrls: {
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