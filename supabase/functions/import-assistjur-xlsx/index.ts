import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { audit } from '../_shared/audit.ts';

// Tipos do AssistJur.IA
interface ProcessoRow {
  cnj: string;
  status?: string;
  fase?: string;
  uf?: string;
  comarca?: string;
  reclamantes?: string[];
  advogados_ativo?: string[];
  testemunhas_ativo?: string[];
  testemunhas_passivo?: string[];
  todas_testemunhas?: string[];
}

interface TestemunhaRow {
  nome_testemunha: string;
  qtd_depoimentos: number;
  cnjs_como_testemunha: string[];
}

interface ValidationIssue {
  sheet: string;
  row: number;
  column?: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  original?: any;
  fixed?: any;
}

interface ValidationReport {
  summary: {
    total_sheets: number;
    total_rows: number;
    valid_rows: number;
    error_count: number;
    warning_count: number;
    success_rate: number;
  };
  issues: ValidationIssue[];
  samples: {
    processos: ProcessoRow[];
    testemunhas: TestemunhaRow[];
  };
  compliance: {
    lgpd_compliant: boolean;
    warning_message: string;
  };
}

// Sistema de sinônimos conforme especificado
const FIELD_SYNONYMS: Record<string, string[]> = {
  // Advogados - múltiplas variações aceitas
  advogados_ativo: [
    'Advogados (Polo Ativo)',
    'Advogados Polo Ativo',
    'advogados_polo_ativo',
    'advogados_ativo',
    'Advogados_Ativo'
  ],
  advogados_passivo: [
    'Advogados (Polo Passivo)',
    'Advogados Polo Passivo',
    'advogados_polo_passivo',
    'advogados_passivo',
    'Advogados_Passivo'
  ],
  // Testemunhas - aceita variações
  testemunhas_ativo: [
    'testemunhas_ativo',
    'Testemunhas_Ativo',
    'testemunhas_polo_ativo',
    'Testemunhas (Polo Ativo)'
  ],
  testemunhas_passivo: [
    'testemunhas_passivo',
    'Testemunhas_Passivo',
    'testemunhas_polo_passivo',
    'Testemunhas (Polo Passivo)'
  ],
  // Todas as testemunhas - sinônimos importantes
  todas_testemunhas: [
    'testemunhas_todas',
    'Testemunhas_Todas',
    'todas_testemunhas',
    'Todas_Testemunhas',
    'testemunhas_completas'
  ],
  // CNJs como testemunha
  cnjs_como_testemunha: [
    'cnjs_como_testemunha',
    'CNJs_Como_Testemunha',
    'CNJs_Testemunha',
    'cnjs_testemunha'
  ],
  // Campos básicos
  cnj: ['cnj', 'CNJ', 'numero_cnj', 'numero_processo'],
  reclamantes: ['reclamantes', 'Reclamantes', 'autores', 'requerentes', 'partes_ativas'],
  nome_testemunha: ['nome_testemunha', 'Nome_Testemunha', 'nome', 'testemunha', 'nome_completo'],
  qtd_depoimentos: ['qtd_depoimentos', 'quantidade_depoimentos', 'total_depoimentos', 'numero_depoimentos']
};

