import { createClient } from 'npm:@supabase/supabase-js@2.56.0'
import { corsHeaders, handlePreflight } from '../_shared/cors.ts'

// Types for analysis results
interface AnalysisResult {
  trocaDireta: TrocaDiretaResult[]
  triangulacao: TriangulacaoResult[]
  duploPapel: DuploPapelResult[]
  provaEmprestada: ProvaEmprestadaResult[]
  homonimos: HomonimoResult[]
  padroes: PadroesAgregados
}

interface TrocaDiretaResult {
  testemunhaA: string
  testemunhaB: string
  cnjsA: string[]
  cnjsB: string[]
  advogadosComuns: string[]
  confianca: number
}

interface TriangulacaoResult {
  ciclo: string[]
  cnjs: string[]
  advogados: string[]
  comarcas: string[]
  desenho: string
  confianca: number
}

interface DuploPapelResult {
  nome: string
  cnjs_como_reclamante: string[]
  cnjs_como_testemunha: string[]
  polo_passivo: boolean
  risco: 'ALTO' | 'MEDIO' | 'BAIXO'
}

interface ProvaEmprestadaResult {
  nome: string
  qtd_depoimentos: number
  cnjs: string[]
  advogados_recorrentes: string[]
  concentracao_comarca: number
  alerta: boolean
}

interface HomonimoResult {
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

interface PadroesAgregados {
  total_processos: number
  processos_com_triangulacao: number
  processos_com_troca_direta: number
  processos_com_prova_emprestada: number
  testemunhas_profissionais: number
  advogados_ofensores: string[]
  concentracao_uf: { [key: string]: number }
}

Deno.serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const origin = req.headers.get('origin') ?? '';
  const ch = corsHeaders(req, origin);
  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's org_id from JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user token')
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      throw new Error('User organization not found')
    }

    const orgId = profile.organization_id

    // Query all processos for analysis
    const { data: processos, error: processosError } = await supabase
      .from('processos')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)

    if (processosError) {
      console.error('Query error:', processosError)
      throw processosError
    }

    // Run pattern analysis
    const analysisResult = await runPatternAnalysis(processos || [])

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Pattern Analysis Engine
async function runPatternAnalysis(processos: any[]): Promise<AnalysisResult> {
  console.log(`Starting pattern analysis for ${processos.length} processos`)

  // Build witness index for cross-referencing
  const testemunhaIndex = buildTestemunhaIndex(processos)
  
  return {
    trocaDireta: detectTrocaDireta(processos, testemunhaIndex),
    triangulacao: detectTriangulacao(processos, testemunhaIndex),
    duploPapel: detectDuploPapel(processos, testemunhaIndex),
    provaEmprestada: detectProvaEmprestada(processos, testemunhaIndex),
    homonimos: detectHomonimos(processos, testemunhaIndex),
    padroes: calculatePadroesAgregados(processos, testemunhaIndex)
  }
}

// Build witness index for cross-referencing
function buildTestemunhaIndex(processos: any[]) {
  const index = new Map<string, {
    cnjs: string[]
    polos: { cnj: string, polo: 'ativo' | 'passivo' }[]
    advogados: string[]
    comarcas: string[]
    ufs: string[]
  }>()

  processos.forEach(processo => {
    const allTestemunhas = [
      ...(processo.testemunhas_ativo || []),
      ...(processo.testemunhas_passivo || [])
    ]

    allTestemunhas.forEach(nome => {
      if (!nome?.trim()) return

      if (!index.has(nome)) {
        index.set(nome, {
          cnjs: [],
          polos: [],
          advogados: [],
          comarcas: [],
          ufs: []
        })
      }

      const entry = index.get(nome)!
      entry.cnjs.push(processo.cnj)
      
      // Track polo participation
      if (processo.testemunhas_ativo?.includes(nome)) {
        entry.polos.push({ cnj: processo.cnj, polo: 'ativo' })
      }
      if (processo.testemunhas_passivo?.includes(nome)) {
        entry.polos.push({ cnj: processo.cnj, polo: 'passivo' })
      }

      // Track advogados
      if (processo.advogados_ativo) {
        entry.advogados.push(...processo.advogados_ativo)
      }

      // Track locations
      if (processo.comarca) entry.comarcas.push(processo.comarca)
      if (processo.tribunal) {
        const uf = extractUFFromField(processo.tribunal)
        if (uf) entry.ufs.push(uf)
      }
    })
  })

  return index
}

