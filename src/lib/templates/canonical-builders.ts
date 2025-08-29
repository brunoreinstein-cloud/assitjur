/**
 * AssistJur.IA - Canonical Template Builders
 * Generates XLSX and CSV files with canonical headers and sample data
 */

import * as XLSX from 'xlsx';
import { 
  canonicalProcessoSamples, 
  canonicalTestemunhaSamples, 
  canonicalDicionarioFields,
  CANONICAL_HEADERS_PROCESSO,
  CANONICAL_HEADERS_TESTEMUNHA,
  type CanonicalProcessoSample,
  type CanonicalTestemunhaSample,
  type DicionarioField
} from './canonical-samples';

/**
 * Build canonical XLSX template with 3 sheets
 */
export function buildCanonicalXlsx(): Buffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Por Processo
  const processoWs = XLSX.utils.json_to_sheet(canonicalProcessoSamples);
  XLSX.utils.book_append_sheet(wb, processoWs, 'Por Processo');

  // Sheet 2: Por Testemunha  
  const testemunhaWs = XLSX.utils.json_to_sheet(canonicalTestemunhaSamples);
  XLSX.utils.book_append_sheet(wb, testemunhaWs, 'Por Testemunha');

  // Sheet 3: Dicionario
  const dicionarioWs = XLSX.utils.json_to_sheet(canonicalDicionarioFields);
  XLSX.utils.book_append_sheet(wb, dicionarioWs, 'Dicionario');

  // Generate buffer with compression
  return XLSX.write(wb, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  }) as Buffer;
}

/**
 * Build canonical CSV for specific sheet
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

  // Get headers from data
  const headers = Object.keys(data[0]);
  
  // CSV escape function
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    
    let str = String(value);
    
    // Convert boolean to string
    if (typeof value === 'boolean') {
      str = value ? 'true' : 'false';
    }
    
    // If contains separator, newline or quotes, wrap in double quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes(';')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV lines
  const lines: string[] = [];
  
  // Header line
  lines.push(headers.map(h => escapeCsvValue(h)).join(','));
  
  // Data lines
  data.forEach(row => {
    const values = headers.map(header => escapeCsvValue(row[header]));
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

/**
 * Validate canonical data structure
 */
export function validateCanonicalStructure(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Validate processo headers
  const processoActualHeaders = Object.keys(canonicalProcessoSamples[0] || {});
  const processoExpectedHeaders = [...CANONICAL_HEADERS_PROCESSO];
  
  const processoMissing = processoExpectedHeaders.filter(h => !processoActualHeaders.includes(h));
  const processoExtra = processoActualHeaders.filter(h => !processoExpectedHeaders.includes(h));
  
  if (processoMissing.length > 0) {
    issues.push(`Por Processo - Campos ausentes: ${processoMissing.join(', ')}`);
  }
  if (processoExtra.length > 0) {
    issues.push(`Por Processo - Campos extras: ${processoExtra.join(', ')}`);
  }

  // Validate testemunha headers
  const testemunhaActualHeaders = Object.keys(canonicalTestemunhaSamples[0] || {});
  const testemunhaExpectedHeaders = [...CANONICAL_HEADERS_TESTEMUNHA];
  
  const testemunhaMissing = testemunhaExpectedHeaders.filter(h => !testemunhaActualHeaders.includes(h));
  const testemunhaExtra = testemunhaActualHeaders.filter(h => !testemunhaExpectedHeaders.includes(h));
  
  if (testemunhaMissing.length > 0) {
    issues.push(`Por Testemunha - Campos ausentes: ${testemunhaMissing.join(', ')}`);
  }
  if (testemunhaExtra.length > 0) {
    issues.push(`Por Testemunha - Campos extras: ${testemunhaExtra.join(', ')}`);
  }

  // Validate sample data
  if (canonicalProcessoSamples.length === 0) {
    issues.push('Nenhum sample data para Por Processo');
  }
  if (canonicalTestemunhaSamples.length === 0) {
    issues.push('Nenhum sample data para Por Testemunha');
  }
  if (canonicalDicionarioFields.length === 0) {
    issues.push('Nenhum campo no dicionário');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get canonical headers for sheet type
 */
export function getCanonicalHeaders(sheetType: 'processo' | 'testemunha'): string[] {
  return sheetType === 'processo' ? [...CANONICAL_HEADERS_PROCESSO] : [...CANONICAL_HEADERS_TESTEMUNHA];
}

/**
 * Convert data to canonical format for export
 */
export function formatDataToCanonical(
  data: any[], 
  sheetType: 'processo' | 'testemunha'
): Record<string, any>[] {
  const canonicalHeaders = getCanonicalHeaders(sheetType);
  
  return data.map(row => {
    const canonicalRow: Record<string, any> = {};
    
    canonicalHeaders.forEach((header: string) => {
      // Map from current format to canonical format
      let value = row[header] || row[header.toLowerCase()] || row[header.replace(/_/g, '')] || null;
      
      // Handle special formatting
      if (value === null || value === undefined) {
        canonicalRow[header] = '—';
      } else if (Array.isArray(value)) {
        // Lists: join with semicolon
        canonicalRow[header] = value.length > 0 ? value.join('; ') : '—';
      } else if (typeof value === 'boolean') {
        canonicalRow[header] = value;
      } else {
        canonicalRow[header] = String(value);
      }
    });
    
    return canonicalRow;
  });
}

/**
 * Parse canonical list format (semicolon separated)
 */
export function parseCanonicalList(input: any): string[] {
  if (!input) return [];
  
  const str = String(input).trim();
  if (str === '—' || str === '') return [];
  
  // Split by semicolon, clean each item
  return str.split(';')
    .map(item => item.trim())
    .filter(item => item.length > 0 && item !== '—');
}

/**
 * Format list to canonical format (semicolon separated)
 */
export function formatToCanonicalList(items: string[]): string {
  if (!items || items.length === 0) return '—';
  
  const cleanItems = items
    .map(item => String(item).trim())
    .filter(item => item.length > 0);
  
  return cleanItems.length > 0 ? cleanItems.join('; ') : '—';
}