// Export all report components
export { ConclusiveReportTemplate, type ConclusiveReportData } from '@/components/reports/ConclusiveReportTemplate';
export { ReportGenerator } from '@/components/reports/ReportGenerator';

// Re-export related types for convenience
export type {
  AnalysisResult,
  TrocaDiretaResult,
  TriangulacaoResult,
  DuploPapelResult,
  ProvaEmprestadaResult,
  HomonimoResult,
  PadroesAgregados
} from '@/types/mapa-testemunhas-analysis';

export type {
  ProcessoScore,
  TestemunhaScore,
  ScoringMetrics,
  ScoreClassification,
  ContradictaPriority,
  TestemunhaClassification
} from '@/types/scoring';