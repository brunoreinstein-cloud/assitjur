/**
 * Types for the scoring system
 */

export interface ScoreComponent {
  score: number;
  weight: number;
  description: string;
  factor_type:
    | "DUPLO_PAPEL"
    | "PROVA_EMPRESTADA"
    | "TROCA_DIRETA"
    | "TRIANGULACAO"
    | "HOMONIMO";
}

export interface ScoreBreakdown {
  total: number;
  components: {
    [key: string]: ScoreComponent;
  };
  classification: ScoreClassification;
  recommendations: string[];
  calculated_at: string;
}

export type ScoreClassification =
  | "CRITICO"
  | "ALTO"
  | "MEDIO"
  | "BAIXO"
  | "MINIMO";

export type TestemunhaClassification =
  | "PROFISSIONAL"
  | "SUSPEITA"
  | "NORMAL"
  | "OCASIONAL";

export type ContradictaPriority =
  | "URGENTE"
  | "ALTA"
  | "MEDIA"
  | "BAIXA"
  | "NAO_RECOMENDADA";

export interface ProcessoScore {
  cnj: string;
  score_final: number;
  score_breakdown: ScoreBreakdown;
  fatores_risco: string[];
  classificacao_estrategica: string;
  prioridade_contradita: ContradictaPriority;
  confidence_level: number;
  last_updated: string;
}

export interface TestemunhaScore {
  nome: string;
  score_final: number;
  score_breakdown: ScoreBreakdown;
  classificacao: TestemunhaClassification;
  alerta_prova_emprestada: boolean;
  recomendacao_acao: string;
  risk_level: ScoreClassification;
  last_updated: string;
}

export interface ScoringMetrics {
  total_casos_analisados: number;
  distribuicao_scores: {
    critico: number;
    alto: number;
    medio: number;
    baixo: number;
    minimo: number;
  };
  avg_score: number;
  casos_contradita_recomendada: number;
  casos_investigacao_necessaria: number;
  accuracy_rate?: number;
}

export interface ScoringConfig {
  weights: {
    DUPLO_PAPEL: number;
    PROVA_EMPRESTADA: number;
    TROCA_DIRETA: number;
    TRIANGULACAO: number;
    HOMONIMO: number;
  };
  thresholds: {
    CRITICO: number;
    ALTO: number;
    MEDIO: number;
    BAIXO: number;
    MINIMO: number;
  };
  testemunha_profissional_threshold: number;
  homonym_confidence_threshold: number;
  max_score: number;
}

export interface ScoreHistory {
  cnj_or_nome: string;
  score_changes: {
    timestamp: string;
    old_score: number;
    new_score: number;
    reason: string;
    changed_components: string[];
  }[];
  trend: "INCREASING" | "DECREASING" | "STABLE";
}

export interface ScoreAlert {
  id: string;
  type:
    | "SCORE_INCREASE"
    | "NEW_CRITICAL"
    | "PATTERN_DETECTED"
    | "THRESHOLD_CROSSED";
  target: string; // CNJ or nome
  current_score: number;
  previous_score?: number;
  threshold_crossed?: ScoreClassification;
  message: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  created_at: string;
  acknowledged: boolean;
}

// Utility types
export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  color: string;
  icon: string;
}

export interface ScoreTrend {
  period: "DAY" | "WEEK" | "MONTH";
  scores: {
    date: string;
    avg_score: number;
    total_cases: number;
  }[];
  trend_direction: "UP" | "DOWN" | "STABLE";
  trend_percentage: number;
}

// Configuration constants
export const SCORE_RANGES: ScoreRange[] = [
  {
    min: 85,
    max: 100,
    label: "Crítico",
    color: "destructive",
    icon: "🔴",
  },
  {
    min: 70,
    max: 84,
    label: "Alto Risco",
    color: "destructive",
    icon: "🟠",
  },
  {
    min: 50,
    max: 69,
    label: "Médio Risco",
    color: "warning",
    icon: "🟡",
  },
  {
    min: 30,
    max: 49,
    label: "Baixo Risco",
    color: "success",
    icon: "🟢",
  },
  {
    min: 0,
    max: 29,
    label: "Risco Mínimo",
    color: "muted",
    icon: "⚪",
  },
];

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    DUPLO_PAPEL: 0.3,
    PROVA_EMPRESTADA: 0.25,
    TROCA_DIRETA: 0.2,
    TRIANGULACAO: 0.15,
    HOMONIMO: 0.1,
  },
  thresholds: {
    CRITICO: 85,
    ALTO: 70,
    MEDIO: 50,
    BAIXO: 30,
    MINIMO: 0,
  },
  testemunha_profissional_threshold: 10,
  homonym_confidence_threshold: 50,
  max_score: 100,
};
