/**
 * AssistJur.IA - Canonical Column Synonyms Mapping
 * Complete mapping system for normalizing field names to canonical format
 */

export interface CanonicalColumnSynonym {
  canonical: string;
  synonyms: string[];
  required: boolean;
  sheet: 'processo' | 'testemunha' | 'both';
  type: 'string' | 'list' | 'number' | 'boolean';
}

/**
 * COMPLETE canonical mapping for all 37 fields (22 processo + 15 testemunha)
 * Maps old format to new canonical format with backward compatibility
 */
export const CANONICAL_COLUMN_SYNONYMS: CanonicalColumnSynonym[] = [
  
  // ===== POR PROCESSO (22 campos) =====
  
  // Obrigatórios
  {
    canonical: 'CNJ',
    synonyms: [
      'CNJ', 'cnj', 'numero_cnj', 'num_cnj', 'processo', 'numero_processo'
    ],
    required: true,
    sheet: 'processo',
    type: 'string'
  },
  {
    canonical: 'Status',
    synonyms: [
      'Status', 'status', 'STATUS', 'situacao', 'estado_processo', 'situacao_processo'
    ],
    required: false,
    sheet: 'processo',
    type: 'string'
  },
  {
    canonical: 'Fase',
    synonyms: [
      'Fase', 'fase', 'FASE', 'fase_processual', 'etapa', 'etapa_processual'
    ],
    required: false,
    sheet: 'processo',
    type: 'string'
  },
  {
    canonical: 'UF',
    synonyms: [
      'UF', 'uf', 'estado', 'unidade_federativa', 'sigla_estado'
    ],
    required: true,
    sheet: 'processo',
    type: 'string'
  },
  {
    canonical: 'Comarca',
    synonyms: [
      'Comarca', 'comarca', 'COMARCA', 'municipio', 'cidade', 'local'
    ],
    required: true,
    sheet: 'processo',
    type: 'string'
  },
  {
    canonical: 'Reclamantes',
    synonyms: [
      'Reclamantes', 'reclamantes', 'reclamante_nome', 'Reclamante_Nome', 
      'reclamante', 'Reclamante', 'reclamante_limpo', 'Reclamante_Limpo',
      'nome_reclamante', 'autor', 'autores', 'nome_autor', 'requerente',
      'requerentes', 'nome_requerente', 'partes_ativas'
    ],
    required: true,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Advogados_Ativo',
    synonyms: [
      'Advogados_Ativo', 'advogados_ativo', 'Advogados (Polo Ativo)',
      'Advogados Polo Ativo', 'advogados_polo_ativo', 'advogado_reclamante',
      'advogados_reclamante', 'advogado_autor', 'advogados_autor',
      'representante_legal_ativo', 'advogados_parte_ativa'
    ],
    required: true,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Testemunhas_Ativo',
    synonyms: [
      'Testemunhas_Ativo', 'testemunhas_ativo', 'Testemunhas (Polo Ativo)',
      'testemunhas_polo_ativo', 'testemunhas_ativo_limpo'
    ],
    required: false,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Testemunhas_Passivo',
    synonyms: [
      'Testemunhas_Passivo', 'testemunhas_passivo', 'Testemunhas (Polo Passivo)',
      'testemunhas_polo_passivo', 'testemunhas_passivo_limpo'
    ],
    required: false,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Todas_Testemunhas',
    synonyms: [
      'Todas_Testemunhas', 'todas_testemunhas', 'testemunhas_todas', 
      'Testemunhas_Todas', 'testemunhas', 'lista_testemunhas',
      'nomes_testemunhas', 'testemunhas_processo', 'testemunhas_envolvidas',
      'testemunhas_completas'
    ],
    required: true,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Reclamante_Foi_Testemunha',
    synonyms: [
      'Reclamante_Foi_Testemunha', 'reclamante_foi_testemunha',
      'reclamante_testemunha', 'foi_testemunha'
    ],
    required: false,
    sheet: 'processo',
    type: 'boolean'
  },
  {
    canonical: 'Qtd_Reclamante_Testemunha',
    synonyms: [
      'Qtd_Reclamante_Testemunha', 'qtd_reclamante_testemunha',
      'qtd_vezes_reclamante_foi_testemunha', 'quantidade_reclamante_testemunha'
    ],
    required: false,
    sheet: 'processo',
    type: 'number'
  },
  {
    canonical: 'CNJs_Reclamante_Testemunha',
    synonyms: [
      'CNJs_Reclamante_Testemunha', 'cnjs_reclamante_testemunha',
      'cnjs_em_que_reclamante_foi_testemunha', 'cnjs_reclamante_foi_testemunha'
    ],
    required: false,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Reclamante_Testemunha_Polo_Passivo',
    synonyms: [
      'Reclamante_Testemunha_Polo_Passivo', 'reclamante_testemunha_polo_passivo',
      'reclamante_polo_passivo'
    ],
    required: false,
    sheet: 'processo',
    type: 'boolean'
  },
  {
    canonical: 'CNJs_Passivo',
    synonyms: [
      'CNJs_Passivo', 'cnjs_passivo', 'cnjs_polo_passivo'
    ],
    required: false,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Triangulacao_Confirmada',
    synonyms: [
      'Triangulacao_Confirmada', 'triangulacao_confirmada',
      'tem_triangulacao', 'triangulacao'
    ],
    required: false,
    sheet: 'processo',
    type: 'boolean'
  },
  {
    canonical: 'Desenho_Triangulacao',
    synonyms: [
      'Desenho_Triangulacao', 'desenho_triangulacao',
      'padrao_triangulacao', 'formato_triangulacao'
    ],
    required: false,
    sheet: 'processo',
    type: 'string'
  },
  {
    canonical: 'CNJs_Triangulacao',
    synonyms: [
      'CNJs_Triangulacao', 'cnjs_triangulacao',
      'cnjs_envolvidos_triangulacao'
    ],
    required: false,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Contem_Prova_Emprestada',
    synonyms: [
      'Contem_Prova_Emprestada', 'contem_prova_emprestada',
      'tem_prova_emprestada', 'prova_emprestada'
    ],
    required: false,
    sheet: 'processo',
    type: 'boolean'
  },
  {
    canonical: 'Testemunhas_Prova_Emprestada',
    synonyms: [
      'Testemunhas_Prova_Emprestada', 'testemunhas_prova_emprestada',
      'nomes_prova_emprestada'
    ],
    required: false,
    sheet: 'processo',
    type: 'list'
  },
  {
    canonical: 'Classificacao_Final',
    synonyms: [
      'Classificacao_Final', 'classificacao_final',
      'classificacao', 'risco', 'nivel_risco'
    ],
    required: false,
    sheet: 'processo',
    type: 'string'
  },
  {
    canonical: 'Insight_Estrategico',  
    synonyms: [
      'Insight_Estrategico', 'insight_estrategico',
      'resumo', 'observacoes_estrategicas', 'comentario_estrategico'
    ],
    required: false,
    sheet: 'processo',
    type: 'string'
  },

  // ===== POR TESTEMUNHA (15 campos) =====

  {
    canonical: 'Nome_Testemunha',
    synonyms: [
      'Nome_Testemunha', 'nome_testemunha', 'testemunha',
      'nome_da_testemunha', 'testemunha_nome'
    ],
    required: true,
    sheet: 'testemunha',
    type: 'string'
  },
  {
    canonical: 'Qtd_Depoimentos',
    synonyms: [
      'Qtd_Depoimentos', 'qtd_depoimentos', 'quantidade_depoimentos',
      'numero_depoimentos', 'total_depoimentos', 'qtde_depoimentos',
      'count_depoimentos'
    ],
    required: true,
    sheet: 'testemunha',
    type: 'number'
  },
  {
    canonical: 'CNJs_Como_Testemunha',
    synonyms: [
      'CNJs_Como_Testemunha', 'cnjs_como_testemunha', 'CNJ_Como_Testemunha',
      'cnj_como_testemunha', 'processos_como_testemunha', 'lista_cnjs',
      'cnjs_testemunha', 'cnjs_depoimento', 'processos_testemunha'
    ],
    required: true,
    sheet: 'testemunha',
    type: 'list'
  },
  {
    canonical: 'Ja_Foi_Reclamante',
    synonyms: [
      'Ja_Foi_Reclamante', 'ja_foi_reclamante',
      'foi_reclamante', 'eh_reclamante'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'boolean'
  },
  {
    canonical: 'CNJs_Como_Reclamante',
    synonyms: [
      'CNJs_Como_Reclamante', 'cnjs_como_reclamante',
      'cnjs_reclamante', 'processos_como_reclamante'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'list'
  },
  {
    canonical: 'Foi_Testemunha_Ativo',
    synonyms: [
      'Foi_Testemunha_Ativo', 'foi_testemunha_ativo',
      'testemunha_polo_ativo', 'ativo'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'boolean'
  },
  {
    canonical: 'Foi_Testemunha_Passivo',
    synonyms: [
      'Foi_Testemunha_Passivo', 'foi_testemunha_passivo',
      'testemunha_polo_passivo', 'passivo'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'boolean'
  },
  {
    canonical: 'CNJs_Passivo',
    synonyms: [
      'CNJs_Passivo', 'cnjs_passivo',
      'cnjs_polo_passivo', 'processos_passivo'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'list'
  },
  {
    canonical: 'Foi_Ambos_Polos',
    synonyms: [
      'Foi_Ambos_Polos', 'foi_ambos_polos',
      'foi_testemunha_em_ambos_polos', 'ambos_polos'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'boolean'
  },
  {
    canonical: 'Participou_Troca_Favor',
    synonyms: [
      'Participou_Troca_Favor', 'participou_troca_favor',
      'troca_favor', 'tem_troca', 'troca_direta'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'boolean'
  },
  {
    canonical: 'CNJs_Troca_Favor',
    synonyms: [
      'CNJs_Troca_Favor', 'cnjs_troca_favor',
      'cnjs_troca_direta', 'processos_troca'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'list'
  },
  {
    canonical: 'Participou_Triangulacao',
    synonyms: [
      'Participou_Triangulacao', 'participou_triangulacao',
      'triangulacao', 'tem_triangulacao'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'boolean'
  },
  {
    canonical: 'CNJs_Triangulacao',
    synonyms: [
      'CNJs_Triangulacao', 'cnjs_triangulacao',
      'processos_triangulacao'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'list'
  },
  {
    canonical: 'E_Prova_Emprestada',
    synonyms: [
      'E_Prova_Emprestada', 'e_prova_emprestada',
      'prova_emprestada', 'eh_prova_emprestada'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'boolean'
  },
  {
    canonical: 'Classificacao',
    synonyms: [
      'Classificacao', 'classificacao', 'nivel', 'categoria'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'string'
  },
  {
    canonical: 'Classificacao_Estrategica',
    synonyms: [
      'Classificacao_Estrategica', 'classificacao_estrategica',
      'estrategica', 'prioridade'
    ],
    required: false,
    sheet: 'testemunha',
    type: 'string'
  }
];

/**
 * Find canonical field name from original input
 */
export function findCanonicalFieldName(
  originalName: string, 
  sheetType: 'processo' | 'testemunha'
): string | null {
  
  const cleanName = originalName.trim();
  
  // Exact match first
  const exactMatch = CANONICAL_COLUMN_SYNONYMS.find(
    col => (col.sheet === sheetType || col.sheet === 'both') && 
           (col.canonical === cleanName || col.synonyms.includes(cleanName))
  );
  
  if (exactMatch) {
    return exactMatch.canonical;
  }
  
  // Case-insensitive match
  const caseInsensitiveMatch = CANONICAL_COLUMN_SYNONYMS.find(
    col => (col.sheet === sheetType || col.sheet === 'both') && 
           (col.canonical.toLowerCase() === cleanName.toLowerCase() ||
            col.synonyms.some(synonym => 
              synonym.toLowerCase() === cleanName.toLowerCase()
            ))
  );
  
  return caseInsensitiveMatch ? caseInsensitiveMatch.canonical : null;
}

/**
 * Get required canonical fields for sheet type
 */
export function getCanonicalRequiredFields(sheetType: 'processo' | 'testemunha'): string[] {
  return CANONICAL_COLUMN_SYNONYMS
    .filter(col => col.required && (col.sheet === sheetType || col.sheet === 'both'))
    .map(col => col.canonical);
}

/**
 * Apply canonical column mapping to headers
 */
export function applyCanonicalMapping(
  headers: string[], 
  sheetType: 'processo' | 'testemunha'
): { 
  mapped: Record<string, string>;
  unmapped: string[];
  missing: string[];
} {
  
  const mapped: Record<string, string> = {};
  const unmapped: string[] = [];
  const requiredFields = getCanonicalRequiredFields(sheetType);
  
  // Map existing columns
  headers.forEach(header => {
    const canonical = findCanonicalFieldName(header, sheetType);
    if (canonical) {
      mapped[header] = canonical;
    } else {
      unmapped.push(header);
    }
  });
  
  // Find missing required fields
  const mappedCanonicalFields = Object.values(mapped);
  const missing = requiredFields.filter(
    field => !mappedCanonicalFields.includes(field)
  );
  
  return { mapped, unmapped, missing };
}

/**
 * Generate comprehensive mapping report
 */
export function generateCanonicalMappingReport(
  originalHeaders: string[],
  sheetType: 'processo' | 'testemunha'
): {
  success: boolean;
  mapped_columns: Record<string, string>;
  unmapped_columns: string[];
  missing_required: string[];
  warnings: string[];
  field_types: Record<string, string>;
} {
  
  const { mapped, unmapped, missing } = applyCanonicalMapping(originalHeaders, sheetType);
  
  const warnings: string[] = [];
  
  if (unmapped.length > 0) {
    warnings.push(`Colunas não reconhecidas: ${unmapped.join(', ')}`);
  }
  
  if (missing.length > 0) {
    warnings.push(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
  }
  
  // Extract field types for mapped columns
  const fieldTypes: Record<string, string> = {};
  Object.values(mapped).forEach(canonical => {
    const fieldInfo = CANONICAL_COLUMN_SYNONYMS.find(col => col.canonical === canonical);
    if (fieldInfo) {
      fieldTypes[canonical] = fieldInfo.type;
    }
  });
  
  return {
    success: missing.length === 0,
    mapped_columns: mapped,
    unmapped_columns: unmapped,
    missing_required: missing,
    warnings,
    field_types: fieldTypes
  };
}