// 1. Detect Troca Direta (Direct Exchange)
function detectTrocaDireta(processos: any[], testemunhaIndex: Map<string, any>): TrocaDiretaResult[] {
  const trocas: TrocaDiretaResult[] = []
  const processedPairs = new Set<string>()

  for (const [nomeA, dadosA] of testemunhaIndex) {
    for (const [nomeB, dadosB] of testemunhaIndex) {
      if (nomeA === nomeB) continue

      const pairKey = [nomeA, nomeB].sort().join('|')
      if (processedPairs.has(pairKey)) continue
      processedPairs.add(pairKey)

      // Check if A testifies for B and B testifies for A
      const cnjsComuns = dadosA.cnjs.filter(cnj => dadosB.cnjs.includes(cnj))
      if (cnjsComuns.length === 0) continue

      // Verify direct exchange pattern
      let trocaConfirmada = false
      const cnjsATesTemunha = []
      const cnjsBTesTemunha = []
      const advogadosComuns = []

      for (const cnj of cnjsComuns) {
        const processo = processos.find(p => p.cnj === cnj)
        if (!processo) continue

        const aNoAtivo = processo.testemunhas_ativo?.includes(nomeA)
        const aNoPassivo = processo.testemunhas_passivo?.includes(nomeA)
        const bNoAtivo = processo.testemunhas_ativo?.includes(nomeB)
        const bNoPassivo = processo.testemunhas_passivo?.includes(nomeB)

        // Direct exchange: both in different poles
        if ((aNoAtivo && bNoPassivo) || (aNoPassivo && bNoAtivo)) {
          trocaConfirmada = true
          if (aNoAtivo || aNoPassivo) cnjsATesTemunha.push(cnj)
          if (bNoAtivo || bNoPassivo) cnjsBTesTemunha.push(cnj)

          // Track common lawyers
          if (processo.advogados_ativo) {
            advogadosComuns.push(...processo.advogados_ativo)
          }
        }
      }

      if (trocaConfirmada) {
        const confianca = calculateTrocaConfianca(dadosA, dadosB, cnjsComuns)
        trocas.push({
          testemunhaA: nomeA,
          testemunhaB: nomeB,
          cnjsA: cnjsATesTemunha,
          cnjsB: cnjsBTesTemunha,
          advogadosComuns: [...new Set(advogadosComuns)],
          confianca
        })
      }
    }
  }

  return trocas.sort((a, b) => b.confianca - a.confianca)
}

// 2. Detect Triangulação (Triangulation)
function detectTriangulacao(processos: any[], testemunhaIndex: Map<string, any>): TriangulacaoResult[] {
  const triangulacoes: TriangulacaoResult[] = []
  const testemunhas = Array.from(testemunhaIndex.keys())

  // Look for cycles A→B→C→A
  for (let i = 0; i < testemunhas.length; i++) {
    for (let j = i + 1; j < testemunhas.length; j++) {
      for (let k = j + 1; k < testemunhas.length; k++) {
        const [nomeA, nomeB, nomeC] = [testemunhas[i], testemunhas[j], testemunhas[k]]
        
        const ciclo = detectTriangulationCycle([nomeA, nomeB, nomeC], processos, testemunhaIndex)
        if (ciclo) {
          triangulacoes.push(ciclo)
        }
      }
    }
  }

  return triangulacoes.sort((a, b) => b.confianca - a.confianca)
}

