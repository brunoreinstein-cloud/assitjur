/**
 * Sistema de classificação estratégica baseado em padrões detectados
 * Regra provisória até implementação de scoring 0-100
 */

export type ClassificacaoEstrategica = 'CRÍTICO' | 'ATENÇÃO' | 'OBSERVAÇÃO' | 'NORMAL';

export interface ClassificacaoFactors {
  triangulacao: boolean;
  troca_direta: boolean;
  prova_emprestada: boolean;
  duplo_papel: boolean;
  ambos_polos: boolean;
  advogados_comuns: number;
  concentracao_geografica: number;
  timeline_suspeita: boolean;
}

export interface ClassificacaoResult {
  classificacao: ClassificacaoEstrategica;
  score_provisorio: number; // 0-100 (preparação para scoring futuro)
  fatores_aplicados: string[];
  insight_estrategico: string;
  prioridade: number; // 1-5 (1 = mais prioritário)
  recomendacoes: string[];
}

/**
 * Classifica um processo baseado nos padrões detectados
 */
export function classificarProcesso(factors: ClassificacaoFactors): ClassificacaoResult {
  let score = 0;
  const fatores: string[] = [];
  const recomendacoes: string[] = [];
  
  // Fatores críticos (alto impacto)
  if (factors.triangulacao) {
    score += 35;
    fatores.push('Triangulação detectada');
    recomendacoes.push('Investigar rede de relacionamentos entre testemunhas e reclamantes');
  }
  
  if (factors.troca_direta) {
    score += 30;
    fatores.push('Troca direta de testemunhas');
    recomendacoes.push('Analisar reciprocidade suspeita entre as partes');
  }
  
  if (factors.prova_emprestada) {
    score += 25;
    fatores.push('Testemunha profissional identificada');
    recomendacoes.push('Verificar histórico e credibilidade das testemunhas');
  }
  
  // Fatores de atenção (médio impacto)
  if (factors.duplo_papel) {
    score += 20;
    fatores.push('Duplo papel detectado');
    recomendacoes.push('Investigar histórico da pessoa como reclamante e testemunha');
  }
  
  if (factors.ambos_polos) {
    score += 15;
    fatores.push('Testemunha em ambos os polos');
    recomendacoes.push('Analisar coerência das narrativas em polos opostos');
  }
  
  // Fatores complementares (baixo impacto)
  if (factors.advogados_comuns > 2) {
    score += 10;
    fatores.push('Múltiplos advogados comuns');
    recomendacoes.push('Verificar relacionamento entre advogados e testemunhas');
  }
  
  if (factors.concentracao_geografica > 80) {
    score += 8;
    fatores.push('Alta concentração geográfica');
    recomendacoes.push('Investigar operação regional organizada');
  }
  
  if (factors.timeline_suspeita) {
    score += 12;
    fatores.push('Padrão temporal suspeito');
    recomendacoes.push('Analisar cronologia dos depoimentos');
  }
  
  // Determinar classificação final
  const classificacao = determineClassificacao(score, fatores);
  const prioridade = determinePrioridade(classificacao, factors);
  const insight = generateInsightEstrategico(classificacao, fatores, factors);
  
  return {
    classificacao,
    score_provisorio: Math.min(score, 100),
    fatores_aplicados: fatores,
    insight_estrategico: insight,
    prioridade,
    recomendacoes
  };
}

/**
 * Classifica uma testemunha baseada nos padrões detectados
 */
export function classificarTestemunha(
  qtdDepoimentos: number,
  provaEmprestada: boolean,
  duploPapel: boolean,
  trocaDireta: boolean,
  triangulacao: boolean,
  ambosPolos: boolean,
  advogadosRecorrentes: number
): ClassificacaoResult {
  const factors: ClassificacaoFactors = {
    triangulacao,
    troca_direta: trocaDireta,
    prova_emprestada: provaEmprestada,
    duplo_papel: duploPapel,
    ambos_polos: ambosPolos,
    advogados_comuns: advogadosRecorrentes,
    concentracao_geografica: 0, // N/A para testemunha individual
    timeline_suspeita: qtdDepoimentos > 20 // Timeline suspeita se muitos depoimentos
  };
  
  return classificarProcesso(factors);
}

/**
 * Determina classificação baseada no score e fatores
 */
function determineClassificacao(
  score: number, 
  fatores: string[]
): ClassificacaoEstrategica {
  // Lógica baseada em regras específicas
  const hasCriticoFactor = fatores.some(f => 
    f.includes('Triangulação') || 
    f.includes('Troca direta') || 
    f.includes('profissional')
  );
  
  const hasAtencaoFactor = fatores.some(f => 
    f.includes('Duplo papel') || 
    f.includes('ambos os polos')
  );
  
  if (hasCriticoFactor || score >= 60) {
    return 'CRÍTICO';
  } else if (hasAtencaoFactor || score >= 35) {
    return 'ATENÇÃO';
  } else if (score >= 15) {
    return 'OBSERVAÇÃO';
  } else {
    return 'NORMAL';
  }
}

