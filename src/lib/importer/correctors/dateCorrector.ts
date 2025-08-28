import { isValid, parse, format } from 'date-fns';

export interface DateCorrection {
  original: string;
  corrected: string;
  format: string;
  confidence: number;
}

const DATE_PATTERNS = [
  { pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: 'dd/MM/yyyy', order: [3, 2, 1] }, // 31/12/2023
  { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, format: 'yyyy-MM-dd', order: [1, 2, 3] }, // 2023-12-31
  { pattern: /^(\d{2})-(\d{2})-(\d{4})$/, format: 'dd-MM-yyyy', order: [3, 2, 1] }, // 31-12-2023
  { pattern: /^(\d{2})\.(\d{2})\.(\d{4})$/, format: 'dd.MM.yyyy', order: [3, 2, 1] }, // 31.12.2023
  { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, format: 'd/M/yy', order: [3, 2, 1] }, // 1/1/23
  { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: 'd/M/yyyy', order: [3, 2, 1] }, // 1/1/2023
  { pattern: /^(\d{4})(\d{2})(\d{2})$/, format: 'yyyyMMdd', order: [1, 2, 3] }, // 20231231
  { pattern: /^(\d{2})(\d{2})(\d{4})$/, format: 'ddMMyyyy', order: [3, 2, 1] }, // 31122023
];

/**
 * Corrige datas em vários formatos para o padrão yyyy-MM-dd
 */
export function correctDate(dateStr: string): DateCorrection | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const original = dateStr.trim();
  
  // Tenta cada padrão
  for (const { pattern, format: formatStr, order } of DATE_PATTERNS) {
    const match = original.match(pattern);
    
    if (match) {
      try {
        // Extrai partes da data
        const parts = [match[1], match[2], match[3]];
        const year = parseInt(parts[order[0] - 1]);
        const month = parseInt(parts[order[1] - 1]);
        const day = parseInt(parts[order[2] - 1]);
        
        // Corrige ano de 2 dígitos
        let correctedYear = year;
        if (year < 100) {
          correctedYear = year < 50 ? 2000 + year : 1900 + year;
        }
        
        // Valida se a data é válida
        const parsedDate = new Date(correctedYear, month - 1, day);
        
        if (isValid(parsedDate) && 
            parsedDate.getFullYear() === correctedYear &&
            parsedDate.getMonth() === month - 1 &&
            parsedDate.getDate() === day) {
          
          const corrected = format(parsedDate, 'yyyy-MM-dd');
          
          // Se já está no formato correto, não precisa correção
          if (corrected === original) return null;
          
          return {
            original,
            corrected,
            format: formatStr,
            confidence: calculateDateConfidence(original, corrected, formatStr)
          };
        }
      } catch (error) {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Calcula confiança da correção de data
 */
function calculateDateConfidence(original: string, corrected: string, format: string): number {
  let confidence = 0.8; // Base
  
  // Formatos mais comuns têm maior confiança
  if (format === 'dd/MM/yyyy') confidence = 0.95;
  if (format === 'yyyy-MM-dd') confidence = 0.98;
  
  // Data muito antiga ou futura diminui confiança
  const year = parseInt(corrected.substring(0, 4));
  const currentYear = new Date().getFullYear();
  
  if (year < 1980 || year > currentYear + 10) {
    confidence *= 0.7;
  }
  
  // Formato ambíguo diminui confiança
  if (format.includes('d/M/') || format.includes('M/d/')) {
    confidence *= 0.8;
  }
  
  return Math.min(confidence, 0.98);
}

/**
 * Corrige lote de datas
 */
export function correctDateBatch(dates: string[]): Map<string, DateCorrection> {
  const corrections = new Map<string, DateCorrection>();
  
  dates.forEach(date => {
    if (date) {
      const correction = correctDate(date);
      if (correction) {
        corrections.set(date, correction);
      }
    }
  });
  
  return corrections;
}

/**
 * Valida se uma string é uma data válida
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;
  
  const correction = correctDate(dateStr);
  return correction !== null || isValidISO(dateStr);
}

/**
 * Verifica se é uma data ISO válida
 */
function isValidISO(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    return isValid(date) && dateStr.includes('-');
  } catch {
    return false;
  }
}