function detectTriangulationCycle(nomes: string[], processos: any[], testemunhaIndex: Map<string, any>): TriangulacaoResult | null {
  const [nomeA, nomeB, nomeC] = nomes
  const dadosA = testemunhaIndex.get(nomeA)!
  const dadosB = testemunhaIndex.get(nomeB)!
  const dadosC = testemunhaIndex.get(nomeC)!

  // Find common CNJs
  const cnjsComuns = dadosA.cnjs.filter(cnj => 
    dadosB.cnjs.includes(cnj) && dadosC.cnjs.includes(cnj)
  )

  if (cnjsComuns.length === 0) return null

  let cicloDetectado = false
  const advogados = new Set<string>()
  const comarcas = new Set<string>()

  for (const cnj of cnjsComuns) {
    const processo = processos.find(p => p.cnj === cnj)
    if (!processo) continue

    // Check triangulation pattern
    const padraoTriangular = checkTriangularPattern(processo, [nomeA, nomeB, nomeC])
    if (padraoTriangular) {
      cicloDetectado = true
      
      if (processo.advogados_ativo) {
        processo.advogados_ativo.forEach((adv: string) => advogados.add(adv))
      }
      if (processo.comarca) comarcas.add(processo.comarca)
    }
  }

  if (!cicloDetectado) return null

  const confianca = calculateTriangulacaoConfianca(nomes, cnjsComuns, Array.from(advogados))
  return {
    ciclo: nomes,
    cnjs: cnjsComuns,
    advogados: Array.from(advogados),
    comarcas: Array.from(comarcas),
    desenho: `${nomeA} → ${nomeB} → ${nomeC} → ${nomeA}`,
    confianca
  }
}

function checkTriangularPattern(processo: any, nomes: string[]): boolean {
  const ativo = processo.testemunhas_ativo || []
  const passivo = processo.testemunhas_passivo || []

  // Check if names form a triangular pattern (mixed poles)
  let ativoCount = 0
  let passivoCount = 0

  nomes.forEach(nome => {
    if (ativo.includes(nome)) ativoCount++
    if (passivo.includes(nome)) passivoCount++
  })

  // Triangular pattern: at least one in each pole
  return ativoCount > 0 && passivoCount > 0 && (ativoCount + passivoCount) >= 3
}

// 3. Detect Duplo Papel (Dual Role)
function detectDuploPapel(processos: any[], testemunhaIndex: Map<string, any>): DuploPapelResult[] {
  const duploPapel: DuploPapelResult[] = []

  for (const processo of processos) {
    if (!processo.reclamante_nome?.trim()) continue

    const nomeReclamante = processo.reclamante_nome
    const dadosTestemunha = testemunhaIndex.get(nomeReclamante)

    if (dadosTestemunha && dadosTestemunha.cnjs.length > 1) {
      // Found person who is both claimant and witness
      const cnjsComoReclamante = [processo.cnj]
      const cnjsComoTestemunha = dadosTestemunha.cnjs.filter((cnj: string) => cnj !== processo.cnj)
      
      // Check if testified in passive pole
      const poloPassivo = dadosTestemunha.polos.some((p: any) => 
        p.polo === 'passivo' && cnjsComoTestemunha.includes(p.cnj)
      )

      const risco = calculateDuploPapelRisco(cnjsComoReclamante.length, cnjsComoTestemunha.length, poloPassivo)

      duploPapel.push({
        nome: nomeReclamante,
        cnjs_como_reclamante: cnjsComoReclamante,
        cnjs_como_testemunha: cnjsComoTestemunha,
        polo_passivo: poloPassivo,
        risco
      })
    }
  }

  return duploPapel.filter((item, index, arr) => 
    arr.findIndex(x => x.nome === item.nome) === index
  ).sort((a, b) => {
    const riskOrder = { 'ALTO': 3, 'MEDIO': 2, 'BAIXO': 1 }
    return riskOrder[b.risco] - riskOrder[a.risco]
  })
}

// 4. Detect Prova Emprestada (Borrowed Evidence)
function detectProvaEmprestada(processos: any[], testemunhaIndex: Map<string, any>): ProvaEmprestadaResult[] {
  const provaEmprestada: ProvaEmprestadaResult[] = []

  for (const [nome, dados] of testemunhaIndex) {
    if (dados.cnjs.length > 10) { // Threshold for professional witness
      const advogadosRecorrentes = calculateRecurrentLawyers(dados.advogados)
      const concentracaoComarca = calculateComarcaConcentration(dados.comarcas)

      provaEmprestada.push({
        nome,
        qtd_depoimentos: dados.cnjs.length,
        cnjs: dados.cnjs,
        advogados_recorrentes: advogadosRecorrentes,
        concentracao_comarca: concentracaoComarca,
        alerta: dados.cnjs.length > 10
      })
    }
  }

  return provaEmprestada.sort((a, b) => b.qtd_depoimentos - a.qtd_depoimentos)
}

