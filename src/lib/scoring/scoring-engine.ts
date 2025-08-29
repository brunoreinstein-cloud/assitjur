/**
 * Sistema de Scoring 0-100 para Análise de Padrões
 * Baseado na documentação do produto
 */

import type { 
  AnalysisResult, 
  TrocaDiretaResult, 
  TriangulacaoResult, 
  DuploPapelResult, 
  ProvaEmprestadaResult, 
  HomonimoResult 
} from '@/types/mapa-testemunhas-analysis'

// Interfaces para scoring
export interface ScoreBreakdown {
  total: number
  components: {
    [key: string]: {
      score: number
      weight: number
      description: string
      factor_type: 'DUPLO_PAPEL' | 'PROVA_EMPRESTADA' | 'TROCA_DIRETA' | 'TRIANGULACAO' | 'HOMONIMO'
    }
  }
  classification: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO' | 'MINIMO'
  recommendations: string[]
  calculated_at: string
}

export interface ProcessoScore {
  cnj: string
  score_final: number
  score_breakdown: ScoreBreakdown
  fatores_risco: string[]
  classificacao_estrategica: string
  prioridade_contradita: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'NAO_RECOMENDADA'
  confidence_level: number
  last_updated: string
}

export interface TestemunhaScore {
  nome: string
  score_final: number
  score_breakdown: ScoreBreakdown
  classificacao: 'PROFISSIONAL' | 'SUSPEITA' | 'NORMAL' | 'OCASIONAL'
  alerta_prova_emprestada: boolean
  recomendacao_acao: string
  risk_level: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO' | 'MINIMO'
  last_updated: string
  fatores_risco?: string[]
}

/**
 * Engine principal de scoring
 */
export class ScoringEngine {
  
  // Pesos para diferentes fatores de risco
  private static readonly WEIGHTS = {
    DUPLO_PAPEL: 0.30,           // 30% - Maior peso por ser impedimento legal
    PROVA_EMPRESTADA: 0.25,      // 25% - Alto risco de coordenação
    TROCA_DIRETA: 0.20,          // 20% - Evidência de reciprocidade
    TRIANGULACAO: 0.15,          // 15% - Padrão de rede coordenada
    HOMONIMO: 0.10               // 10% - Menor peso, mais verificação
  }

  private static readonly THRESHOLDS = {
    CRITICO: 85,
    ALTO: 70,
    MEDIO: 50,
    BAIXO: 30,
    MINIMO: 0
  }

  /**
   * Calcula score de um processo baseado nos padrões detectados
   */
  static calculateProcessoScore(
    cnj: string, 
    analysis: AnalysisResult,
    processoData?: any
  ): ProcessoScore {
    const components: ScoreBreakdown['components'] = {}
    let totalScore = 0

    // 1. Duplo Papel (máximo 30 pontos)
    const duploPapelScore = this.calculateDuploPapelScore(cnj, analysis.duploPapel)
    if (duploPapelScore.score > 0) {
      components.duploPapel = {
        score: duploPapelScore.score,
        weight: this.WEIGHTS.DUPLO_PAPEL,
        description: duploPapelScore.description,
        factor_type: 'DUPLO_PAPEL'
      }
      totalScore += duploPapelScore.score * this.WEIGHTS.DUPLO_PAPEL
    }

    // 2. Prova Emprestada (máximo 25 pontos)
    const provaScore = this.calculateProvaEmprestadaScore(cnj, analysis.provaEmprestada)
    if (provaScore.score > 0) {
      components.provaEmprestada = {
        score: provaScore.score,
        weight: this.WEIGHTS.PROVA_EMPRESTADA,
        description: provaScore.description,
        factor_type: 'PROVA_EMPRESTADA'
      }
      totalScore += provaScore.score * this.WEIGHTS.PROVA_EMPRESTADA
    }

    // 3. Troca Direta (máximo 20 pontos)
    const trocaScore = this.calculateTrocaDiretaScore(cnj, analysis.trocaDireta)
    if (trocaScore.score > 0) {
      components.trocaDireta = {
        score: trocaScore.score,
        weight: this.WEIGHTS.TROCA_DIRETA,
        description: trocaScore.description,
        factor_type: 'TROCA_DIRETA'
      }
      totalScore += trocaScore.score * this.WEIGHTS.TROCA_DIRETA
    }

    // 4. Triangulação (máximo 15 pontos)
    const triangScore = this.calculateTriangulacaoScore(cnj, analysis.triangulacao)
    if (triangScore.score > 0) {
      components.triangulacao = {
        score: triangScore.score,
        weight: this.WEIGHTS.TRIANGULACAO,
        description: triangScore.description,
        factor_type: 'TRIANGULACAO'
      }
      totalScore += triangScore.score * this.WEIGHTS.TRIANGULACAO
    }

    // 5. Homônimos (máximo 10 pontos)
    const homonimoScore = this.calculateHomonimoScore(cnj, analysis.homonimos)
    if (homonimoScore.score > 0) {
      components.homonimo = {
        score: homonimoScore.score,
        weight: this.WEIGHTS.HOMONIMO,
        description: homonimoScore.description,
        factor_type: 'HOMONIMO'
      }
      totalScore += homonimoScore.score * this.WEIGHTS.HOMONIMO
    }

    const finalScore = Math.min(Math.round(totalScore), 100)
    const classification = this.getClassification(finalScore)
    const recommendations = this.generateProcessoRecommendations(finalScore, components)
    const fatoresRisco = this.extractRiskFactors(components)
    const prioridadeContradita = this.calculateContradictaPriority(finalScore, components)

    return {
      cnj,
      score_final: finalScore,
      score_breakdown: {
        total: finalScore,
        components,
        classification,
        recommendations,
        calculated_at: new Date().toISOString()
      },
      fatores_risco: fatoresRisco,
      classificacao_estrategica: this.getStrategicClassification(finalScore, components),
      prioridade_contradita: prioridadeContradita,
      confidence_level: this.calculateConfidenceLevel(components),
      last_updated: new Date().toISOString()
    }
  }

