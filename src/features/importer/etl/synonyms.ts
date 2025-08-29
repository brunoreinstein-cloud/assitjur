/**
 * Mapeamento de sinônimos para colunas do AssistJur.IA
 * Sistema de normalização de nomes de colunas seguindo as especificações consolidadas
 */

export interface ColumnSynonyms {
  normalized: string;
  synonyms: string[];
  required: boolean;
  sheet: 'processo' | 'testemunha' | 'both';
}

export const COLUMN_SYNONYMS: ColumnSynonyms[] = [
  // Campos Por Processo - Obrigatórios
  {
    normalized: 'cnj',
    synonyms: ['CNJ', 'cnj', 'numero_cnj', 'num_cnj', 'processo', 'numero_processo'],
    required: true,
    sheet: 'processo'
  },
  {
    normalized: 'uf',
    synonyms: ['UF', 'uf', 'estado', 'unidade_federativa', 'sigla_estado'],
    required: true,
    sheet: 'processo'
  },
  {
    normalized: 'comarca',
    synonyms: ['comarca', 'Comarca', 'COMARCA', 'municipio', 'cidade'],
    required: true,
    sheet: 'processo'
  },
  {
    normalized: 'reclamante_nome',
    synonyms: [
      'reclamante_nome', 'Reclamante_Nome', 'reclamante', 'Reclamante', 
      'Reclamante_Limpo', 'reclamante_limpo', 'nome_reclamante',
      'autor', 'nome_autor', 'requerente', 'nome_requerente'
    ],
    required: true,
    sheet: 'processo'
  },
  {
    normalized: 'reu_nome',
    synonyms: [
      'reu_nome', 'Reu_Nome', 'reu', 'Reu', 'REU',
      'reclamado', 'nome_reclamado', 'requerido', 'nome_requerido'
    ],
    required: true,
    sheet: 'processo'
  },
  {
    normalized: 'advogados_ativo',
    synonyms: [
      'advogados_ativo', 'Advogados_Ativo', 'advogados_polo_ativo',
      'advogado_reclamante', 'advogados_reclamante', 'advogado_autor',
      'advogados_autor', 'representante_legal_ativo'
    ],
    required: true,
    sheet: 'processo'
  },
  {
    normalized: 'todas_testemunhas',
    synonyms: [
      'todas_testemunhas', 'Todas_Testemunhas', 'testemunhas_todas',
      'testemunhas', 'lista_testemunhas', 'nomes_testemunhas',
      'testemunhas_processo', 'testemunhas_envolvidas'
    ],
    required: true,
    sheet: 'processo'
  },

  // Campos Por Processo - Opcionais
  {
    normalized: 'fase',
    synonyms: ['fase', 'Fase', 'fase_processual', 'etapa', 'situacao_processo'],
    required: false,
    sheet: 'processo'
  },
  {
    normalized: 'status',
    synonyms: ['status', 'Status', 'STATUS', 'situacao', 'estado_processo'],
    required: false,
    sheet: 'processo'
  },
  {
    normalized: 'data_audiencia',
    synonyms: [
      'data_audiencia', 'Data_Audiencia', 'data_da_audiencia',
      'audiencia', 'proxima_audiencia', 'dt_audiencia'
    ],
    required: false,
    sheet: 'processo'
  },
  {
    normalized: 'observacoes',
    synonyms: [
      'observacoes', 'Observacoes', 'observações', 'Observações',
      'obs', 'comentarios', 'notas', 'anotacoes'
    ],
    required: false,
    sheet: 'processo'
  },
  {
    normalized: 'tribunal',
    synonyms: ['tribunal', 'Tribunal', 'TRIBUNAL', 'orgao_julgador'],
    required: false,
    sheet: 'processo'
  },
  {
    normalized: 'vara',
    synonyms: ['vara', 'Vara', 'VARA', 'vara_trabalhista'],
    required: false,
    sheet: 'processo'
  },

  // Campos Por Testemunha - Obrigatórios
  {
    normalized: 'nome_testemunha',
    synonyms: [
      'nome_testemunha', 'Nome_Testemunha', 'testemunha',
      'nome_da_testemunha', 'testemunha_nome'
    ],
    required: true,
    sheet: 'testemunha'
  },
  {
    normalized: 'qtd_depoimentos',
    synonyms: [
      'qtd_depoimentos', 'Qtd_Depoimentos', 'quantidade_depoimentos',
      'numero_depoimentos', 'total_depoimentos', 'qtde_depoimentos',
      'count_depoimentos'
    ],
    required: true,
    sheet: 'testemunha'
  },
  {
    normalized: 'cnjs_como_testemunha',
    synonyms: [
      'cnjs_como_testemunha', 'CNJs_Como_Testemunha', 'cnj_como_testemunha',
      'processos_como_testemunha', 'lista_cnjs', 'cnjs_testemunha',
      'cnjs_depoimento', 'processos_testemunha'
    ],
    required: true,
    sheet: 'testemunha'
  },

  // Campos Por Testemunha - Opcionais (preenchidos via join)
  {
    normalized: 'reclamante_nome',
    synonyms: [
      'reclamante_nome', 'Reclamante_Nome', 'reclamante',
      'nome_reclamante', 'autor'
    ],
    required: false,
    sheet: 'testemunha'
  },
  {
    normalized: 'reu_nome',
    synonyms: [
      'reu_nome', 'Reu_Nome', 'reu',
      'nome_reu', 'reclamado'
    ],
    required: false,
    sheet: 'testemunha'
  }
];

