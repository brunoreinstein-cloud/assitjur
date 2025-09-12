import { serve } from '../_shared/observability.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ReviewRequest {
  orgId: string;
  dryRun?: boolean;
}

interface ReviewSummary {
  processos_avaliados: number;
  testemunhas_avaliadas: number;
  processos_atualizados: number;
  testemunhas_atualizadas: number;
  stubs_criados: number;
  triangulacoes: number;
  trocas_diretas: number;
  duplo_papel: number;
  provas_emprestadas: number;
}

interface ReviewResponse {
  orgId: string;
  dryRun: boolean;
  summary: ReviewSummary;
  warnings: string[];
  errors: string[];
  timestamp: string;
  duration_ms: number;
}

serve('review-update-dados', async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Review & Update job iniciado');
    
    const { orgId, dryRun = false }: ReviewRequest = await req.json();
    
    if (!orgId) {
      throw new Error('orgId é obrigatório');
    }

    console.log(`📊 Processando org: ${orgId}, dryRun: ${dryRun}`);

    // 1. Buscar dados existentes
    const { processos, testemunhas } = await fetchExistingData(orgId);
    
    console.log(`📈 Dados carregados: ${processos.length} processos, ${testemunhas.length} testemunhas`);

    // 2. Normalizar listas
    const { processosNormalizados, testemunhasNormalizadas } = normalizeLists(processos, testemunhas);
    
    // 3. Reconciliar CNJs (criar stubs se necessário)
    const { stubs, reconciliationWarnings } = reconcileCNJs(processosNormalizados, testemunhasNormalizadas, orgId);
    
    // 4. Combinar processos existentes com stubs
    const todosProcessos = [...processosNormalizados, ...stubs];
    
    // 5. Recalcular flags analíticas
    const { 
      processosAtualizados, 
      testemunhasAtualizadas,
      patternStats 
    } = recalculateAnalyticalFlags(todosProcessos, testemunhasNormalizadas);
    
    // 6. Aplicar classificações
    const { processosClassificados, testemunhasClassificadas } = applyClassifications(
      processosAtualizados, 
      testemunhasAtualizadas
    );
    
    // 7. Se não é dry-run, persistir dados
    let upsertResults = { processos: 0, testemunhas: 0 };
    if (!dryRun) {
      upsertResults = await persistUpdatedData(orgId, processosClassificados, testemunhasClassificadas);
      
      // 8. Gerar/atualizar agregados
      await generateAggregates(orgId, processosClassificados, testemunhasClassificadas);
    }
    
    // 9. Telemetria
    await logTelemetry(orgId, {
      action: dryRun ? 'review_dry_run' : 'review_apply',
      processos_count: processos.length,
      testemunhas_count: testemunhas.length,
      stubs_created: stubs.length,
      patterns: patternStats
    });

    const summary: ReviewSummary = {
      processos_avaliados: todosProcessos.length,
      testemunhas_avaliadas: testemunhas.length,
      processos_atualizados: dryRun ? 0 : upsertResults.processos,
      testemunhas_atualizadas: dryRun ? 0 : upsertResults.testemunhas,
      stubs_criados: stubs.length,
      triangulacoes: patternStats.triangulacao,
      trocas_diretas: patternStats.troca_direta,
      duplo_papel: patternStats.duplo_papel,
      provas_emprestadas: patternStats.prova_emprestada
    };

    const response: ReviewResponse = {
      orgId,
      dryRun,
      summary,
      warnings: reconciliationWarnings,
      errors: [],
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    };

    console.log(`✅ Review concluído em ${response.duration_ms}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no review:', error);
    
    const errorResponse: ReviewResponse = {
      orgId: '',
      dryRun: false,
      summary: {
        processos_avaliados: 0,
        testemunhas_avaliadas: 0,
        processos_atualizados: 0,
        testemunhas_atualizadas: 0,
        stubs_criados: 0,
        triangulacoes: 0,
        trocas_diretas: 0,
        duplo_papel: 0,
        provas_emprestadas: 0
      },
      warnings: [],
      errors: [error.message],
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Busca dados existentes por orgId
 */
async function fetchExistingData(orgId: string) {
  console.log('📥 Buscando dados existentes...');
  
  const [processosResult, testemunhasResult] = await Promise.all([
    supabase
      .rpc('get_processos_masked', { org_uuid: orgId }),
    supabase
      .from('pessoas')
      .select('*')
      .eq('org_id', orgId)
  ]);

  if (processosResult.error) throw new Error(`Erro ao buscar processos: ${processosResult.error.message}`);
  if (testemunhasResult.error) throw new Error(`Erro ao buscar testemunhas: ${testemunhasResult.error.message}`);

  return {
    processos: processosResult.data || [],
    testemunhas: testemunhasResult.data || []
  };
}

/**
 * Normaliza listas (remove colchetes, split separadores, dedup)
 */
function normalizeLists(processos: any[], testemunhas: any[]) {
  console.log('🔧 Normalizando listas...');
  
  const processosNormalizados = processos.map(processo => ({
    ...processo,
    advogados_parte_ativa: parseList(processo.advogados_parte_ativa),
    testemunhas_ativo_limpo: parseList(processo.testemunhas_ativo_limpo),
    testemunhas_passivo_limpo: parseList(processo.testemunhas_passivo_limpo),
    todas_testemunhas: parseList(processo.todas_testemunhas)
  }));

  const testemunhasNormalizadas = testemunhas.map(testemunha => ({
    ...testemunha,
    cnjs_como_testemunha: parseList(testemunha.cnjs_como_testemunha),
    cnjs_como_reclamante: parseList(testemunha.cnjs_como_reclamante),
    cnjs_ativo: parseList(testemunha.cnjs_ativo),
    cnjs_passivo: parseList(testemunha.cnjs_passivo),
    cnjs_troca_favor: parseList(testemunha.cnjs_troca_favor),
    cnjs_triangulacao: parseList(testemunha.cnjs_triangulacao),
    nome_testemunha_normalizado: normalizeNome(testemunha.nome_testemunha)
  }));

  return { processosNormalizados, testemunhasNormalizadas };
}

/**
 * Parse de lista com separadores ; e ,
 */
function parseList(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  
  if (typeof input === 'string') {
    let clean = input.replace(/^\[|\]$/g, '').replace(/^["']|["']$/g, '');
    
    if (!clean.includes(';') && !clean.includes(',')) {
      return clean ? [clean.trim()] : [];
    }
    
    const separatorRegex = /[;,]/;
    return clean.split(separatorRegex)
      .map(item => item.replace(/^["']|["']$/g, '').trim())
      .filter(item => item.length > 0)
      .filter((item, index, arr) => arr.indexOf(item) === index); // dedup
  }
  
  return [String(input)];
}

/**
 * Normaliza nome para comparação
 */
function normalizeNome(nome: string): string {
  return nome.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Reconcilia CNJs entre abas (cria stubs para CNJs faltantes)
 */
function reconcileCNJs(processos: any[], testemunhas: any[], orgId: string) {
  console.log('🔄 Reconciliando CNJs...');
  
  const existingCNJs = new Set(processos.map(p => p.cnj));
  const referencedCNJs = new Set<string>();
  const warnings: string[] = [];
  const stubs: any[] = [];
  
  // Coletar todos os CNJs referenciados por testemunhas
  for (const testemunha of testemunhas) {
    const cnjs = testemunha.cnjs_como_testemunha || [];
    for (const cnj of cnjs) {
      if (cnj && typeof cnj === 'string') {
        referencedCNJs.add(cnj.trim());
      }
    }
  }
  
  // Identificar CNJs que precisam de stubs
  for (const cnj of referencedCNJs) {
    if (!isValidCNJFormat(cnj)) {
      warnings.push(`CNJ inválido: "${cnj}" (deve ter 20 dígitos)`);
      continue;
    }
    
    if (!existingCNJs.has(cnj)) {
      // Criar stub
      const stub = {
        cnj,
        org_id: orgId,
        status: 'desconhecido',
        fase: 'desconhecida',
        uf: '',
        comarca: '',
        reclamante_limpo: '',
        advogados_parte_ativa: [],
        testemunhas_ativo_limpo: [],
        testemunhas_passivo_limpo: [],
        todas_testemunhas: [],
        // Flags de controle
        is_stub: true,
        precisa_completar: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      stubs.push(stub);
      warnings.push(`Stub criado para CNJ: "${cnj}"`);
    }
  }
  
  return { stubs, reconciliationWarnings: warnings };
}

/**
 * Valida formato de CNJ (20 dígitos)
 */
function isValidCNJFormat(cnj: string): boolean {
  if (!cnj || typeof cnj !== 'string') return false;
  const cleanCNJ = cnj.replace(/[^\d]/g, '');
  return cleanCNJ.length === 20 && /^\d{20}$/.test(cleanCNJ);
}

/**
 * Recalcula todas as flags analíticas
 */
function recalculateAnalyticalFlags(processos: any[], testemunhas: any[]) {
  console.log('🧮 Recalculando flags analíticas...');
  
  const stats = {
    triangulacao: 0,
    troca_direta: 0,
    duplo_papel: 0,
    prova_emprestada: 0
  };

  // 1. Detectar duplo papel (reclamante que vira testemunha)
  const duploPapelMap = detectDuploPapel(processos, testemunhas);
  
  // 2. Detectar troca direta
  const trocaDiretaResults = detectTrocaDireta(processos);
  
  // 3. Detectar triangulação (simplificado)
  const triangulacaoResults = detectTriangulacao(processos);
  
  // 4. Detectar prova emprestada (>10 depoimentos)
  const provaEmprestadaResults = detectProvaEmprestada(testemunhas);

  // Atualizar processos com flags
  const processosAtualizados = processos.map(processo => {
    const updates: any = { ...processo };
    
    // Duplo papel
    const reclamante = normalizeNome(processo.reclamante_limpo || '');
    const duploPapel = duploPapelMap.get(reclamante);
    if (duploPapel) {
      updates.reclamante_foi_testemunha = true;
      updates.qtd_vezes_reclamante_foi_testemunha = duploPapel.cnjs_como_testemunha.length;
      updates.cnjs_em_que_reclamante_foi_testemunha = duploPapel.cnjs_como_testemunha;
      stats.duplo_papel++;
    }
    
    // Troca direta
    const trocaDireta = trocaDiretaResults.find(t => 
      t.cnjs.includes(processo.cnj)
    );
    if (trocaDireta) {
      updates.troca_direta = true;
      updates.desenho_troca_direta = `${trocaDireta.testemunhaA} ↔ ${trocaDireta.testemunhaB}`;
      updates.cnjs_troca_direta = trocaDireta.cnjs;
      stats.troca_direta++;
    }
    
    // Triangulação
    const triangulacao = triangulacaoResults.find(t => 
      t.cnjs.includes(processo.cnj)
    );
    if (triangulacao) {
      updates.triangulacao_confirmada = true;
      updates.desenho_triangulacao = triangulacao.desenho;
      updates.cnjs_triangulacao = triangulacao.cnjs;
      stats.triangulacao++;
    }
    
    // Prova emprestada
    const todasTestemunhas = [
      ...(processo.testemunhas_ativo_limpo || []),
      ...(processo.testemunhas_passivo_limpo || []),
      ...(processo.todas_testemunhas || [])
    ];
    
    const temProvaEmprestada = todasTestemunhas.some(nome => 
      provaEmprestadaResults.has(normalizeNome(nome || ''))
    );
    
    if (temProvaEmprestada) {
      updates.contem_prova_emprestada = true;
      updates.testemunhas_prova_emprestada = todasTestemunhas.filter(nome =>
        provaEmprestadaResults.has(normalizeNome(nome || ''))
      );
      stats.prova_emprestada++;
    }
    
    return updates;
  });

  // Atualizar testemunhas com flags
  const testemunhasAtualizadas = testemunhas.map(testemunha => {
    const updates: any = { ...testemunha };
    const nome = normalizeNome(testemunha.nome_testemunha);
    
    // Duplo papel
    const duploPapel = duploPapelMap.get(nome);
    if (duploPapel) {
      updates.ja_foi_reclamante = true;
      updates.cnjs_como_reclamante = duploPapel.cnjs_como_reclamante;
    }
    
    // Prova emprestada
    updates.e_prova_emprestada = (testemunha.qtd_depoimentos || 0) > 10;
    
    return updates;
  });

  return {
    processosAtualizados,
    testemunhasAtualizadas,
    patternStats: stats
  };
}

/**
 * Detecta duplo papel (versão simplificada)
 */
function detectDuploPapel(processos: any[], testemunhas: any[]) {
  const duploPapelMap = new Map();
  
  for (const testemunha of testemunhas) {
    const nome = normalizeNome(testemunha.nome_testemunha);
    const cnjsComoTestemunha = testemunha.cnjs_como_testemunha || [];
    
    // Procurar processos onde esta pessoa é reclamante
    const cnjsComoReclamante = processos
      .filter(p => normalizeNome(p.reclamante_limpo || '') === nome)
      .map(p => p.cnj);
    
    if (cnjsComoReclamante.length > 0) {
      duploPapelMap.set(nome, {
        cnjs_como_reclamante: cnjsComoReclamante,
        cnjs_como_testemunha: cnjsComoTestemunha
      });
    }
  }
  
  return duploPapelMap;
}

/**
 * Detecta troca direta (versão simplificada)
 */
function detectTrocaDireta(processos: any[]) {
  const results: any[] = [];
  
  // Mapear testemunha -> CNJs onde testifica
  const testemunhaToCNJs = new Map<string, string[]>();
  
  for (const processo of processos) {
    const todasTestemunhas = [
      ...(processo.testemunhas_ativo_limpo || []),
      ...(processo.testemunhas_passivo_limpo || []),
      ...(processo.todas_testemunhas || [])
    ];
    
    for (const testemunha of todasTestemunhas) {
      if (!testemunha) continue;
      const nome = normalizeNome(testemunha);
      if (!testemunhaToCNJs.has(nome)) {
        testemunhaToCNJs.set(nome, []);
      }
      testemunhaToCNJs.get(nome)!.push(processo.cnj);
    }
  }
  
  // Detectar reciprocidade básica
  const nomes = Array.from(testemunhaToCNJs.keys());
  for (let i = 0; i < nomes.length; i++) {
    for (let j = i + 1; j < nomes.length; j++) {
      const nomeA = nomes[i];
      const nomeB = nomes[j];
      const cnjsA = testemunhaToCNJs.get(nomeA) || [];
      const cnjsB = testemunhaToCNJs.get(nomeB) || [];
      
      // Verificar se há intersecção (mesmos CNJs)
      const intersecao = cnjsA.filter(cnj => cnjsB.includes(cnj));
      if (intersecao.length >= 2) { // Pelo menos 2 CNJs em comum
        results.push({
          testemunhaA: nomeA,
          testemunhaB: nomeB,
          cnjs: intersecao
        });
      }
    }
  }
  
  return results;
}

/**
 * Detecta triangulação (versão simplificada)
 */
function detectTriangulacao(processos: any[]) {
  // Implementação simplificada - detecta padrões básicos
  return []; // Por enquanto retorna vazio
}

/**
 * Detecta prova emprestada (>10 depoimentos)
 */
function detectProvaEmprestada(testemunhas: any[]) {
  const provaEmprestadaSet = new Set<string>();
  
  for (const testemunha of testemunhas) {
    if ((testemunha.qtd_depoimentos || 0) > 10) {
      provaEmprestadaSet.add(normalizeNome(testemunha.nome_testemunha));
    }
  }
  
  return provaEmprestadaSet;
}

/**
 * Aplica classificações estratégicas
 */
function applyClassifications(processos: any[], testemunhas: any[]) {
  console.log('📊 Aplicando classificações...');
  
  const processosClassificados = processos.map(processo => ({
    ...processo,
    classificacao_final: determineClassificacao(processo),
    insight_estrategico: generateInsight(processo)
  }));
  
  const testemunhasClassificadas = testemunhas.map(testemunha => ({
    ...testemunha,
    classificacao: determineTestemunhaClassificacao(testemunha),
    classificacao_estrategica: determineTestemunhaClassificacao(testemunha)
  }));
  
  return { processosClassificados, testemunhasClassificadas };
}

/**
 * Determina classificação do processo
 */
function determineClassificacao(processo: any): string {
  const hasCritico = !!(
    processo.triangulacao_confirmada ||
    processo.troca_direta ||
    processo.contem_prova_emprestada
  );
  
  const hasAtencao = !!(processo.reclamante_foi_testemunha);
  
  if (hasCritico) return 'CRÍTICO';
  if (hasAtencao) return 'ATENÇÃO';
  return 'OBSERVAÇÃO';
}

/**
 * Determina classificação da testemunha
 */
function determineTestemunhaClassificacao(testemunha: any): string {
  if (testemunha.e_prova_emprestada) return 'CRÍTICO';
  if (testemunha.ja_foi_reclamante) return 'ATENÇÃO';
  return 'OBSERVAÇÃO';
}

/**
 * Gera insight estratégico
 */
function generateInsight(processo: any): string {
  const insights: string[] = [];
  
  if (processo.triangulacao_confirmada) {
    insights.push('Rede circular detectada');
  }
  
  if (processo.troca_direta) {
    insights.push('Reciprocidade suspeita');
  }
  
  if (processo.contem_prova_emprestada) {
    insights.push('Testemunha profissional');
  }
  
  if (processo.reclamante_foi_testemunha) {
    insights.push('Duplo papel detectado');
  }
  
  if (insights.length === 0) {
    return 'Nenhum padrão suspeito detectado';
  }
  
  return insights.join('. ') + '. Validação nos autos é obrigatória.';
}

/**
 * Persiste dados atualizados
 */
async function persistUpdatedData(orgId: string, processos: any[], testemunhas: any[]) {
  console.log('💾 Persistindo dados atualizados...');
  
  // Remover flags de controle antes de salvar
  const processosLimpos = processos.map(({ is_stub, precisa_completar, ...resto }) => resto);
  
  const [processosResult, testemunhasResult] = await Promise.all([
    supabase
      .from('processos')
      .upsert(processosLimpos),
    supabase  
      .from('pessoas')
      .upsert(testemunhas)
  ]);

  if (processosResult.error) {
    throw new Error(`Erro ao salvar processos: ${processosResult.error.message}`);
  }
  
  if (testemunhasResult.error) {
    throw new Error(`Erro ao salvar testemunhas: ${testemunhasResult.error.message}`);
  }

  return {
    processos: processosLimpos.length,
    testemunhas: testemunhas.length
  };
}

/**
 * Gera agregados (versão simplificada)
 */
async function generateAggregates(orgId: string, processos: any[], testemunhas: any[]) {
  console.log('📈 Gerando agregados...');
  
  const agregados = {
    org_id: orgId,
    total_processos: processos.length,
    processos_com_triangulacao: processos.filter(p => p.triangulacao_confirmada).length,
    processos_com_troca_direta: processos.filter(p => p.troca_direta).length,
    processos_com_duplo_papel: processos.filter(p => p.reclamante_foi_testemunha).length,
    processos_com_prova_emprestada: processos.filter(p => p.contem_prova_emprestada).length,
    testemunhas_profissionais: testemunhas.filter(t => t.e_prova_emprestada).map(t => ({
      nome: t.nome_testemunha,
      qtd_depoimentos: t.qtd_depoimentos
    })),
    advogados_recorrentes: [],
    concentracao_uf: {},
    concentracao_comarca: {},
    tendencia_temporal: [],
    updated_at: new Date().toISOString()
  };
  
  // Usar função RPC existente para salvar agregados
  const { error } = await supabase.rpc('upsert_padroes_agregados', {
    p_org_id: orgId,
    p_data: agregados
  });
    
  if (error) {
    console.error('Erro ao salvar agregados:', error);
  }
}

/**
 * Registra telemetria
 */
async function logTelemetry(orgId: string, data: any) {
  console.log('📡 Registrando telemetria:', data);
  // Implementar logging se necessário
}