  /**
   * Calcula score de uma testemunha baseado nos padrões
   */
  static calculateTestemunhaScore(
    nome: string,
    analysis: AnalysisResult,
    testemunhaData?: any
  ): TestemunhaScore {
    const components: ScoreBreakdown['components'] = {}
    let totalScore = 0

    // Encontrar dados da testemunha nos resultados
    const provaEmprestada = analysis.provaEmprestada.find(p => p.nome === nome)
    const duploPapel = analysis.duploPapel.find(d => d.nome === nome)
    const trocas = analysis.trocaDireta.filter(t => t.testemunhaA === nome || t.testemunhaB === nome)
    const triangulacoes = analysis.triangulacao.filter(tr => tr.ciclo.includes(nome))
    const homonimo = analysis.homonimos.find(h => h.nome === nome)

    // 1. Prova Emprestada (peso maior para testemunhas)
    if (provaEmprestada) {
      const score = this.calculateTestemunhaProvaEmprestadaScore(provaEmprestada)
      components.provaEmprestada = {
        score: score.score,
        weight: 0.35,
        description: score.description,
        factor_type: 'PROVA_EMPRESTADA'
      }
      totalScore += score.score * 0.35
    }

    // 2. Duplo Papel
    if (duploPapel) {
      const score = this.calculateTestemunhaDuploPapelScore(duploPapel)
      components.duploPapel = {
        score: score.score,
        weight: 0.30,
        description: score.description,
        factor_type: 'DUPLO_PAPEL'
      }
      totalScore += score.score * 0.30
    }

    // 3. Participação em Trocas
    if (trocas.length > 0) {
      const score = this.calculateTestemunhaTrocaScore(trocas)
      components.trocaDireta = {
        score: score.score,
        weight: 0.20,
        description: score.description,
        factor_type: 'TROCA_DIRETA'
      }
      totalScore += score.score * 0.20
    }

    // 4. Participação em Triangulações
    if (triangulacoes.length > 0) {
      const score = this.calculateTestemunhaTriangulacaoScore(triangulacoes)
      components.triangulacao = {
        score: score.score,
        weight: 0.10,
        description: score.description,
        factor_type: 'TRIANGULACAO'
      }
      totalScore += score.score * 0.10
    }

    // 5. Homônimo
    if (homonimo) {
      const score = this.calculateTestemunhaHomonimoScore(homonimo)
      components.homonimo = {
        score: score.score,
        weight: 0.05,
        description: score.description,
        factor_type: 'HOMONIMO'
      }
      totalScore += score.score * 0.05
    }

    const finalScore = Math.min(Math.round(totalScore), 100)
    const classification = this.getTestemunhaClassification(finalScore, provaEmprestada?.qtd_depoimentos || 0)
    const recommendations = this.generateTestemunhaRecommendations(finalScore, components)
    const alertaProvaEmprestada = provaEmprestada?.alerta || false

    return {
      nome,
      score_final: finalScore,
      score_breakdown: {
        total: finalScore,
        components,
        classification: this.getClassification(finalScore),
        recommendations,
        calculated_at: new Date().toISOString()
      },
      classificacao: classification,
      alerta_prova_emprestada: alertaProvaEmprestada,
      recomendacao_acao: this.getTestemunhaRecommendation(finalScore, components, alertaProvaEmprestada),
      risk_level: this.getClassification(finalScore),
      last_updated: new Date().toISOString(),
      fatores_risco: this.extractRiskFactors(components)
    }
  }

