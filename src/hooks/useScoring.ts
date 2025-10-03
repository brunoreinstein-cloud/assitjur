import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScoringEngine } from "@/lib/scoring/scoring-engine";
import { usePatternAnalysis } from "@/hooks/usePatternAnalysis";
import type {
  ProcessoScore,
  TestemunhaScore,
  ScoringMetrics,
  ScoreHistory,
} from "@/types/scoring";
import type { AnalysisResult } from "@/types/mapa-testemunhas-analysis";

/**
 * Hook for scoring operations
 */
export function useScoring() {
  const queryClient = useQueryClient();
  const { analysisResult, isLoading: analysisLoading } = usePatternAnalysis();

  const [processoScores, setProcessoScores] = useState<
    Map<string, ProcessoScore>
  >(new Map());
  const [testemunhaScores, setTestemunhaScores] = useState<
    Map<string, TestemunhaScore>
  >(new Map());

  // Calculate scores when analysis results change
  useEffect(() => {
    if (!analysisResult) return;

    const newProcessoScores = new Map<string, ProcessoScore>();
    const newTestemunhaScores = new Map<string, TestemunhaScore>();

    // Calculate processo scores
    const allCnjs = new Set<string>();

    // Collect all CNJs from analysis patterns
    analysisResult.duploPapel.forEach((d) => {
      d.cnjs_como_reclamante.forEach((cnj) => allCnjs.add(cnj));
      d.cnjs_como_testemunha.forEach((cnj) => allCnjs.add(cnj));
    });

    analysisResult.provaEmprestada.forEach((p) => {
      p.cnjs.forEach((cnj) => allCnjs.add(cnj));
    });

    analysisResult.trocaDireta.forEach((t) => {
      t.cnjsA.forEach((cnj) => allCnjs.add(cnj));
      t.cnjsB.forEach((cnj) => allCnjs.add(cnj));
    });

    analysisResult.triangulacao.forEach((t) => {
      t.cnjs.forEach((cnj) => allCnjs.add(cnj));
    });

    analysisResult.homonimos.forEach((h) => {
      h.cnjs_suspeitos.forEach((cnj) => allCnjs.add(cnj));
    });

    // Calculate scores for each processo
    Array.from(allCnjs).forEach((cnj) => {
      const score = ScoringEngine.calculateProcessoScore(cnj, analysisResult);
      newProcessoScores.set(cnj, score);
    });

    // Calculate testemunha scores
    const allTestemunhas = new Set<string>();

    analysisResult.duploPapel.forEach((d) => allTestemunhas.add(d.nome));
    analysisResult.provaEmprestada.forEach((p) => allTestemunhas.add(p.nome));
    analysisResult.trocaDireta.forEach((t) => {
      allTestemunhas.add(t.testemunhaA);
      allTestemunhas.add(t.testemunhaB);
    });
    analysisResult.triangulacao.forEach((t) => {
      t.ciclo.forEach((nome) => allTestemunhas.add(nome));
    });
    analysisResult.homonimos.forEach((h) => allTestemunhas.add(h.nome));

    Array.from(allTestemunhas).forEach((nome) => {
      const score = ScoringEngine.calculateTestemunhaScore(
        nome,
        analysisResult,
      );
      newTestemunhaScores.set(nome, score);
    });

    setProcessoScores(newProcessoScores);
    setTestemunhaScores(newTestemunhaScores);
  }, [analysisResult]);

  // Scoring metrics calculation
  const scoringMetrics = useMemo((): ScoringMetrics | null => {
    if (processoScores.size === 0) return null;

    const scores = Array.from(processoScores.values()).map(
      (p) => p.score_final,
    );
    const distribuicao = {
      critico: scores.filter((s) => s >= 85).length,
      alto: scores.filter((s) => s >= 70 && s < 85).length,
      medio: scores.filter((s) => s >= 50 && s < 70).length,
      baixo: scores.filter((s) => s >= 30 && s < 50).length,
      minimo: scores.filter((s) => s < 30).length,
    };

    return {
      total_casos_analisados: processoScores.size,
      distribuicao_scores: distribuicao,
      avg_score: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      casos_contradita_recomendada: Array.from(processoScores.values()).filter(
        (p) => ["URGENTE", "ALTA", "MEDIA"].includes(p.prioridade_contradita),
      ).length,
      casos_investigacao_necessaria: Array.from(processoScores.values()).filter(
        (p) => p.prioridade_contradita === "NAO_RECOMENDADA",
      ).length,
    };
  }, [processoScores]);

  // Get scores by classification
  const getProcessosByClassification = (
    classification: "CRITICO" | "ALTO" | "MEDIO" | "BAIXO" | "MINIMO",
  ) => {
    return Array.from(processoScores.values())
      .filter((p) => p.score_breakdown.classification === classification)
      .sort((a, b) => b.score_final - a.score_final);
  };

  const getTestemunhasByClassification = (
    classification: "PROFISSIONAL" | "SUSPEITA" | "NORMAL" | "OCASIONAL",
  ) => {
    return Array.from(testemunhaScores.values())
      .filter((t) => t.classificacao === classification)
      .sort((a, b) => b.score_final - a.score_final);
  };

  // Get high priority cases
  const getHighPriorityCases = () => {
    return Array.from(processoScores.values())
      .filter((p) => ["URGENTE", "ALTA"].includes(p.prioridade_contradita))
      .sort((a, b) => {
        const priorityOrder = { URGENTE: 2, ALTA: 1 };
        return (
          priorityOrder[b.prioridade_contradita as keyof typeof priorityOrder] -
          priorityOrder[a.prioridade_contradita as keyof typeof priorityOrder]
        );
      });
  };

  // Get critical testemunhas
  const getCriticalTestemunhas = () => {
    return Array.from(testemunhaScores.values())
      .filter((t) => t.score_final >= 70)
      .sort((a, b) => b.score_final - a.score_final);
  };

  // Get specific scores
  const getProcessoScore = (cnj: string): ProcessoScore | undefined => {
    return processoScores.get(cnj);
  };

  const getTestemunhaScore = (nome: string): TestemunhaScore | undefined => {
    return testemunhaScores.get(nome);
  };

  // Recalculate scores manually
  const recalculateScores = () => {
    if (analysisResult) {
      // Trigger recalculation by updating the analysis
      queryClient.invalidateQueries({ queryKey: ["pattern-analysis"] });
    }
  };

  // Export scores for reporting
  const exportScores = () => {
    const data = {
      processos: Array.from(processoScores.values()),
      testemunhas: Array.from(testemunhaScores.values()),
      metrics: scoringMetrics,
      generated_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scores_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    // Data
    processoScores: Array.from(processoScores.values()),
    testemunhaScores: Array.from(testemunhaScores.values()),
    scoringMetrics,

    // States
    isLoading: analysisLoading,
    hasScores: processoScores.size > 0 || testemunhaScores.size > 0,

    // Getters
    getProcessosByClassification,
    getTestemunhasByClassification,
    getHighPriorityCases,
    getCriticalTestemunhas,
    getProcessoScore,
    getTestemunhaScore,

    // Actions
    recalculateScores,
    exportScores,

    // Computed values
    totalProcessos: processoScores.size,
    totalTestemunhas: testemunhaScores.size,
    avgProcessoScore: scoringMetrics?.avg_score || 0,
    criticalCases: getProcessosByClassification("CRITICO").length,
    urgentCases: getHighPriorityCases().filter(
      (p) => p.prioridade_contradita === "URGENTE",
    ).length,
  };
}

/**
 * Hook for individual score tracking
 */
export function useScoreTracker(
  identifier: string,
  type: "processo" | "testemunha",
) {
  const { getProcessoScore, getTestemunhaScore } = useScoring();
  const [history, setHistory] = useState<ScoreHistory | null>(null);

  const currentScore =
    type === "processo"
      ? getProcessoScore(identifier)
      : getTestemunhaScore(identifier);

  // Track score changes (in a real app, this would come from backend)
  useEffect(() => {
    if (currentScore && !history) {
      setHistory({
        cnj_or_nome: identifier,
        score_changes: [
          {
            timestamp: new Date().toISOString(),
            old_score: 0,
            new_score: currentScore.score_final,
            reason: "Initial calculation",
            changed_components: Object.keys(
              currentScore.score_breakdown.components,
            ),
          },
        ],
        trend: "STABLE",
      });
    }
  }, [currentScore, history, identifier]);

  return {
    currentScore,
    history,
    hasScore: !!currentScore,
    scoreChange:
      history && history.score_changes.length > 1
        ? history.score_changes[history.score_changes.length - 1].new_score -
          history.score_changes[history.score_changes.length - 2].new_score
        : 0,
  };
}

/**
 * Hook for score monitoring and alerts
 */
export function useScoreMonitoring() {
  const { processoScores, testemunhaScores, criticalCases, urgentCases } =
    useScoring();
  const [alerts, setAlerts] = useState<any[]>([]);

  // Monitor for critical score changes
  useEffect(() => {
    const newAlerts = [];

    // Check for urgent cases
    if (urgentCases > 0) {
      newAlerts.push({
        id: "urgent-cases",
        type: "NEW_CRITICAL",
        message: `${urgentCases} caso(s) com contradita urgente detectado(s)`,
        severity: "HIGH",
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Check for critical cases
    if (criticalCases > 0) {
      newAlerts.push({
        id: "critical-cases",
        type: "THRESHOLD_CROSSED",
        message: `${criticalCases} caso(s) crítico(s) detectado(s)`,
        severity: "HIGH",
        created_at: new Date().toISOString(),
        acknowledged: false,
      });
    }

    setAlerts(newAlerts);
  }, [urgentCases, criticalCases]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts: alerts.filter((a) => !a.acknowledged),
    allAlerts: alerts,
    hasUnacknowledgedAlerts: alerts.some((a) => !a.acknowledged),
    acknowledgeAlert,
    clearAllAlerts,
  };
}