/**
 * Determina prioridade de investigação (1-5)
 */
function determinePrioridade(
  classificacao: ClassificacaoEstrategica,
  factors: ClassificacaoFactors
): number {
  let prioridade = 5; // Baixa prioridade por padrão
  
  switch (classificacao) {
    case 'CRÍTICO':
      prioridade = 1;
      break;
    case 'ATENÇÃO':
      prioridade = 2;
      break;
    case 'OBSERVAÇÃO':
      prioridade = 3;
      break;
    case 'NORMAL':
      prioridade = 5;
      break;
  }
  
  // Ajustes baseados em fatores específicos
  if (factors.triangulacao && factors.troca_direta) {
    prioridade = Math.max(1, prioridade - 1); // Aumenta prioridade
  }
  
  if (factors.prova_emprestada && factors.advogados_comuns > 3) {
    prioridade = Math.max(1, prioridade - 1); // Aumenta prioridade
  }
  
  return prioridade;
}

/**
 * Gera insight estratégico textual
 */
function generateInsightEstrategico(
  classificacao: ClassificacaoEstrategica,
  fatores: string[],
  factors: ClassificacaoFactors
): string {
  const insights: string[] = [];
  
  // Insight base por classificação
  switch (classificacao) {
    case 'CRÍTICO':
      insights.push('⚠️ CASO CRÍTICO: Múltiplos padrões suspeitos detectados.');
      break;
    case 'ATENÇÃO':
      insights.push('⚡ ATENÇÃO: Padrões que requerem investigação adicional.');
      break;
    case 'OBSERVAÇÃO':
      insights.push('👁️ OBSERVAÇÃO: Sinais que merecem monitoramento.');
      break;
    case 'NORMAL':
      insights.push('✅ NORMAL: Nenhum padrão suspeito significativo.');
      break;
  }
  
  // Insights específicos por padrão
  if (factors.triangulacao) {
    insights.push('Rede circular de testemunhas pode indicar operação coordenada.');
  }
  
  if (factors.troca_direta) {
    insights.push('Reciprocidade de testemunhas sugere possível acordo entre partes.');
  }
  
  if (factors.prova_emprestada) {
    insights.push('Testemunha com histórico extenso pode ser profissional.');
  }
  
  if (factors.duplo_papel && factors.ambos_polos) {
    insights.push('Pessoa que alterna entre reclamante e testemunha em diferentes polos é altamente suspeita.');
  }
  
  if (factors.advogados_comuns > 2) {
    insights.push('Concentração em poucos advogados pode indicar esquema organizado.');
  }
  
  // Insight final com recomendação
  insights.push('⚖️ Validação nos autos é obrigatória antes de qualquer decisão.');
  
  return insights.join(' ');
}

/**
 * Gancho para futuro sistema de scoring 0-100
 * TODO: Implementar algoritmo ML/estatístico mais sofisticado
 */
export function calculateAdvancedScore(
  factors: ClassificacaoFactors,
  historicalData?: any[]
): number {
  // Por enquanto, usa classificação simples
  const result = classificarProcesso(factors);
  return result.score_provisorio;
}

/**
 * Atualiza classificações em batch para múltiplos processos
 */
export function classificarProcessosBatch(
  processos: any[]
): any[] {
  return processos.map(processo => {
    const factors: ClassificacaoFactors = {
      triangulacao: processo.triangulacao_confirmada || false,
      troca_direta: processo.troca_direta || false,
      prova_emprestada: processo.contem_prova_emprestada || false,
      duplo_papel: processo.reclamante_foi_testemunha || false,
      ambos_polos: false, // N/A para processo
      advogados_comuns: (processo.advogados_parte_ativa || []).length,
      concentracao_geografica: 0, // Seria calculado em análise agregada
      timeline_suspeita: false // Seria calculado em análise temporal
    };
    
    const classificacaoResult = classificarProcesso(factors);
    
    return {
      ...processo,
      classificacao_final: classificacaoResult.classificacao,
      insight_estrategico: classificacaoResult.insight_estrategico
    };
  });
}

/**
 * Atualiza classificações em batch para múltiplas testemunhas
 */
export function classificarTestemunhasBatch(
  testemunhas: any[]
): any[] {
  return testemunhas.map(testemunha => {
    const classificacaoResult = classificarTestemunha(
      testemunha.qtd_depoimentos || 0,
      testemunha.e_prova_emprestada || false,
      testemunha.ja_foi_reclamante || false,
      testemunha.participou_troca_favor || false,
      testemunha.participou_triangulacao || false,
      testemunha.foi_testemunha_em_ambos_polos || false,
      0 // Advogados recorrentes seria calculado separadamente
    );
    
    return {
      ...testemunha,
      classificacao: classificacaoResult.classificacao,
      classificacao_estrategica: classificacaoResult.classificacao
    };
  });
}