  // Métodos privados para cálculos específicos

  private static calculateDuploPapelScore(cnj: string, duploPapelResults: DuploPapelResult[]): { score: number, description: string } {
    const relevantCases = duploPapelResults.filter(d => 
      d.cnjs_como_reclamante.includes(cnj) || d.cnjs_como_testemunha.includes(cnj)
    )

    if (relevantCases.length === 0) return { score: 0, description: '' }

    let maxScore = 0
    let description = ''

    relevantCases.forEach(caso => {
      let score = 0
      
      // Score base por ter duplo papel
      score += 40
      
      // Bônus se foi testemunha no polo passivo
      if (caso.polo_passivo) score += 30
      
      // Bônus por número de casos como testemunha
      score += Math.min(caso.cnjs_como_testemunha.length * 5, 20)
      
      // Bônus por número de casos como reclamante
      score += Math.min(caso.cnjs_como_reclamante.length * 3, 10)

      if (score > maxScore) {
        maxScore = score
        description = `${caso.nome} atua como reclamante e testemunha (${caso.cnjs_como_testemunha.length} depoimentos)`
      }
    })

    return { 
      score: Math.min(maxScore, 100), 
      description 
    }
  }

  private static calculateProvaEmprestadaScore(cnj: string, provaResults: ProvaEmprestadaResult[]): { score: number, description: string } {
    const relevantCases = provaResults.filter(p => p.cnjs.includes(cnj))
    
    if (relevantCases.length === 0) return { score: 0, description: '' }

    let maxScore = 0
    let description = ''

    relevantCases.forEach(caso => {
      let score = 0
      
      // Score baseado no número de depoimentos
      if (caso.qtd_depoimentos >= 20) score += 60
      else if (caso.qtd_depoimentos >= 15) score += 45
      else if (caso.qtd_depoimentos >= 10) score += 30
      else score += caso.qtd_depoimentos * 2

      // Bônus por concentração de comarca
      score += caso.concentracao_comarca * 0.2

      // Bônus por advogados recorrentes
      score += Math.min(caso.advogados_recorrentes.length * 5, 15)

      // Penalidade se tem alerta (pode ser testemunha técnica legítima)
      if (caso.alerta && caso.qtd_depoimentos > 50) {
        score = score * 0.7 // Reduz 30% se pode ser técnica
      }

      if (score > maxScore) {
        maxScore = score
        description = `${caso.nome} tem ${caso.qtd_depoimentos} depoimentos (concentração: ${caso.concentracao_comarca.toFixed(1)}%)`
      }
    })

    return { 
      score: Math.min(maxScore, 100), 
      description 
    }
  }

  private static calculateTrocaDiretaScore(cnj: string, trocaResults: TrocaDiretaResult[]): { score: number, description: string } {
    const relevantCases = trocaResults.filter(t => 
      t.cnjsA.includes(cnj) || t.cnjsB.includes(cnj)
    )

    if (relevantCases.length === 0) return { score: 0, description: '' }

    let maxScore = 0
    let description = ''

    relevantCases.forEach(troca => {
      let score = troca.confianca * 0.8 // Base na confiança

      // Bônus por advogados comuns
      score += Math.min(troca.advogadosComuns.length * 5, 20)

      // Bônus por múltiplos casos
      const totalCasos = troca.cnjsA.length + troca.cnjsB.length
      score += Math.min(totalCasos * 3, 15)

      if (score > maxScore) {
        maxScore = score
        description = `Troca entre ${troca.testemunhaA} e ${troca.testemunhaB} (confiança: ${troca.confianca}%)`
      }
    })

    return { 
      score: Math.min(maxScore, 100), 
      description 
    }
  }

  private static calculateTriangulacaoScore(cnj: string, triangResults: TriangulacaoResult[]): { score: number, description: string } {
    const relevantCases = triangResults.filter(t => t.cnjs.includes(cnj))

    if (relevantCases.length === 0) return { score: 0, description: '' }

    let maxScore = 0
    let description = ''

    relevantCases.forEach(triangulacao => {
      let score = triangulacao.confianca * 0.7 // Base na confiança

      // Bônus por tamanho do ciclo
      score += Math.min(triangulacao.ciclo.length * 8, 25)

      // Bônus por múltiplos advogados envolvidos
      score += Math.min(triangulacao.advogados.length * 3, 15)

      // Bônus por múltiplas comarcas (indica coordenação ampla)
      score += Math.min(triangulacao.comarcas.length * 5, 10)

      if (score > maxScore) {
        maxScore = score
        description = `Rede de ${triangulacao.ciclo.length} testemunhas (confiança: ${triangulacao.confianca}%)`
      }
    })

    return { 
      score: Math.min(maxScore, 100), 
      description 
    }
  }

