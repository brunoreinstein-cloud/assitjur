import type {
  AnalysisResult,
  RiscoLevel,
} from "@/types/mapa-testemunhas-analysis";

/**
 * Utility functions for pattern analysis operations
 */

/**
 * Risk level styling and labels
 */
export const RISCO_CONFIG = {
  ALTO: {
    label: "Alto Risco",
    color: "destructive",
    priority: 3,
    icon: "🔴",
  },
  MEDIO: {
    label: "Médio Risco",
    color: "warning",
    priority: 2,
    icon: "🟡",
  },
  BAIXO: {
    label: "Baixo Risco",
    color: "success",
    priority: 1,
    icon: "🟢",
  },
} as const;

/**
 * Probability level styling and labels
 */
export const PROBABILIDADE_CONFIG = {
  ALTA: {
    label: "Alta Probabilidade",
    color: "destructive",
    priority: 3,
    icon: "⚠️",
  },
  MEDIA: {
    label: "Média Probabilidade",
    color: "warning",
    priority: 2,
    icon: "⚡",
  },
  BAIXA: {
    label: "Baixa Probabilidade",
    color: "muted",
    priority: 1,
    icon: "ℹ️",
  },
} as const;

/**
 * Pattern type configurations
 */
export const PATTERN_CONFIG = {
  trocaDireta: {
    label: "Troca Direta",
    description: "Testemunhas que depõem umas para as outras",
    icon: "🔄",
    color: "blue",
  },
  triangulacao: {
    label: "Triangulação",
    description: "Redes circulares de testemunhas",
    icon: "🔺",
    color: "purple",
  },
  duploPapel: {
    label: "Duplo Papel",
    description: "Pessoas que são reclamantes e testemunhas",
    icon: "👥",
    color: "orange",
  },
  provaEmprestada: {
    label: "Prova Emprestada",
    description: "Testemunhas profissionais (>10 depoimentos)",
    icon: "📋",
    color: "red",
  },
  homonimos: {
    label: "Homônimos",
    description: "Possíveis pessoas com mesmo nome",
    icon: "🔍",
    color: "yellow",
  },
} as const;

/**
 * Filter and sort patterns by relevance
 */
export function filterPatternsByRelevance(
  analysis: AnalysisResult,
  minConfidence = 50,
) {
  return {
    trocaDireta: analysis.trocaDireta
      .filter((t) => t.confianca >= minConfidence)
      .sort((a, b) => b.confianca - a.confianca),

    triangulacao: analysis.triangulacao
      .filter((t) => t.confianca >= minConfidence)
      .sort((a, b) => b.confianca - a.confianca),

    duploPapel: analysis.duploPapel.sort((a, b) => {
      const riskOrder = { ALTO: 3, MEDIO: 2, BAIXO: 1 };
      return riskOrder[b.risco] - riskOrder[a.risco];
    }),

    provaEmprestada: analysis.provaEmprestada
      .filter((p) => p.qtd_depoimentos >= 10)
      .sort((a, b) => b.qtd_depoimentos - a.qtd_depoimentos),

    homonimos: analysis.homonimos
      .filter((h) => h.score >= minConfidence)
      .sort((a, b) => b.score - a.score),
  };
}

/**
 * Get critical patterns that need immediate attention
 */
export function getCriticalPatterns(analysis: AnalysisResult) {
  return {
    highRiskDualRole: analysis.duploPapel.filter((d) => d.risco === "ALTO"),
    professionalWitnesses: analysis.provaEmprestada.filter((p) => p.alerta),
    highProbHomonyms: analysis.homonimos.filter(
      (h) => h.probabilidade === "ALTA",
    ),
    highConfidenceExchanges: analysis.trocaDireta.filter(
      (t) => t.confianca >= 80,
    ),
    confirmedTriangulations: analysis.triangulacao.filter(
      (t) => t.confianca >= 70,
    ),
  };
}

/**
 * Generate pattern insights and recommendations
 */
