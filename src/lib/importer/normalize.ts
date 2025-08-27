import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  toSlugCase, 
  parseList, 
  normalizeCNJ, 
  onlyDigits, 
  sanitizeText,
  isEmpty,
  getColumnMappings 
} from './utils';
import type { DetectedSheet, TestemunhaRow, ProcessoRow, OrgSettings } from './types';

/**
 * Mapeia headers automaticamente baseado em padrões conhecidos
 */
function mapHeaders(headers: string[], sheetModel: 'testemunha' | 'processo'): Record<string, string> {
  const mappings = getColumnMappings();
  const result: Record<string, string> = {};
  
  for (const header of headers) {
    const normalized = toSlugCase(header);
    
    // Mapeamentos específicos por modelo
    if (sheetModel === 'testemunha') {
      if (mappings.testemunha[header]) {
        result[header] = mappings.testemunha[header];
        continue;
      }
    } else if (sheetModel === 'processo') {
      if (mappings.processo[header]) {
        result[header] = mappings.processo[header];
        continue;
      }
    }
    
    // Mapeamentos comuns
    if (mappings.common[header]) {
      result[header] = mappings.common[header];
      continue;
    }
    
    // Auto-mapeamento por nome normalizado
    result[header] = normalized;
  }
  
  return result;
}

/**
 * Aplica configurações padrão da organização
 */
function applyOrgDefaults(row: any, settings: OrgSettings | null): any {
  if (!settings) return row;
  
  const result = { ...row };
  
  // Auto-preenchimento do réu
  if (isEmpty(result.reu_nome) && 
      settings.applyDefaultReuOnTestemunha && 
      settings.defaultReuNome) {
    result.reu_nome = settings.defaultReuNome;
    result.__autofill = { ...(result.__autofill || {}), reu_nome: true };
  }
  
  return result;
}

/**
 * Normaliza dados de testemunha (explode listas)
 */
function normalizeTestemunhaData(
  sheet: DetectedSheet, 
  rawData: any[], 
  orgSettings: OrgSettings | null
): TestemunhaRow[] {
  const headerMap = mapHeaders(sheet.headers, 'testemunha');
  const result: TestemunhaRow[] = [];
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const normalizedRow: Record<string, any> = {};
    
    // Mapeia colunas
    for (const [originalHeader, normalizedHeader] of Object.entries(headerMap)) {
      normalizedRow[normalizedHeader] = row[originalHeader];
    }
    
    // Procura por lista de CNJs
    const cnjsListField = Object.keys(normalizedRow).find(key => 
      key.includes('cnjs_') && key.includes('testemunha')
    );
    
    if (cnjsListField && normalizedRow[cnjsListField]) {
      // Explode a lista
      const cnjsList = parseList(normalizedRow[cnjsListField]);
      
      for (const cnj of cnjsList) {
        const cnjDigits = normalizeCNJ(cnj);
        if (cnjDigits.length === 20) {
          const testemunhaRow: any = {
            cnj: cnj,
            cnj_digits: cnjDigits,
            nome_testemunha: sanitizeText(normalizedRow.nome_testemunha || ''),
            reclamante_nome: normalizedRow.reclamante_nome ? sanitizeText(normalizedRow.reclamante_nome) : null,
            reu_nome: normalizedRow.reu_nome ? sanitizeText(normalizedRow.reu_nome) : null,
          };
          
          // Aplica configurações da organização
          const finalRow = applyOrgDefaults(testemunhaRow, orgSettings);
          result.push(finalRow);
        }
      }
    } else if (normalizedRow.cnj) {
      // Linha individual
      const cnjDigits = normalizeCNJ(normalizedRow.cnj);
      if (cnjDigits.length === 20) {
        const testemunhaRow: any = {
          cnj: normalizedRow.cnj,
          cnj_digits: cnjDigits,
          nome_testemunha: sanitizeText(normalizedRow.nome_testemunha || ''),
          reclamante_nome: normalizedRow.reclamante_nome ? sanitizeText(normalizedRow.reclamante_nome) : null,
          reu_nome: normalizedRow.reu_nome ? sanitizeText(normalizedRow.reu_nome) : null,
        };
        
        const finalRow = applyOrgDefaults(testemunhaRow, orgSettings);
        result.push(finalRow);
      }
    }
  }
  
  return result;
}

/**
 * Normaliza dados de processo
 */
function normalizeProcessoData(
  sheet: DetectedSheet, 
  rawData: any[], 
  orgSettings: OrgSettings | null
): ProcessoRow[] {
  const headerMap = mapHeaders(sheet.headers, 'processo');
  const result: ProcessoRow[] = [];
  
  for (const row of rawData) {
    const normalizedRow: Record<string, any> = {};
    
    // Mapeia colunas
    for (const [originalHeader, normalizedHeader] of Object.entries(headerMap)) {
      normalizedRow[normalizedHeader] = row[originalHeader];
    }
    
    if (normalizedRow.cnj) {
      const cnjDigits = normalizeCNJ(normalizedRow.cnj);
      if (cnjDigits.length === 20) {
        const processoRow: any = {
          cnj: normalizedRow.cnj,
          cnj_digits: cnjDigits,
          reclamante_nome: sanitizeText(normalizedRow.reclamante_nome || ''),
          reu_nome: sanitizeText(normalizedRow.reu_nome || ''),
        };
        
        const finalRow = applyOrgDefaults(processoRow, orgSettings);
        result.push(finalRow);
      }
    }
  }
  
  return result;
}

/**
 * Carrega dados brutos do arquivo
 */
async function loadRawData(file: File, sheet: DetectedSheet): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (file.name.toLowerCase().endsWith('.csv')) {
      // CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data as any[]),
          error: (error) => reject(error)
        });
      };
      reader.readAsText(file);
    } else {
      // Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[sheet.name];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

/**
 * Função principal de normalização
 */
export async function normalizeSheetData(
  file: File,
  sheet: DetectedSheet,
  orgSettings: OrgSettings | null = null
): Promise<{ testemunhas?: TestemunhaRow[]; processos?: ProcessoRow[] }> {
  const rawData = await loadRawData(file, sheet);
  
  if (sheet.model === 'testemunha') {
    const testemunhas = normalizeTestemunhaData(sheet, rawData, orgSettings);
    return { testemunhas };
  } else if (sheet.model === 'processo') {
    const processos = normalizeProcessoData(sheet, rawData, orgSettings);
    return { processos };
  }
  
  return {};
}