// Import canonical data structures
import { 
  canonicalProcessoSamples, 
  canonicalTestemunhaSamples, 
  canonicalDicionarioFields
} from '../../../src/lib/templates/canonical-samples.ts';

/**
 * Build canonical CSV for specific sheet using standardized format
 */
export function buildCanonicalCsv(sheetName: 'Por Processo' | 'Por Testemunha' | 'Dicionario'): string {
  let data: any[] = [];
  
  switch (sheetName) {
    case 'Por Processo':
      data = canonicalProcessoSamples;
      break;
    case 'Por Testemunha':
      data = canonicalTestemunhaSamples;
      break;
    case 'Dicionario':
      data = canonicalDicionarioFields;
      break;
    default:
      throw new Error(`Sheet "${sheetName}" não encontrada`);
  }

  if (data.length === 0) {
    throw new Error(`Nenhum dado encontrado para a aba "${sheetName}"`);
  }

  // Get headers from first data row
  const firstRow = data[0] as Record<string, any>;
  const headers = Object.keys(firstRow);
  
  // CSV escape function with proper semicolon handling
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    
    let str = String(value);
    
    // Convert boolean to string
    if (typeof value === 'boolean') {
      str = value ? 'true' : 'false';
    }
    
    // If contains separator, newline or quotes, wrap in double quotes
    if (str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV lines
  const lines: string[] = [];
  
  // Header line
  lines.push(headers.map(h => escapeCsvValue(h)).join(','));
  
  // Data lines
  data.forEach((row: any) => {
    const rowData = row as Record<string, any>;
    const values = headers.map(header => escapeCsvValue(rowData[header]));
    lines.push(values.join(','));
  });

  return lines.join('\n');
}