export function generatePatternInsights(analysis: AnalysisResult) {
  const insights = [];
  const critical = getCriticalPatterns(analysis);

  // Dual role insights
  if (critical.highRiskDualRole.length > 0) {
    insights.push({
      type: "critical",
      title: "Casos Críticos de Duplo Papel",
      message: `${critical.highRiskDualRole.length} pessoa(s) identificada(s) como reclamante e testemunha em casos diferentes`,
      recommendation:
        "Priorizar contradita baseada em impedimento por interesse",
      patterns: critical.highRiskDualRole.map((d) => d.nome),
    });
  }

  // Professional witnesses insights
  if (critical.professionalWitnesses.length > 0) {
    insights.push({
      type: "warning",
      title: "Testemunhas Profissionais Detectadas",
      message: `${critical.professionalWitnesses.length} testemunha(s) com mais de 10 depoimentos`,
      recommendation:
        "Investigar padrão antes de contraditar - pode ser testemunha técnica legítima",
      patterns: critical.professionalWitnesses.map(
        (p) => `${p.nome} (${p.qtd_depoimentos} depoimentos)`,
      ),
    });
  }

  // Direct exchange insights
  if (critical.highConfidenceExchanges.length > 0) {
    insights.push({
      type: "opportunity",
      title: "Trocas Diretas Confirmadas",
      message: `${critical.highConfidenceExchanges.length} padrão(ões) de troca direta com alta confiança`,
      recommendation: "Explorar reciprocidade para questionar imparcialidade",
      patterns: critical.highConfidenceExchanges.map(
        (t) => `${t.testemunhaA} ⇄ ${t.testemunhaB}`,
      ),
    });
  }

  // Triangulation insights
  if (critical.confirmedTriangulations.length > 0) {
    insights.push({
      type: "complex",
      title: "Redes de Triangulação",
      message: `${critical.confirmedTriangulations.length} rede(s) circular(es) de testemunhas detectada(s)`,
      recommendation: "Mapear rede completa para evidenciar coordenação",
      patterns: critical.confirmedTriangulations.map((t) => t.desenho),
    });
  }

  // Homonym insights
  if (critical.highProbHomonyms.length > 0) {
    insights.push({
      type: "verification",
      title: "Possíveis Homônimos",
      message: `${critical.highProbHomonyms.length} caso(s) de possível duplicação de identidade`,
      recommendation:
        "Verificar CPF/documentos antes de prosseguir com análise",
      patterns: critical.highProbHomonyms.map(
        (h) => `${h.nome} (score: ${h.score})`,
      ),
    });
  }

  return insights;
}

/**
 * Calculate overall case risk score
 */
export function calculateCaseRiskScore(analysis: AnalysisResult): {
  score: number;
  level: RiscoLevel;
  factors: string[];
} {
  let score = 0;
  const factors = [];

  // High-risk dual roles
  const highRiskDual = analysis.duploPapel.filter(
    (d) => d.risco === "ALTO",
  ).length;
  if (highRiskDual > 0) {
    score += highRiskDual * 25;
    factors.push(`${highRiskDual} caso(s) de duplo papel crítico`);
  }

  // Professional witnesses
  const professional = analysis.provaEmprestada.filter((p) => p.alerta).length;
  if (professional > 0) {
    score += professional * 15;
    factors.push(`${professional} testemunha(s) profissional(is)`);
  }

  // High confidence patterns
  const highConfTroca = analysis.trocaDireta.filter(
    (t) => t.confianca >= 80,
  ).length;
  if (highConfTroca > 0) {
    score += highConfTroca * 10;
    factors.push(`${highConfTroca} troca(s) direta(s) confirmada(s)`);
  }

  // Triangulations
  if (analysis.triangulacao.length > 0) {
    score += analysis.triangulacao.length * 20;
    factors.push(`${analysis.triangulacao.length} rede(s) de triangulação`);
  }

  // High probability homonyms
  const highProbHomo = analysis.homonimos.filter(
    (h) => h.probabilidade === "ALTA",
  ).length;
  if (highProbHomo > 0) {
    score += highProbHomo * 10;
    factors.push(`${highProbHomo} possível(is) homônimo(s)`);
  }

  // Determine risk level
  let level: RiscoLevel;
  if (score >= 70) level = "ALTO";
  else if (score >= 40) level = "MEDIO";
  else level = "BAIXO";

  return { score: Math.min(score, 100), level, factors };
}