// 5. Detect Homônimos (Homonyms)
function detectHomonimos(processos: any[], testemunhaIndex: Map<string, any>): HomonimoResult[] {
  const homonimos: HomonimoResult[] = []
  const nomesComuns = ['JOÃO SILVA', 'MARIA SANTOS', 'JOSÉ OLIVEIRA', 'ANA SOUZA'] // Extend this list

  for (const [nome, dados] of testemunhaIndex) {
    if (dados.cnjs.length > 1) {
      const score = calculateHomonymScore(nome, dados, nomesComuns)
      const probabilidade = score >= 80 ? 'ALTA' : score >= 50 ? 'MEDIA' : 'BAIXA'

      if (score >= 30) { // Only include potential homonyms
        homonimos.push({
          nome,
          score,
          fatores: {
            comarca_uf: calculateComarcaUFSimilarity(dados.comarcas, dados.ufs),
            advogado_ativo: calculateAdvogadoSimilarity(dados.advogados),
            temporalidade: calculateTemporalitySimilarity(dados.cnjs, processos),
            nome_comum: nomesComuns.some(comum => nome.includes(comum))
          },
          probabilidade,
          cnjs_suspeitos: dados.cnjs
        })
      }
    }
  }

  return homonimos.sort((a, b) => b.score - a.score)
}

// Calculate aggregate patterns
function calculatePadroesAgregados(processos: any[], testemunhaIndex: Map<string, any>): PadroesAgregados {
  const ufCount: { [key: string]: number } = {}
  let processosTriangulacao = 0
  let processosTrocaDireta = 0
  let processosProvaEmprestada = 0
  let testemunhasProfissionais = 0

  processos.forEach(processo => {
    if (processo.triangulacao_confirmada) processosTriangulacao++
    if (processo.troca_direta) processosTrocaDireta++
    if (processo.prova_emprestada) processosProvaEmprestada++

    const uf = extractUFFromField(processo.tribunal)
    if (uf) {
      ufCount[uf] = (ufCount[uf] || 0) + 1
    }
  })

  for (const [nome, dados] of testemunhaIndex) {
    if (dados.cnjs.length > 10) testemunhasProfissionais++
  }

  const advogadosOfensores = calculateAdvogadosOfensores(processos, testemunhaIndex)

  return {
    total_processos: processos.length,
    processos_com_triangulacao: processosTriangulacao,
    processos_com_troca_direta: processosTrocaDireta,
    processos_com_prova_emprestada: processosProvaEmprestada,
    testemunhas_profissionais: testemunhasProfissionais,
    advogados_ofensores: advogadosOfensores,
    concentracao_uf: ufCount
  }
}

// Helper functions for calculations
function calculateTrocaConfianca(dadosA: any, dadosB: any, cnjsComuns: string[]): number {
  let score = 40 // Base score
  
  // More common cases = higher confidence
  score += Math.min(cnjsComuns.length * 10, 30)
  
  // Common lawyers increase confidence
  const advogadosComuns = dadosA.advogados.filter((adv: string) => dadosB.advogados.includes(adv))
  score += Math.min(advogadosComuns.length * 5, 20)
  
  // Same comarca increases confidence
  const comarcasComuns = dadosA.comarcas.filter((comarca: string) => dadosB.comarcas.includes(comarca))
  score += Math.min(comarcasComuns.length * 5, 10)
  
  return Math.min(score, 100)
}

function calculateTriangulacaoConfianca(nomes: string[], cnjs: string[], advogados: string[]): number {
  let score = 50 // Base score for triangulation
  
  score += Math.min(cnjs.length * 5, 20)
  score += Math.min(advogados.length * 3, 15)
  score += nomes.length > 3 ? 15 : 0 // Bonus for larger cycles
  
  return Math.min(score, 100)
}

function calculateDuploPapelRisco(cnjsReclamante: number, cnjsTestemunha: number, poloPassivo: boolean): 'ALTO' | 'MEDIO' | 'BAIXO' {
  if (poloPassivo && cnjsTestemunha > 3) return 'ALTO'
  if (cnjsTestemunha > 5) return 'ALTO'
  if (cnjsTestemunha > 2) return 'MEDIO'
  return 'BAIXO'
}