// Utilitários de normalização
function parseList(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  
  let str = String(value).trim();
  
  // Remove colchetes e aspas
  str = str.replace(/^\[|\]$/g, '').replace(/^["']|["']$/g, '');
  
  // Split por separadores múltiplos, trim, remove vazios, deduplica
  const items = str.split(/[;,\n\r]+/)
    .map(item => item.trim())
    .filter(Boolean);
    
  return [...new Set(items)]; // deduplica mantendo ordem
}

function normalizeName(value: any): string {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()); // Title Case
}

function keepCNJAsText(value: any): string {
  if (!value) return '';
  return String(value).trim(); // Mantém como string bruta
}

// Mapeamento de colunas com sinônimos
function mapColumns(headers: string[]): Record<string, number> {
  const columnMap: Record<string, number> = {};
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.trim();
    if (!header) continue;
    
    // Busca direta
    for (const [canonical, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (synonyms.some(synonym => 
        synonym.toLowerCase() === header.toLowerCase()
      )) {
        columnMap[canonical] = i;
        break;
      }
    }
  }
  
  return columnMap;
}

// Detecção de abas obrigatórias
function detectSheets(workbook: any): { processos?: any; testemunhas?: any; error?: string } {
  const sheetNames = workbook.SheetNames;
  
  let processosSheet = null;
  let testemunhasSheet = null;
  
  // Busca fuzzy para abas obrigatórias
  for (const name of sheetNames) {
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    
    if (normalized.includes('porprocesso') || normalized.includes('processo')) {
      processosSheet = workbook.Sheets[name];
    } else if (normalized.includes('portestemunha') || normalized.includes('testemunha')) {
      testemunhasSheet = workbook.Sheets[name];
    }
  }
  
  if (!processosSheet || !testemunhasSheet) {
    return {
      error: `Abas obrigatórias não encontradas. Necessário: "Por Processo" e "Por Testemunha". Encontradas: ${sheetNames.join(', ')}`
    };
  }
  
  return { processos: processosSheet, testemunhas: testemunhasSheet };
}

// Validação de campos mínimos
function validateMinimumFields(data: any[], type: 'processo' | 'testemunha'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (type === 'processo') {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.cnj) {
        issues.push({
          sheet: 'Por Processo',
          row: i + 2, // +2 por header e índice base 0
          column: 'cnj',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'CNJ é obrigatório'
        });
      }
      if (!row.uf) {
        issues.push({
          sheet: 'Por Processo',
          row: i + 2,
          column: 'uf',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'UF é obrigatório'
        });
      }
      if (!row.comarca) {
        issues.push({
          sheet: 'Por Processo',
          row: i + 2,
          column: 'comarca',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'Comarca é obrigatório'
        });
      }
      if (!row.advogados_ativo || row.advogados_ativo.length === 0) {
        issues.push({
          sheet: 'Por Processo',
          row: i + 2,
          column: 'advogados_ativo',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'Pelo menos um advogado ativo é obrigatório'
        });
      }
      if (!row.todas_testemunhas || row.todas_testemunhas.length === 0) {
        issues.push({
          sheet: 'Por Processo',
          row: i + 2,
          column: 'todas_testemunhas',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'Pelo menos uma testemunha é obrigatória'
        });
      }
    }
  } else if (type === 'testemunha') {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.nome_testemunha) {
        issues.push({
          sheet: 'Por Testemunha',
          row: i + 2,
          column: 'nome_testemunha',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'Nome da testemunha é obrigatório'
        });
      }
      if (row.qtd_depoimentos === undefined || row.qtd_depoimentos === null) {
        issues.push({
          sheet: 'Por Testemunha',
          row: i + 2,
          column: 'qtd_depoimentos',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'Quantidade de depoimentos é obrigatória'
        });
      }
      if (!row.cnjs_como_testemunha || row.cnjs_como_testemunha.length === 0) {
        issues.push({
          sheet: 'Por Testemunha',
          row: i + 2,
          column: 'cnjs_como_testemunha',
          severity: 'error',
          rule: 'campos_minimos',
          message: 'Pelo menos um CNJ como testemunha é obrigatório'
        });
      }
    }
  }
  
  return issues;
}

