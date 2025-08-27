// Helpers utilitários seguindo as regras específicas

/**
 * Remove todos os caracteres não-numéricos
 */
export const onlyDigits = (s: string): string => (s ?? '').replace(/\D/g, '');

/**
 * Verifica se é um CNJ válido de 20 dígitos
 */
export const isCNJ20 = (s: string): boolean => /^\d{20}$/.test(onlyDigits(s));

/**
 * Converte string para slug_case minúsculo
 */
export const toSlugCase = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * Parse de listas - suporta JSON, arrays separados por vírgula/ponto-vírgula
 */
export const parseList = (v: any): string[] => {
  const s = String(v ?? '').trim();
  if (!s || s === '[]') return [];
  
  // Tenta JSON primeiro
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      return JSON.parse(s.replace(/'/g, '"')).map((x: any) => String(x).trim());
    } catch {
      // Se falhar no JSON, remove os colchetes e trata como lista simples
    }
  }
  
  // Split por vírgula ou ponto-vírgula
  return s
    .replace(/^\[|\]$/g, '') // Remove colchetes se existirem
    .split(/[;,]/)
    .map(x => x.trim())
    .filter(Boolean);
};

/**
 * Verifica se um valor está vazio ou é "a preencher"
 */
export const isEmpty = (v: any): boolean => {
  if (!v) return true;
  const str = String(v).trim().toLowerCase();
  return str === '' || str === 'a preencher' || str === 'null' || str === 'undefined';
};

/**
 * Normaliza CNJ removendo pontuação
 */
export const normalizeCNJ = (cnj: string): string => {
  return onlyDigits(cnj);
};

/**
 * Formata CNJ para exibição com máscara
 */
export const formatCNJ = (cnj: string): string => {
  const digits = onlyDigits(cnj);
  if (digits.length !== 20) return cnj;
  
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16)}`;
};

/**
 * Detecta separador de CSV automaticamente
 */
export const detectCsvSeparator = (csvText: string): string => {
  const sample = csvText.split('\n')[0] || '';
  const separators = [',', ';', '\t', '|'];
  
  let maxCount = 0;
  let bestSeparator = ',';
  
  for (const sep of separators) {
    const count = (sample.match(new RegExp(`\\${sep}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestSeparator = sep;
    }
  }
  
  return bestSeparator;
};

/**
 * Sanitiza texto removendo caracteres perigosos
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"';&|$`]/g, '') // Remove caracteres perigosos
    .trim()
    .slice(0, 500); // Limita tamanho
};

/**
 * Gera ID único para sessão
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Mapeia colunas conhecidas do arquivo real
 */
export const getColumnMappings = () => {
  return {
    // Aba "Por Testemunha"
    testemunha: {
      'Nome_Testemunha': 'nome_testemunha',
      'CNJs_Como_Testemunha': 'cnjs_como_testemunha',
    },
    // Aba "Por Processo"  
    processo: {
      'CNJ': 'cnj',
      'Reclamante_Limpo': 'reclamante_nome',
      'Reclamante Limpo': 'reclamante_nome',
    },
    // Mapeamentos genéricos
    common: {
      'reu_nome': 'reu_nome',
      'Réu': 'reu_nome',
      'Reu': 'reu_nome',
    }
  };
};