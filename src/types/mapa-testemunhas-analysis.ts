// Types for pattern analysis results

export interface AnalysisResult {
  trocaDireta: TrocaDiretaResult[]
  triangulacao: TriangulacaoResult[]
  duploPapel: DuploPapelResult[]
  provaEmprestada: ProvaEmprestadaResult[]
  homonimos: HomonimoResult[]
  padroes: PadroesAgregados
}

export interface TrocaDiretaResult {
  testemunhaA: string
  testemunhaB: string
  cnjsA: string[]
  cnjsB: string[]
  advogadosComuns: string[]
  confianca: number
}

export interface TriangulacaoResult {
  ciclo: string[]
  cnjs: string[]
  advogados: string[]
  comarcas: string[]
  desenho: string
  confianca: number
}

export interface DuploPapelResult {
  nome: string
  cnjs_como_reclamante: string[]
  cnjs_como_testemunha: string[]
  polo_passivo: boolean
  risco: 'ALTO' | 'MEDIO' | 'BAIXO'
}

export interface ProvaEmprestadaResult {
  nome: string
  qtd_depoimentos: number
  cnjs: string[]
  advogados_recorrentes: string[]
  concentracao_comarca: number
  alerta: boolean
}

export interface HomonimoResult {
  nome: string
  score: number
  fatores: {
    comarca_uf: number
    advogado_ativo: number
    temporalidade: number
    nome_comum: boolean
  }
  probabilidade: 'BAIXA' | 'MEDIA' | 'ALTA'
  cnjs_suspeitos: string[]
}

export interface PadroesAgregados {
  total_processos: number
  processos_com_triangulacao: number
  processos_com_troca_direta: number
  processos_com_prova_emprestada: number
  testemunhas_profissionais: number
  advogados_ofensores: string[]
  concentracao_uf: { [key: string]: number }
}

// Enums for classification
export type RiscoLevel = 'ALTO' | 'MEDIO' | 'BAIXO'
export type ProbabilidadeLevel = 'BAIXA' | 'MEDIA' | 'ALTA'
export type ClassificacaoEstrategica = 'Normal' | 'Observação' | 'Atenção' | 'Crítico'

// Utility types for scoring
export interface ScoreFactors {
  comarca_uf: number
  advogado_ativo: number
  temporalidade: number
  nome_comum: boolean
}

export interface PatternConfidence {
  score: number
  factors: string[]
  reliability: 'LOW' | 'MEDIUM' | 'HIGH'
}

// Request/Response types for API
export interface AnalysisRequest {
  org_id?: string
  filters?: {
    cnjs?: string[]
    periodo?: {
      inicio: string
      fim: string
    }
    incluir_padroes?: ('trocaDireta' | 'triangulacao' | 'duploPapel' | 'provaEmprestada' | 'homonimos')[]
  }
}

export interface AnalysisResponse {
  success: boolean
  data?: AnalysisResult
  error?: string
  metadata?: {
    processed_at: string
    processing_time_ms: number
    total_processos: number
    patterns_detected: number
  }
}