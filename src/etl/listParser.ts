/**
 * Parser robusto para listas de strings vindas de diferentes formatos
 * Normaliza `;`, `,` como separadores, remove duplicatas, preserva ordem
 */

export interface ListParseOptions {
  /** Separadores aceitos (padrão: [';', ',']) */
  separators?: string[];
  /** Se deve fazer trim em cada item (padrão: true) */
  trimItems?: boolean;
  /** Se deve remover duplicatas (padrão: true) */
  removeDuplicates?: boolean;
  /** Se deve preservar ordem (padrão: true) */
  preserveOrder?: boolean;
  /** Se deve filtrar items vazios (padrão: true) */
  filterEmpty?: boolean;
  /** Transformação aplicada a cada item */
  transform?: (item: string) => string;
}

const DEFAULT_OPTIONS: Required<ListParseOptions> = {
  separators: [';', ','],
  trimItems: true,
  removeDuplicates: true,
  preserveOrder: true,
  filterEmpty: true,
  transform: (item: string) => item
};

/**
 * Parse uma string ou array em lista normalizada de strings
 */
export function parseList(input: any, options: ListParseOptions = {}): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!input) return [];
  
  let items: string[] = [];
  
  // Se já é array, converte items para string
  if (Array.isArray(input)) {
    items = input.map(item => String(item || ''));
  } 
  // Se é string, precisa fazer parsing
  else if (typeof input === 'string') {
    let cleanInput = input;
    
    // Remove colchetes e aspas externas se presentes
    cleanInput = cleanInput.replace(/^\[|\]$/g, ''); // Remove [ ]
    cleanInput = cleanInput.replace(/^["']|["']$/g, ''); // Remove aspas externas
    
    // Se não tem separadores, retorna item único
    const hasSeparator = opts.separators.some(sep => cleanInput.includes(sep));
    if (!hasSeparator) {
      items = [cleanInput];
    } else {
      // Split por qualquer separador
      const separatorRegex = new RegExp(`[${opts.separators.map(s => escapeRegex(s)).join('')}]`);
      items = cleanInput.split(separatorRegex);
    }
  }
  // Outros tipos, converte para string
  else {
    items = [String(input)];
  }
  
  // Processa cada item
  let result = items.map(item => {
    let processed = item;
    
    // Remove aspas individuais se presentes
    processed = processed.replace(/^["']|["']$/g, '');
    
    // Trim se solicitado
    if (opts.trimItems) {
      processed = processed.trim();
    }
    
    // Aplica transformação customizada
    processed = opts.transform(processed);
    
    return processed;
  });
  
  // Filtra items vazios se solicitado
  if (opts.filterEmpty) {
    result = result.filter(item => item.length > 0);
  }
  
  // Remove duplicatas se solicitado (preserva ordem)
  if (opts.removeDuplicates) {
    const seen = new Set<string>();
    result = result.filter(item => {
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
  }
  
  return result;
}

/**
 * Escapa caracteres especiais para regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normaliza lista de advogados - primeiro é "(principal)"
 * Apenas para exibição, não persiste o "(principal)" 
 */
export function formatAdvogadosForDisplay(advogados: string[]): string[] {
  if (!advogados || advogados.length === 0) return [];
  
  const result = [...advogados];
  if (result.length > 0 && !result[0].includes('(principal)')) {
    result[0] = `${result[0]} (principal)`;
  }
  
  return result;
}

/**
 * Remove formatação de exibição dos advogados
 */
export function cleanAdvogadosFromDisplay(advogados: string[]): string[] {
  return advogados.map(adv => adv.replace(/\s*\(principal\)\s*$/i, '').trim());
}

/**
 * Parse específico para listas que podem vir como string JSON malformada
 */
export function parseJsonLikeString(input: string): string[] {
  if (!input) return [];
  
  try {
    // Tenta parse direto como JSON
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parseList(parsed);
    }
  } catch {
    // Se falhar, trata como string normal com separadores
  }
  
  return parseList(input);
}

/**
 * Valida se uma lista está bem formada
 */
export function validateList(items: string[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!Array.isArray(items)) {
    issues.push('Não é um array válido');
    return { valid: false, issues };
  }
  
  // Verifica items vazios
  const emptyItems = items.filter(item => !item || item.trim().length === 0);
  if (emptyItems.length > 0) {
    issues.push(`${emptyItems.length} item(s) vazio(s) encontrado(s)`);
  }
  
  // Verifica duplicatas
  const duplicates = items.filter((item, index) => items.indexOf(item) !== index);
  if (duplicates.length > 0) {
    issues.push(`${duplicates.length} item(s) duplicado(s): ${[...new Set(duplicates)].join(', ')}`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}