/**
 * Encontra o nome normalizado para uma coluna baseado nos sinônimos
 */
export function findNormalizedColumnName(
  originalName: string, 
  sheetType: 'processo' | 'testemunha'
): string | null {
  
  const cleanName = originalName.trim();
  
  // Busca exata primeiro
  const exactMatch = COLUMN_SYNONYMS.find(
    col => (col.sheet === sheetType || col.sheet === 'both') && 
           col.synonyms.includes(cleanName)
  );
  
  if (exactMatch) {
    return exactMatch.normalized;
  }
  
  // Busca case-insensitive
  const caseInsensitiveMatch = COLUMN_SYNONYMS.find(
    col => (col.sheet === sheetType || col.sheet === 'both') && 
           col.synonyms.some(synonym => 
             synonym.toLowerCase() === cleanName.toLowerCase()
           )
  );
  
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch.normalized;
  }
  
  return null;
}

/**
 * Obtém campos obrigatórios para um tipo de planilha
 */
export function getRequiredFields(sheetType: 'processo' | 'testemunha'): string[] {
  return COLUMN_SYNONYMS
    .filter(col => col.required && (col.sheet === sheetType || col.sheet === 'both'))
    .map(col => col.normalized);
}

/**
 * Aplica mapeamento de sinônimos em um cabeçalho
 */
export function applyColumnMapping(
  headers: string[], 
  sheetType: 'processo' | 'testemunha'
): { 
  mapped: Record<string, string>;
  unmapped: string[];
  missing: string[];
} {
  
  const mapped: Record<string, string> = {};
  const unmapped: string[] = [];
  const requiredFields = getRequiredFields(sheetType);
  
  // Mapear colunas existentes
  headers.forEach(header => {
    const normalized = findNormalizedColumnName(header, sheetType);
    if (normalized) {
      mapped[header] = normalized;
    } else {
      unmapped.push(header);
    }
  });
  
  // Verificar campos obrigatórios ausentes
  const mappedNormalizedFields = Object.values(mapped);
  const missing = requiredFields.filter(
    field => !mappedNormalizedFields.includes(field)
  );
  
  return { mapped, unmapped, missing };
}

/**
 * Gera relatório de mapeamento de colunas
 */
export function generateMappingReport(
  originalHeaders: string[],
  sheetType: 'processo' | 'testemunha'
): {
  success: boolean;
  mapped_columns: Record<string, string>;
  unmapped_columns: string[];
  missing_required: string[];
  warnings: string[];
} {
  
  const { mapped, unmapped, missing } = applyColumnMapping(originalHeaders, sheetType);
  
  const warnings: string[] = [];
  
  if (unmapped.length > 0) {
    warnings.push(`Colunas não reconhecidas serão ignoradas: ${unmapped.join(', ')}`);
  }
  
  if (missing.length > 0) {
    warnings.push(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
  }
  
  return {
    success: missing.length === 0,
    mapped_columns: mapped,
    unmapped_columns: unmapped,
    missing_required: missing,
    warnings
  };
}