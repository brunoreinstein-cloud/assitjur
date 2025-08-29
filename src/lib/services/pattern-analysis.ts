import { supabase } from '@/integrations/supabase/client'
import type { AnalysisResult, AnalysisRequest, AnalysisResponse } from '@/types/mapa-testemunhas-analysis'

/**
 * Service for pattern analysis operations
 */
export class PatternAnalysisService {
  /**
   * Run comprehensive pattern analysis on organization's data
   */
  static async runAnalysis(request?: AnalysisRequest): Promise<AnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('mapa-testemunhas-analysis', {
        body: request || {}
      })

      if (error) {
        console.error('Pattern analysis error:', error)
        throw new Error(`Erro na análise de padrões: ${error.message}`)
      }

      return data as AnalysisResult
    } catch (error) {
      console.error('Pattern analysis service error:', error)
      throw error
    }
  }

  /**
   * Analyze specific patterns only
   */
  static async analyzePatterns(patterns: ('trocaDireta' | 'triangulacao' | 'duploPapel' | 'provaEmprestada' | 'homonimos')[]): Promise<AnalysisResult> {
    return this.runAnalysis({
      filters: {
        incluir_padroes: patterns
      }
    })
  }

  /**
   * Analyze patterns for specific CNJs
   */
  static async analyzeSpecificCases(cnjs: string[]): Promise<AnalysisResult> {
    return this.runAnalysis({
      filters: {
        cnjs
      }
    })
  }

  /**
   * Analyze patterns within date range
   */
  static async analyzeByPeriod(inicio: string, fim: string): Promise<AnalysisResult> {
    return this.runAnalysis({
      filters: {
        periodo: { inicio, fim }
      }
    })
  }

  /**
   * Get summary statistics from analysis result
   */
  static extractSummary(analysis: AnalysisResult) {
    return {
      totalPatterns: analysis.trocaDireta.length + 
                    analysis.triangulacao.length + 
                    analysis.duploPapel.length + 
                    analysis.provaEmprestada.length + 
                    analysis.homonimos.length,
      
      criticalIssues: analysis.duploPapel.filter(d => d.risco === 'ALTO').length +
                     analysis.provaEmprestada.filter(p => p.alerta).length +
                     analysis.homonimos.filter(h => h.probabilidade === 'ALTA').length,
      
      highConfidencePatterns: analysis.trocaDireta.filter(t => t.confianca >= 80).length +
                             analysis.triangulacao.filter(t => t.confianca >= 80).length,
      
      professionalWitnesses: analysis.padroes.testemunhas_profissionais,
      
      offendingLawyers: analysis.padroes.advogados_ofensores.length,
      
      affectedProcesses: analysis.padroes.total_processos
    }
  }

  /**
   * Format analysis results for report generation
   */
  static formatForReport(analysis: AnalysisResult) {
    return {
      executiveSummary: {
        total_processos: analysis.padroes.total_processos,
        padroes_detectados: this.extractSummary(analysis).totalPatterns,
        casos_criticos: this.extractSummary(analysis).criticalIssues,
        testemunhas_profissionais: analysis.padroes.testemunhas_profissionais
      },
      
      detailedFindings: {
        trocaDireta: analysis.trocaDireta.map(t => ({
          tipo: 'Troca Direta',
          envolvidos: [t.testemunhaA, t.testemunhaB],
          casos: t.cnjsA.concat(t.cnjsB),
          confianca: t.confianca,
          advogados: t.advogadosComuns
        })),
        
        triangulacao: analysis.triangulacao.map(t => ({
          tipo: 'Triangulação',
          envolvidos: t.ciclo,
          casos: t.cnjs,
          confianca: t.confianca,
          desenho: t.desenho,
          advogados: t.advogados,
          comarcas: t.comarcas
        })),
        
        duploPapel: analysis.duploPapel.map(d => ({
          tipo: 'Duplo Papel',
          nome: d.nome,
          risco: d.risco,
          casos_reclamante: d.cnjs_como_reclamante,
          casos_testemunha: d.cnjs_como_testemunha,
          polo_passivo: d.polo_passivo
        })),
        
        provaEmprestada: analysis.provaEmprestada.map(p => ({
          tipo: 'Prova Emprestada',
          nome: p.nome,
          depoimentos: p.qtd_depoimentos,
          alerta: p.alerta,
          casos: p.cnjs,
          advogados_recorrentes: p.advogados_recorrentes,
          concentracao_comarca: p.concentracao_comarca
        })),
        
        homonimos: analysis.homonimos.map(h => ({
          tipo: 'Homônimo Suspeito',
          nome: h.nome,
          score: h.score,
          probabilidade: h.probabilidade,
          casos: h.cnjs_suspeitos,
          fatores: h.fatores
        }))
      },
      
      recommendations: this.generateRecommendations(analysis)
    }
  }

  /**
   * Generate strategic recommendations based on analysis
   */
  private static generateRecommendations(analysis: AnalysisResult): string[] {
    const recommendations: string[] = []

    // High-risk dual role cases
    const highRiskDualRole = analysis.duploPapel.filter(d => d.risco === 'ALTO')
    if (highRiskDualRole.length > 0) {
      recommendations.push(`Priorizar contradita em ${highRiskDualRole.length} caso(s) de duplo papel de alto risco`)
    }

    // Professional witnesses
    const professionalWitnesses = analysis.provaEmprestada.filter(p => p.alerta)
    if (professionalWitnesses.length > 0) {
      recommendations.push(`Investigar ${professionalWitnesses.length} testemunha(s) profissional(is) - evitar contradita automática`)
    }

    // High-confidence direct exchanges
    const highConfidenceTroca = analysis.trocaDireta.filter(t => t.confianca >= 80)
    if (highConfidenceTroca.length > 0) {
      recommendations.push(`Explorar ${highConfidenceTroca.length} padrão(ões) de troca direta com alta confiança`)
    }

    // Triangulation patterns
    if (analysis.triangulacao.length > 0) {
      recommendations.push(`Analisar ${analysis.triangulacao.length} rede(s) de triangulação detectada(s)`)
    }

    // High-probability homonyms
    const highProbHomonyms = analysis.homonimos.filter(h => h.probabilidade === 'ALTA')
    if (highProbHomonyms.length > 0) {
      recommendations.push(`Verificar identidade de ${highProbHomonyms.length} possível(is) homônimo(s)`)
    }

    // Offending lawyers
    if (analysis.padroes.advogados_ofensores.length > 0) {
      recommendations.push(`Monitorar ${analysis.padroes.advogados_ofensores.length} advogado(s) com padrão ofensivo`)
    }

    // Geographic concentration
    const topUF = Object.entries(analysis.padroes.concentracao_uf)
      .sort(([,a], [,b]) => b - a)[0]
    if (topUF && topUF[1] > analysis.padroes.total_processos * 0.3) {
      recommendations.push(`Concentração de casos em ${topUF[0]} (${topUF[1]} processos) - verificar padrão regional`)
    }

    return recommendations
  }
}

/**
 * Hook for pattern analysis operations
 */
export function usePatternAnalysis() {
  const runAnalysis = async (request?: AnalysisRequest) => {
    return PatternAnalysisService.runAnalysis(request)
  }

  const analyzePatterns = async (patterns: ('trocaDireta' | 'triangulacao' | 'duploPapel' | 'provaEmprestada' | 'homonimos')[]) => {
    return PatternAnalysisService.analyzePatterns(patterns)
  }

  const analyzeSpecificCases = async (cnjs: string[]) => {
    return PatternAnalysisService.analyzeSpecificCases(cnjs)
  }

  const analyzeByPeriod = async (inicio: string, fim: string) => {
    return PatternAnalysisService.analyzeByPeriod(inicio, fim)
  }

  const extractSummary = (analysis: AnalysisResult) => {
    return PatternAnalysisService.extractSummary(analysis)
  }

  const formatForReport = (analysis: AnalysisResult) => {
    return PatternAnalysisService.formatForReport(analysis)
  }

  return {
    runAnalysis,
    analyzePatterns,
    analyzeSpecificCases,
    analyzeByPeriod,
    extractSummary,
    formatForReport
  }
}