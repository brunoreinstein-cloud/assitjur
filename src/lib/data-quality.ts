/**
 * Utilitários para garantir qualidade e consistência dos dados
 */

export interface DataQualityMetrics {
  confidence: number;
  completeness: number;
  consistency: number;
  missingFields: string[];
}

/**
 * Calcula score de confiança baseado na completude dos dados
 */
export function calculateConfidence(data: Record<string, any>, requiredFields: string[]): number {
  if (!data || typeof data !== 'object') return 0;
  
  const validFields = requiredFields.filter(field => {
    const value = data[field];
    return value !== null && value !== undefined && value !== '' && value !== 'nan';
  });
  
  const baseScore = validFields.length / requiredFields.length;
  
  // Bonificação para campos críticos preenchidos
  let bonus = 0;
  const criticalFields = ['cnj', 'reclamante', 'status', 'classificacao'];
  const criticalPresent = criticalFields.filter(f => requiredFields.includes(f) && data[f]).length;
  bonus = criticalPresent * 0.05;
  
  return Math.min(1, baseScore + bonus);
}

/**
 * Normaliza status null/undefined para valores informativos
 */
export function normalizeStatus(status: string | null | undefined): string {
  if (!status || status === 'null' || status === 'undefined') {
    return 'Em andamento';
  }
  return status;
}

/**
 * Normaliza classificação para valores padrão
 */
export function normalizeClassificacao(classificacao: string | null | undefined): string {
  if (!classificacao || classificacao === 'null' || classificacao === 'undefined') {
    return 'Normal';
  }
  return classificacao;
}

/**
 * Normaliza nível de risco baseado em classificação
 */
export function normalizeRiscoNivel(
  classificacao?: string | null,
  scoreRisco?: number | null
): 'baixo' | 'medio' | 'alto' | 'critico' {
  if (scoreRisco !== null && scoreRisco !== undefined) {
    if (scoreRisco >= 85) return 'critico';
    if (scoreRisco >= 70) return 'alto';
    if (scoreRisco >= 50) return 'medio';
    return 'baixo';
  }
  
  const classif = normalizeClassificacao(classificacao).toLowerCase();
  if (classif.includes('crítico') || classif.includes('alto')) return 'alto';
  if (classif.includes('médio') || classif.includes('medio')) return 'medio';
  return 'baixo';
}

/**
 * Formata porcentagem de confiança para exibição
 */
export function formatConfidence(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined || !isFinite(confidence)) {
    return '0%';
  }
  
  const normalized = Math.max(0, Math.min(1, confidence));
  const percentage = Math.round(normalized * 100);
  return `${percentage}%`;
}

/**
 * Valida e normaliza array de strings
 */
export function normalizeStringArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => 
    item && 
    typeof item === 'string' && 
    item.trim() !== '' && 
    item.toLowerCase() !== 'nan'
  );
}

/**
 * Analisa qualidade completa de dados de processo
 */
export function analyzeProcessoQuality(processo: any): DataQualityMetrics {
  const requiredFields = [
    'cnj',
    'reclamante_nome',
    'reu_nome',
    'status',
    'classificacao_final',
    'comarca',
    'tribunal'
  ];
  
  const missingFields = requiredFields.filter(field => {
    const value = processo[field];
    return !value || value === 'null' || value === 'undefined' || value === '';
  });
  
  const completeness = 1 - (missingFields.length / requiredFields.length);
  const confidence = calculateConfidence(processo, requiredFields);
  
  // Consistência: verifica se campos relacionados fazem sentido
  let consistency = 1.0;
  if (processo.testemunhas_ativo && processo.testemunhas_ativo.length > 0) {
    consistency += 0.1;
  }
  if (processo.data_audiencia) {
    consistency += 0.05;
  }
  consistency = Math.min(1, consistency);
  
  return {
    confidence,
    completeness,
    consistency,
    missingFields
  };
}

/**
 * Analisa qualidade completa de dados de testemunha
 */
export function analyzeTestemunhaQuality(testemunha: any): DataQualityMetrics {
  const requiredFields = [
    'nome_testemunha',
    'qtd_depoimentos',
    'classificacao'
  ];
  
  const missingFields = requiredFields.filter(field => {
    const value = testemunha[field];
    return !value || value === 'null' || value === 'undefined' || value === '';
  });
  
  const completeness = 1 - (missingFields.length / requiredFields.length);
  const confidence = calculateConfidence(testemunha, requiredFields);
  
  let consistency = 1.0;
  if (testemunha.qtd_depoimentos > 0) {
    consistency += 0.1;
  }
  consistency = Math.min(1, consistency);
  
  return {
    confidence,
    completeness,
    consistency,
    missingFields
  };
}