// Reconciliação entre abas - criar stubs para CNJs citados mas não existentes
function reconcileData(processos: ProcessoRow[], testemunhas: TestemunhaRow[]): { stubs: ProcessoRow[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const stubs: ProcessoRow[] = [];
  
  // CNJs existentes em processos
  const existingCNJs = new Set(processos.map(p => p.cnj));
  
  // CNJs citados em testemunhas
  const referencedCNJs = new Set<string>();
  testemunhas.forEach(t => {
    t.cnjs_como_testemunha?.forEach(cnj => referencedCNJs.add(cnj));
  });
  
  // Criar stubs para CNJs ausentes
  for (const cnj of referencedCNJs) {
    if (!existingCNJs.has(cnj)) {
      stubs.push({
        cnj,
        status: 'desconhecido',
        reclamantes: [],
        advogados_ativo: [],
        testemunhas_ativo: [],
        testemunhas_passivo: [],
        todas_testemunhas: []
      });
      
      issues.push({
        sheet: 'Reconciliação',
        row: 0,
        severity: 'warning',
        rule: 'reconciliacao',
        message: `CNJ ${cnj} citado em testemunhas mas não encontrado em processos. Stub criado.`
      });
    }
  }
  
  return { stubs, issues };
}

// Engine analítico avançado - flags derivadas
function calculateAnalyticFlags(processos: ProcessoRow[], testemunhas: TestemunhaRow[]): {
  processosEnhanced: any[];
  testemunhasEnhanced: any[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  
  // Cria mapas para otimizar buscas
  const processoMap = new Map(processos.map(p => [p.cnj, p]));
  const testemunhaMap = new Map(testemunhas.map(t => [t.nome_testemunha, t]));
  
  // Processa testemunhas primeiro - flags avançadas
  const testemunhasEnhanced = testemunhas.map(t => {
    const enhanced = { ...t };
    
    // Prova emprestada: qtd_depoimentos > 10
    enhanced.e_prova_emprestada = t.qtd_depoimentos > 10;
    
    // Verifica se já foi reclamante em algum processo
    enhanced.ja_foi_reclamante = false;
    enhanced.cnjs_como_reclamante = [];
    
    // Verifica duplo papel (reclamante e testemunha)
    processos.forEach(p => {
      if (p.reclamantes?.some(r => r.toLowerCase().includes(t.nome_testemunha.toLowerCase()))) {
        enhanced.ja_foi_reclamante = true;
        enhanced.cnjs_como_reclamante.push(p.cnj);
      }
    });
    
    // Verifica polos como testemunha
    enhanced.foi_testemunha_ativo = false;
    enhanced.foi_testemunha_passivo = false;
    enhanced.cnjs_passivo = [];
    
    processos.forEach(p => {
      if (p.testemunhas_ativo?.some(ta => ta.toLowerCase().includes(t.nome_testemunha.toLowerCase()))) {
        enhanced.foi_testemunha_ativo = true;
      }
      if (p.testemunhas_passivo?.some(tp => tp.toLowerCase().includes(t.nome_testemunha.toLowerCase()))) {
        enhanced.foi_testemunha_passivo = true;
        enhanced.cnjs_passivo.push(p.cnj);
      }
    });
    
    enhanced.foi_ambos_polos = enhanced.foi_testemunha_ativo && enhanced.foi_testemunha_passivo;
    
    // Logs para flags importantes
    if (enhanced.e_prova_emprestada) {
      issues.push({
        sheet: 'Análise',
        row: 0,
        severity: 'warning',
        rule: 'prova_emprestada',
        message: `Testemunha ${t.nome_testemunha} tem ${t.qtd_depoimentos} depoimentos (>10). Marcada como prova emprestada.`
      });
    }
    
    if (enhanced.ja_foi_reclamante) {
      issues.push({
        sheet: 'Análise',
        row: 0,
        severity: 'warning',
        rule: 'duplo_papel',
        message: `${t.nome_testemunha} teve duplo papel: reclamante em ${enhanced.cnjs_como_reclamante.length} processo(s) e testemunha em ${t.qtd_depoimentos} depoimento(s).`
      });
    }
    
    return enhanced;
  });
  
  // Detecta trocas diretas e triangulações nos processos
  const processosEnhanced = processos.map(processo => {
    const enhanced = { ...processo };
    
    // Inicializa flags
    enhanced.triangulacao_confirmada = false;
    enhanced.desenho_triangulacao = '';
    enhanced.cnjs_triangulacao = [];
    enhanced.contem_prova_emprestada = false;
    enhanced.testemunhas_prova_emprestada = [];
    enhanced.troca_direta = false;
    enhanced.cnjs_troca_direta = [];
    enhanced.reclamante_foi_testemunha = false;
    enhanced.qtd_reclamante_testemunha = 0;
    enhanced.cnjs_reclamante_testemunha = [];
    
    // Verifica prova emprestada neste processo
    const testemunhasComProva = testemunhasEnhanced
      .filter(t => t.e_prova_emprestada && t.cnjs_como_testemunha?.includes(processo.cnj))
      .map(t => t.nome_testemunha);
      
    if (testemunhasComProva.length > 0) {
      enhanced.contem_prova_emprestada = true;
      enhanced.testemunhas_prova_emprestada = testemunhasComProva;
    }
    
    // Detecta se reclamante foi testemunha em outros processos
    processo.reclamantes?.forEach(reclamante => {
      const testemunhaCorrespondente = testemunhasEnhanced.find(t => 
        t.nome_testemunha.toLowerCase().includes(reclamante.toLowerCase()) ||
        reclamante.toLowerCase().includes(t.nome_testemunha.toLowerCase())
      );
      
      if (testemunhaCorrespondente && testemunhaCorrespondente.cnjs_como_testemunha.length > 0) {
        enhanced.reclamante_foi_testemunha = true;
        enhanced.qtd_reclamante_testemunha++;
        enhanced.cnjs_reclamante_testemunha = testemunhaCorrespondente.cnjs_como_testemunha;
      }
    });
    
    // Detecta troca direta: A é testemunha de B e B é testemunha de A
    const todasTestemunhas = [...(processo.testemunhas_ativo || []), ...(processo.testemunhas_passivo || [])];
    
    todasTestemunhas.forEach(testemunha => {
      // Busca processos onde esta testemunha é reclamante
      processos.forEach(outroProcesso => {
        if (outroProcesso.cnj === processo.cnj) return;
        
        const ehReclamanteNoOutro = outroProcesso.reclamantes?.some(r => 
          r.toLowerCase().includes(testemunha.toLowerCase())
        );
        
        const processoTemTestemunhaDoOutro = [...(outroProcesso.testemunhas_ativo || []), ...(outroProcesso.testemunhas_passivo || [])]
          .some(t => processo.reclamantes?.some(r => r.toLowerCase().includes(t.toLowerCase())));
        
        if (ehReclamanteNoOutro && processoTemTestemunhaDoOutro) {
          enhanced.troca_direta = true;
          if (!enhanced.cnjs_troca_direta.includes(outroProcesso.cnj)) {
            enhanced.cnjs_troca_direta.push(outroProcesso.cnj);
          }
        }
      });
    });
    
    // Detecta triangulação simples: A→B→C→A
    if (enhanced.troca_direta && enhanced.cnjs_troca_direta.length > 1) {
      enhanced.triangulacao_confirmada = true;
      enhanced.cnjs_triangulacao = enhanced.cnjs_troca_direta;
      enhanced.desenho_triangulacao = `${processo.cnj} → ${enhanced.cnjs_troca_direta.join(' → ')} → ${processo.cnj}`;
      
      issues.push({
        sheet: 'Análise',
        row: 0,
        severity: 'warning',
        rule: 'triangulacao',
        message: `Triangulação detectada: ${enhanced.desenho_triangulacao}`
      });
    }
    
    // Log para troca direta
    if (enhanced.troca_direta) {
      issues.push({
        sheet: 'Análise',
        row: 0,
        severity: 'info',
        rule: 'troca_direta',
        message: `Troca direta detectada no processo ${processo.cnj} com ${enhanced.cnjs_troca_direta.length} processo(s): ${enhanced.cnjs_troca_direta.join(', ')}`
      });
    }
    
    return enhanced;
  });
  
  return { processosEnhanced, testemunhasEnhanced, issues };
}

Deno.serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('Token de autenticação necessário');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error('Organização não encontrada');
    }

    const startTime = Date.now();
    const uploadId = crypto.randomUUID();

    // Log inicial
    await supabase
      .from('assistjur._ingest_logs')
      .insert({
        org_id: profile.organization_id,
        upload_id: uploadId,
        filename: 'upload.xlsx',
        status: 'processing',
        created_by: user.id
      });

    // Processar arquivo
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    const fileBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fileBuffer, { type: 'array' });

    // Detectar abas obrigatórias
    const { processos: processosSheet, testemunhas: testemunhasSheet, error: sheetError } = detectSheets(workbook);
    
    if (sheetError) {
      throw new Error(sheetError);
    }

    // Converter sheets para JSON
    const processosRaw = XLSX.utils.sheet_to_json(processosSheet, { header: 1 });
    const testemunhasRaw = XLSX.utils.sheet_to_json(testemunhasSheet, { header: 1 });

    if (!processosRaw.length || !testemunhasRaw.length) {
      throw new Error('Abas vazias detectadas');
    }

    // Mapear colunas usando sinônimos
    const processosHeaders = processosRaw[0] as string[];
    const testemunhasHeaders = testemunhasRaw[0] as string[];
    
    const processosColumnMap = mapColumns(processosHeaders);
    const testemunhasColumnMap = mapColumns(testemunhasHeaders);

    // Normalizar dados
    const processos: ProcessoRow[] = processosRaw.slice(1).map((row: any[]) => ({
      cnj: keepCNJAsText(row[processosColumnMap.cnj]),
      status: row[processosColumnMap.status]?.toString() || '',
      fase: row[processosColumnMap.fase]?.toString() || '',
      uf: row[processosColumnMap.uf]?.toString() || '',
      comarca: row[processosColumnMap.comarca]?.toString() || '',
      reclamantes: parseList(row[processosColumnMap.reclamantes]),
      advogados_ativo: parseList(row[processosColumnMap.advogados_ativo]),
      testemunhas_ativo: parseList(row[processosColumnMap.testemunhas_ativo]),
      testemunhas_passivo: parseList(row[processosColumnMap.testemunhas_passivo]),
      todas_testemunhas: parseList(row[processosColumnMap.todas_testemunhas])
    })).filter(p => p.cnj); // Remove linhas sem CNJ

    const testemunhas: TestemunhaRow[] = testemunhasRaw.slice(1).map((row: any[]) => ({
      nome_testemunha: normalizeName(row[testemunhasColumnMap.nome_testemunha]),
      qtd_depoimentos: parseInt(row[testemunhasColumnMap.qtd_depoimentos]) || 0,
      cnjs_como_testemunha: parseList(row[testemunhasColumnMap.cnjs_como_testemunha])
    })).filter(t => t.nome_testemunha); // Remove linhas sem nome

    // Validações
    let issues: ValidationIssue[] = [];
    
    // Validar campos mínimos
    issues = issues.concat(validateMinimumFields(processos, 'processo'));
    issues = issues.concat(validateMinimumFields(testemunhas, 'testemunha'));

    // Reconciliação
    const { stubs, issues: reconcileIssues } = reconcileData(processos, testemunhas);
    issues = issues.concat(reconcileIssues);

    // Combinar processos originais com stubs
    const allProcessos = [...processos, ...stubs];

    // Engine analítico
    const { processosEnhanced, testemunhasEnhanced, issues: analyticIssues } = calculateAnalyticFlags(allProcessos, testemunhas);
    issues = issues.concat(analyticIssues);

    // Gravar em staging
    if (processosEnhanced.length > 0) {
      const processosForStaging = processosEnhanced.map((p, index) => ({
        org_id: profile.organization_id,
        upload_id: uploadId,
        row_number: index + 1,
        cnj: p.cnj,
        status: p.status,
        fase: p.fase,
        uf: p.uf,
        comarca: p.comarca,
        reclamantes: p.reclamantes || [],
        advogados_ativo: p.advogados_ativo || [],
        testemunhas_ativo: p.testemunhas_ativo || [],
        testemunhas_passivo: p.testemunhas_passivo || [],
        todas_testemunhas: p.todas_testemunhas || [],
        is_valid: !issues.some(issue => issue.sheet === 'Por Processo' && issue.row === index + 2 && issue.severity === 'error'),
        validation_errors: issues.filter(issue => issue.sheet === 'Por Processo' && issue.row === index + 2),
        is_stub: stubs.some(stub => stub.cnj === p.cnj)
      }));

      await supabase
        .from('assistjur._stg_processo')
        .insert(processosForStaging);
    }

    if (testemunhasEnhanced.length > 0) {
      const testemunhasForStaging = testemunhasEnhanced.map((t, index) => ({
        org_id: profile.organization_id,
        upload_id: uploadId,
        row_number: index + 1,
        nome_testemunha: t.nome_testemunha,
        qtd_depoimentos: t.qtd_depoimentos,
        cnjs_como_testemunha: t.cnjs_como_testemunha || [],
        is_valid: !issues.some(issue => issue.sheet === 'Por Testemunha' && issue.row === index + 2 && issue.severity === 'error'),
        validation_errors: issues.filter(issue => issue.sheet === 'Por Testemunha' && issue.row === index + 2)
      }));

      await supabase
        .from('assistjur._stg_testemunha')
        .insert(testemunhasForStaging);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calcular métricas
    const totalRows = processos.length + testemunhas.length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const validRows = totalRows - errorCount;
    const successRate = totalRows > 0 ? (validRows / totalRows) * 100 : 0;

    // Relatório de validação
    const report: ValidationReport = {
      summary: {
        total_sheets: 2,
        total_rows: totalRows,
        valid_rows: validRows,
        error_count: errorCount,
        warning_count: warningCount,
        success_rate: parseFloat(successRate.toFixed(2))
      },
      issues,
      samples: {
        processos: processosEnhanced.slice(0, 10),
        testemunhas: testemunhasEnhanced.slice(0, 10)
      },
      compliance: {
        lgpd_compliant: true,
        warning_message: "⚠️ AVISO LEGAL: Esta análise é preliminar. Validação nos autos é obrigatória antes de qualquer decisão judicial ou administrativa."
      }
    };

    // Atualizar log final
    await supabase
      .from('assistjur._ingest_logs')
      .update({
        file_size: fileBuffer.byteLength,
        total_sheets: 2,
        total_rows: totalRows,
        valid_rows: validRows,
        error_count: errorCount,
        warning_count: warningCount,
        success_rate: successRate,
        processing_duration_ms: duration,
        validation_report: report,
        issues: issues,
        status: errorCount > 0 ? 'completed_with_errors' : 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('upload_id', uploadId);

    await audit(req, {
      user_id: user.id,
      org_id: profile.organization_id,
      action: 'IMPORT',
      resource: 'assistjur_xlsx',
      after: {
        upload_id: uploadId,
        processos: processosEnhanced.length,
        testemunhas: testemunhasEnhanced.length
      }
    });

    return new Response(JSON.stringify({
      success: true,
      upload_id: uploadId,
      report
    }), {
      headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro no pipeline:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' }
    });
  }
});