/**
 * Format confidence score for display
 */
export function formatConfidence(confidence: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (confidence >= 80)
    return {
      label: "Alta Confiança",
      color: "success",
      icon: "✅",
    };
  if (confidence >= 60)
    return {
      label: "Média Confiança",
      color: "warning",
      icon: "⚡",
    };
  return {
    label: "Baixa Confiança",
    color: "muted",
    icon: "❓",
  };
}

/**
 * Group patterns by type for dashboard display
 */
export function groupPatternsByType(analysis: AnalysisResult) {
  return [
    {
      type: "duploPapel",
      ...PATTERN_CONFIG.duploPapel,
      count: analysis.duploPapel.length,
      critical: analysis.duploPapel.filter((d) => d.risco === "ALTO").length,
      items: analysis.duploPapel,
    },
    {
      type: "provaEmprestada",
      ...PATTERN_CONFIG.provaEmprestada,
      count: analysis.provaEmprestada.length,
      critical: analysis.provaEmprestada.filter((p) => p.alerta).length,
      items: analysis.provaEmprestada,
    },
    {
      type: "trocaDireta",
      ...PATTERN_CONFIG.trocaDireta,
      count: analysis.trocaDireta.length,
      critical: analysis.trocaDireta.filter((t) => t.confianca >= 80).length,
      items: analysis.trocaDireta,
    },
    {
      type: "triangulacao",
      ...PATTERN_CONFIG.triangulacao,
      count: analysis.triangulacao.length,
      critical: analysis.triangulacao.filter((t) => t.confianca >= 70).length,
      items: analysis.triangulacao,
    },
    {
      type: "homonimos",
      ...PATTERN_CONFIG.homonimos,
      count: analysis.homonimos.length,
      critical: analysis.homonimos.filter((h) => h.probabilidade === "ALTA")
        .length,
      items: analysis.homonimos,
    },
  ].sort((a, b) => b.critical - a.critical);
}

/**
 * Extract actionable items from analysis
 */
export function extractActionableItems(analysis: AnalysisResult) {
  const items: any[] = [];

  // Immediate actions
  analysis.duploPapel
    .filter((d) => d.risco === "ALTO")
    .forEach((d) => {
      items.push({
        priority: "HIGH",
        action: "CONTRADITA",
        target: d.nome,
        reason: "Duplo papel - reclamante e testemunha",
        cases: d.cnjs_como_reclamante.concat(d.cnjs_como_testemunha),
        deadline: "24h",
      });
    });

  // Investigations needed
  analysis.provaEmprestada
    .filter((p) => p.alerta)
    .forEach((p) => {
      items.push({
        priority: "MEDIUM",
        action: "INVESTIGAR",
        target: p.nome,
        reason: `Testemunha profissional (${p.qtd_depoimentos} depoimentos)`,
        cases: p.cnjs,
        deadline: "72h",
      });
    });

  // Pattern explorations
  analysis.trocaDireta
    .filter((t) => t.confianca >= 80)
    .forEach((t) => {
      items.push({
        priority: "MEDIUM",
        action: "EXPLORAR",
        target: `${t.testemunhaA} ⇄ ${t.testemunhaB}`,
        reason: "Troca direta confirmada",
        cases: t.cnjsA.concat(t.cnjsB),
        deadline: "48h",
      });
    });

  // Verifications
  analysis.homonimos
    .filter((h) => h.probabilidade === "ALTA")
    .forEach((h) => {
      items.push({
        priority: "LOW",
        action: "VERIFICAR",
        target: h.nome,
        reason: "Possível homônimo",
        cases: h.cnjs_suspeitos,
        deadline: "7d",
      });
    });

  return items.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (
      priorityOrder[b.priority as keyof typeof priorityOrder] -
      priorityOrder[a.priority as keyof typeof priorityOrder]
    );
  });
}