  private static calculateHomonimoScore(cnj: string, homonimoResults: HomonimoResult[]): { score: number, description: string } {
    const relevantCases = homonimoResults.filter(h => h.cnjs_suspeitos.includes(cnj))

    if (relevantCases.length === 0) return { score: 0, description: '' }

    let maxScore = 0
    let description = ''

    relevantCases.forEach(homonimo => {
      let score = homonimo.score * 0.6 // Score base reduzido (incerteza)

      // Bônus por alta probabilidade
      if (homonimo.probabilidade === 'ALTA') score += 20
      else if (homonimo.probabilidade === 'MEDIA') score += 10

      // Penalidade por nome comum (pode ser coincidência)
      if (homonimo.fatores.nome_comum) score = score * 0.5

      if (score > maxScore) {
        maxScore = score
        description = `Possível homônimo: ${homonimo.nome} (probabilidade: ${homonimo.probabilidade})`
      }
    })

    return { 
      score: Math.min(maxScore, 100), 
      description 
    }
  }

  // Métodos específicos para testemunhas

  private static calculateTestemunhaProvaEmprestadaScore(prova: ProvaEmprestadaResult): { score: number, description: string } {
    let score = 0
    
    // Score exponencial baseado no número de depoimentos
    if (prova.qtd_depoimentos >= 50) score = 95
    else if (prova.qtd_depoimentos >= 30) score = 85
    else if (prova.qtd_depoimentos >= 20) score = 70
    else if (prova.qtd_depoimentos >= 15) score = 55
    else if (prova.qtd_depoimentos >= 10) score = 40
    else score = prova.qtd_depoimentos * 3

    // Ajustes baseados em outros fatores
    score += prova.concentracao_comarca * 0.3
    score += Math.min(prova.advogados_recorrentes.length * 3, 15)

    return {
      score: Math.min(score, 100),
      description: `${prova.qtd_depoimentos} depoimentos, concentração ${prova.concentracao_comarca.toFixed(1)}%`
    }
  }

  private static calculateTestemunhaDuploPapelScore(duplo: DuploPapelResult): { score: number, description: string } {
    let score = 60 // Score base alto

    if (duplo.polo_passivo) score += 25
    score += Math.min(duplo.cnjs_como_testemunha.length * 3, 15)

    return {
      score: Math.min(score, 100),
      description: `Reclamante em ${duplo.cnjs_como_reclamante.length} caso(s), testemunha em ${duplo.cnjs_como_testemunha.length}`
    }
  }

  private static calculateTestemunhaTrocaScore(trocas: TrocaDiretaResult[]): { score: number, description: string } {
    const avgConfianca = trocas.reduce((sum, t) => sum + t.confianca, 0) / trocas.length
    let score = avgConfianca * 0.8
    
    score += Math.min(trocas.length * 10, 20)

    return {
      score: Math.min(score, 100),
      description: `Participa de ${trocas.length} troca(s) direta(s)`
    }
  }

  private static calculateTestemunhaTriangulacaoScore(triangulacoes: TriangulacaoResult[]): { score: number, description: string } {
    const avgConfianca = triangulacoes.reduce((sum, t) => sum + t.confianca, 0) / triangulacoes.length
    let score = avgConfianca * 0.7
    
    score += Math.min(triangulacoes.length * 15, 25)

    return {
      score: Math.min(score, 100),
      description: `Participa de ${triangulacoes.length} rede(s) de triangulação`
    }
  }

  private static calculateTestemunhaHomonimoScore(homonimo: HomonimoResult): { score: number, description: string } {
    let score = homonimo.score * 0.5

    if (homonimo.probabilidade === 'ALTA') score += 15
    else if (homonimo.probabilidade === 'MEDIA') score += 8

    return {
      score: Math.min(score, 100),
      description: `Possível homônimo (${homonimo.probabilidade.toLowerCase()} probabilidade)`
    }
  }

  // Classificações e utilitários

