/**
 * Sistema de reconciliação de CNJs entre as abas
 * Cria stubs para CNJs mencionados em testemunhas mas não existentes em processos
 */

export interface ProcessStub {
  cnj: string;
  status: string;
  fase: string;
  uf: string;
  comarca: string;
  reclamantes: string[];
  advogados_ativo: string[];
  testemunhas_ativo: string[];
  testemunhas_passivo: string[];
  todas_testemunhas: string[];
  // Flags para controle
  is_stub: boolean;
  precisa_completar: boolean;
  created_from: 'testemunha_reference';
  org_id: string;
}

export interface ReconciliationWarning {
  type: 'missing_processo_stub' | 'invalid_cnj_format' | 'duplicate_cnj_reference';
  cnj: string;
  source: string;
  message: string;
  line?: number;
  testemunha_nome?: string;
}

export interface ReconciliationResult {
  stubs_created: ProcessStub[];
  warnings: ReconciliationWarning[];
  statistics: {
    total_cnjs_referenced: number;
    existing_processos: number;
    stubs_needed: number;
    invalid_cnjs: number;
  };
}

/**
 * Valida formato básico de CNJ (20 dígitos)
 */
export function isValidCNJFormat(cnj: string): boolean {
  if (!cnj || typeof cnj !== 'string') return false;
  
  // Remove espaços e caracteres especiais para validação
  const cleanCNJ = cnj.replace(/[^\d]/g, '');
  
  // CNJ deve ter exatamente 20 dígitos
  return cleanCNJ.length === 20 && /^\d{20}$/.test(cleanCNJ);
}

/**
 * Extrai todos os CNJs únicos mencionados nas testemunhas
 */
export function extractCNJsFromTestemunhas(testemunhas: any[]): Set<string> {
  const allCNJs = new Set<string>();
  
  for (const testemunha of testemunhas) {
    const cnjs = testemunha.cnjs_como_testemunha || [];
    
    for (const cnj of cnjs) {
      if (cnj && typeof cnj === 'string') {
        // Preserva CNJ original como string
        allCNJs.add(cnj.trim());
      }
    }
  }
  
  return allCNJs;
}

/**
 * Identifica CNJs que precisam de stubs
 */
export function identifyMissingCNJs(
  referencedCNJs: Set<string>,
  existingProcessos: any[]
): { missing: string[]; invalid: string[] } {
  const existingCNJSet = new Set(
    existingProcessos.map(p => p.cnj).filter(Boolean)
  );
  
  const missing: string[] = [];
  const invalid: string[] = [];
  
  for (const cnj of referencedCNJs) {
    if (!isValidCNJFormat(cnj)) {
      invalid.push(cnj);
      continue;
    }
    
    if (!existingCNJSet.has(cnj)) {
      missing.push(cnj);
    }
  }
  
  return { missing, invalid };
}

/**
 * Cria stub para um CNJ faltante
 */
export function createProcessStub(cnj: string, orgId: string): ProcessStub {
  return {
    cnj: cnj, // Preserva formato original
    status: 'desconhecido',
    fase: 'desconhecida', 
    uf: '',
    comarca: '',
    reclamantes: [],
    advogados_ativo: [],
    testemunhas_ativo: [],
    testemunhas_passivo: [],
    todas_testemunhas: [],
    // Flags de controle
    is_stub: true,
    precisa_completar: true,
    created_from: 'testemunha_reference',
    org_id: orgId
  };
}

/**
 * Função principal de reconciliação
 */
export function reconcileCNJs(
  processos: any[],
  testemunhas: any[],
  orgId: string
): ReconciliationResult {
  const warnings: ReconciliationWarning[] = [];
  const stubs: ProcessStub[] = [];
  
  // 1. Extrair todos os CNJs referenciados pelas testemunhas
  const referencedCNJs = extractCNJsFromTestemunhas(testemunhas);
  
  // 2. Identificar CNJs faltantes e inválidos
  const { missing, invalid } = identifyMissingCNJs(referencedCNJs, processos);
  
  // 3. Gerar warnings para CNJs inválidos
  for (const invalidCNJ of invalid) {
    const testemunhaRef = testemunhas.find(t => 
      (t.cnjs_como_testemunha || []).includes(invalidCNJ)
    );
    
    warnings.push({
      type: 'invalid_cnj_format',
      cnj: invalidCNJ,
      source: 'testemunha_reference',
      message: `CNJ com formato inválido: "${invalidCNJ}" (deve ter 20 dígitos)`,
      testemunha_nome: testemunhaRef?.nome_testemunha
    });
  }
  
  // 4. Criar stubs para CNJs faltantes válidos
  for (const missingCNJ of missing) {
    const stub = createProcessStub(missingCNJ, orgId);
    stubs.push(stub);
    
    const testemunhaRef = testemunhas.find(t => 
      (t.cnjs_como_testemunha || []).includes(missingCNJ)
    );
    
    warnings.push({
      type: 'missing_processo_stub',
      cnj: missingCNJ,
      source: 'testemunha_reference',
      message: `CNJ "${missingCNJ}" referenciado por testemunha mas não encontrado em processos. Stub criado.`,
      testemunha_nome: testemunhaRef?.nome_testemunha
    });
  }
  
  return {
    stubs_created: stubs,
    warnings,
    statistics: {
      total_cnjs_referenced: referencedCNJs.size,
      existing_processos: processos.length,
      stubs_needed: missing.length,
      invalid_cnjs: invalid.length
    }
  };
}

/**
 * Combina processos existentes com stubs criados
 */
export function mergeProcessosWithStubs(
  existingProcessos: any[],
  stubs: ProcessStub[]
): any[] {
  return [...existingProcessos, ...stubs];
}

/**
 * Filtra apenas os stubs criados de uma lista combinada
 */
export function extractStubsFromProcessos(processos: any[]): ProcessStub[] {
  return processos.filter(p => p.is_stub === true) as ProcessStub[];
}

/**
 * Valida se um processo precisa ser completado
 */
export function needsCompletion(processo: any): boolean {
  if (!processo.is_stub) return false;
  
  return (
    processo.precisa_completar === true ||
    processo.status === 'desconhecido' ||
    !processo.uf ||
    !processo.comarca ||
    (processo.reclamantes || []).length === 0
  );
}