function calculateRecurrentLawyers(advogados: string[]): string[] {
  const count = advogados.reduce((acc, adv) => {
    acc[adv] = (acc[adv] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  return Object.entries(count)
    .filter(([_, freq]) => freq > 3)
    .map(([adv]) => adv)
}

function calculateComarcaConcentration(comarcas: string[]): number {
  if (comarcas.length === 0) return 0
  
  const count = comarcas.reduce((acc, comarca) => {
    acc[comarca] = (acc[comarca] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const maxCount = Math.max(...Object.values(count))
  return (maxCount / comarcas.length) * 100
}

function calculateHomonymScore(nome: string, dados: any, nomesComuns: string[]): number {
  let score = 0
  
  // Nome comum penalty
  if (nomesComuns.some(comum => nome.includes(comum))) {
    score += 30
  }
  
  // Multiple cases with same comarca
  const comarcaRepetition = calculateComarcaConcentration(dados.comarcas)
  score += Math.min(comarcaRepetition * 0.5, 25)
  
  // Same lawyers across cases
  const advogadoRepetition = calculateRecurrentLawyers(dados.advogados).length
  score += Math.min(advogadoRepetition * 10, 25)
  
  // Many cases increases suspicion
  if (dados.cnjs.length > 5) score += 20
  
  return Math.min(score, 100)
}

function calculateComarcaUFSimilarity(comarcas: string[], ufs: string[]): number {
  if (comarcas.length <= 1) return 0
  
  const uniqueComarcas = new Set(comarcas).size
  const uniqueUFs = new Set(ufs).size
  
  return ((comarcas.length - uniqueComarcas) / comarcas.length + 
          (ufs.length - uniqueUFs) / ufs.length) * 50
}

function calculateAdvogadoSimilarity(advogados: string[]): number {
  if (advogados.length <= 1) return 0
  
  const unique = new Set(advogados).size
  return ((advogados.length - unique) / advogados.length) * 100
}

function calculateTemporalitySimilarity(cnjs: string[], processos: any[]): number {
  // Simplified temporal analysis - could be enhanced with actual dates
  const processosRelacionados = processos.filter(p => cnjs.includes(p.cnj))
  if (processosRelacionados.length <= 1) return 0
  
  // For now, return a basic score based on process count
  return Math.min(processosRelacionados.length * 10, 50)
}

function calculateAdvogadosOfensores(processos: any[], testemunhaIndex: Map<string, any>): string[] {
  const advogadoStats = new Map<string, {
    testemunhas_profissionais: number
    total_testemunhas: number
    concentracao: number
  }>()

  processos.forEach(processo => {
    if (!processo.advogados_ativo) return
    
    processo.advogados_ativo.forEach((advogado: string) => {
      if (!advogadoStats.has(advogado)) {
        advogadoStats.set(advogado, {
          testemunhas_profissionais: 0,
          total_testemunhas: 0,
          concentracao: 0
        })
      }
      
      const stats = advogadoStats.get(advogado)!
      const allTestemunhas = [
        ...(processo.testemunhas_ativo || []),
        ...(processo.testemunhas_passivo || [])
      ]
      
      stats.total_testemunhas += allTestemunhas.length
      
      allTestemunhas.forEach(testemunha => {
        const dadosTestemunha = testemunhaIndex.get(testemunha)
        if (dadosTestemunha && dadosTestemunha.cnjs.length > 10) {
          stats.testemunhas_profissionais++
        }
      })
    })
  })

  return Array.from(advogadoStats.entries())
    .filter(([_, stats]) => {
      const concentracao = stats.total_testemunhas > 0 ? 
        (stats.testemunhas_profissionais / stats.total_testemunhas) : 0
      return stats.testemunhas_profissionais >= 5 && concentracao >= 0.7
    })
    .map(([advogado]) => advogado)
}

function extractUFFromField(field: string | null): string | null {
  if (!field) return null
  const ufMatch = field.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i)
  return ufMatch ? ufMatch[1].toUpperCase() : null
}