  private static getClassification(score: number): 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO' | 'MINIMO' {
    if (score >= this.THRESHOLDS.CRITICO) return 'CRITICO'
    if (score >= this.THRESHOLDS.ALTO) return 'ALTO'
    if (score >= this.THRESHOLDS.MEDIO) return 'MEDIO'
    if (score >= this.THRESHOLDS.BAIXO) return 'BAIXO'
    return 'MINIMO'
  }

  private static getTestemunhaClassification(score: number, qtdDepoimentos: number): 'PROFISSIONAL' | 'SUSPEITA' | 'NORMAL' | 'OCASIONAL' {
    if (qtdDepoimentos >= 10 && score >= 70) return 'PROFISSIONAL'
    if (score >= 60) return 'SUSPEITA'
    if (qtdDepoimentos >= 3) return 'NORMAL'
    return 'OCASIONAL'
  }

  private static getStrategicClassification(score: number, components: ScoreBreakdown['components']): string {
    if (score >= 85) return 'CRÍTICO - Contradita Urgente'
    if (score >= 70) return 'ALTO RISCO - Priorizar Contradita'
    if (score >= 50) return 'MÉDIO RISCO - Avaliar Contradita'
    if (score >= 30) return 'BAIXO RISCO - Monitorar'
    return 'RISCO MÍNIMO'
  }

  private static calculateContradictaPriority(score: number, components: ScoreBreakdown['components']): 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'NAO_RECOMENDADA' {
    // Não recomendar contradita para casos de prova emprestada pura
    if (components.provaEmprestada && !components.duploPapel && components.provaEmprestada.score >= 80) {
      return 'NAO_RECOMENDADA'
    }

    if (score >= 85) return 'URGENTE'
    if (score >= 70) return 'ALTA'
    if (score >= 50) return 'MEDIA'
    if (score >= 30) return 'BAIXA'
    return 'NAO_RECOMENDADA'
  }

  private static generateProcessoRecommendations(score: number, components: ScoreBreakdown['components']): string[] {
    const recommendations = []

    if (components.duploPapel?.score >= 60) {
      recommendations.push('Contraditar baseado em impedimento por interesse (duplo papel)')
    }

    if (components.trocaDireta?.score >= 50) {
      recommendations.push('Explorar reciprocidade para questionar imparcialidade')
    }

    if (components.triangulacao?.score >= 40) {
      recommendations.push('Mapear rede completa para evidenciar coordenação')
    }

    if (components.provaEmprestada?.score >= 70 && !components.duploPapel) {
      recommendations.push('Investigar se é testemunha técnica antes de contraditar')
    }

    if (components.homonimo?.score >= 30) {
      recommendations.push('Verificar identidade através de CPF/documentos')
    }

    if (score >= 70) {
      recommendations.push('Documentar padrões para petição de contradita')
    }

    return recommendations
  }

  private static generateTestemunhaRecommendations(score: number, components: ScoreBreakdown['components']): string[] {
    const recommendations = []

    if (components.provaEmprestada?.score >= 80) {
      recommendations.push('Verificar se é testemunha técnica especializada')
    }

    if (components.duploPapel?.score >= 50) {
      recommendations.push('Contraditar por impedimento legal')
    }

    if (components.trocaDireta?.score >= 40) {
      recommendations.push('Questionar sobre relacionamento com outras testemunhas')
    }

    if (score >= 60) {
      recommendations.push('Priorizar na estratégia defensiva')
    }

    return recommendations
  }

  private static extractRiskFactors(components: ScoreBreakdown['components']): string[] {
    const factors = []

    Object.entries(components).forEach(([key, component]) => {
      if (component.score >= 30) {
        factors.push(component.description)
      }
    })

    return factors
  }

  private static getTestemunhaRecommendation(score: number, components: ScoreBreakdown['components'], alertaProvaEmprestada: boolean): string {
    if (alertaProvaEmprestada && !components.duploPapel) {
      return 'INVESTIGAR - Pode ser testemunha técnica legítima'
    }

    if (score >= 80) return 'CONTRADITAR - Alto risco probatório'
    if (score >= 60) return 'PRIORIZAR - Incluir na estratégia defensiva'
    if (score >= 40) return 'MONITORAR - Acompanhar desenvolvimento'
    return 'NORMAL - Sem ação específica necessária'
  }

  private static calculateConfidenceLevel(components: ScoreBreakdown['components']): number {
    const componentCount = Object.keys(components).length
    if (componentCount === 0) return 0
    
    const avgScore = Object.values(components).reduce((sum, comp) => sum + comp.score, 0) / componentCount
    
    // Higher confidence with more components and higher scores
    let confidence = Math.min(avgScore + (componentCount * 10), 100)
    
    // Boost confidence for high-impact patterns
    if (components.duploPapel?.score >= 60) confidence += 15
    if (components.provaEmprestada?.score >= 70) confidence += 10
    
    return Math.min(confidence, 100)
  }
}