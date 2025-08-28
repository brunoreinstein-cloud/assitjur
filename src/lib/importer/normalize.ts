import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { DetectedSheet, TestemunhaRow, ProcessoRow, OrgSettings } from './types';

/**
 * Maps raw headers from a sheet to standardized format 
 * Aligned with processos table structure
 */
function mapHeaders(headers: string[], sheetModel: 'processo' | 'testemunha'): Record<string, string> {
  const headerMap: Record<string, string> = {};
  
  if (sheetModel === 'processo') {
    // Core fields mapping for processos table
    const processoMappings = {
      'cnj': ['cnj', 'numero_processo', 'processo', 'num_processo'],
      'reclamante_nome': ['reclamante', 'reclamante_nome', 'nome_reclamante', 'autor'],
      'reu_nome': ['reu', 'reu_nome', 'nome_reu', 'reclamado', 'requerido'],
      'comarca': ['comarca', 'foro'],
      'tribunal': ['tribunal', 'trt', 'instancia'], 
      'vara': ['vara', 'orgao_julgador'],
      'fase': ['fase', 'situacao_processo'],
      'status': ['status', 'situacao'],
      'reclamante_cpf_mask': ['cpf', 'cpf_reclamante', 'documento'],
      'data_audiencia': ['data_audiencia', 'audiencia', 'data'],
      'advogados_ativo': ['advogados_ativo', 'advogado_autor', 'advogados'],
      'advogados_passivo': ['advogados_passivo', 'advogado_reu'],
      'testemunhas_ativo': ['testemunhas_ativo', 'testemunhas_autor'],
      'testemunhas_passivo': ['testemunhas_passivo', 'testemunhas_reu'],
      'observacoes': ['observacoes', 'obs', 'comentarios', 'notas']
    };

    for (const [normalized, variants] of Object.entries(processoMappings)) {
      const found = headers.find(h => 
        variants.some(v => h.toLowerCase().includes(v.toLowerCase()))
      );
      if (found) headerMap[found] = normalized;
    }
  }
  
  // Legacy testemunha support  
  if (sheetModel === 'testemunha') {
    const testemunhaMappings = {
      'cnj': ['cnj', 'numero_processo'],
      'nome_testemunha': ['nome', 'testemunha', 'nome_testemunha'],
      'reclamante_nome': ['reclamante', 'autor'],
      'reu_nome': ['reu', 'reclamado']
    };

    for (const [normalized, variants] of Object.entries(testemunhaMappings)) {
      const found = headers.find(h => 
        variants.some(v => h.toLowerCase().includes(v.toLowerCase()))
      );
      if (found) headerMap[found] = normalized;
    }
  }
  
  return headerMap;
}

/**
 * Aplica configurações padrão da organização
 */
function applyOrgDefaults(row: any, settings: OrgSettings | null): any {
  if (!settings) return row;
  
  const result = { ...row };
  
  // Auto-preenchimento do réu
  if ((!result.reu_nome || result.reu_nome.trim() === '') && 
      settings.applyDefaultReuOnTestemunha && 
      settings.defaultReuNome) {
    result.reu_nome = settings.defaultReuNome;
    result.__autofill = { ...(result.__autofill || {}), reu_nome: true };
  }
  
  return result;
}

/**
 * Normalizes processo data from detected sheet
 * Maps to processos table structure
 */
function normalizeProcessoData(
  sheet: DetectedSheet, 
  rawData: any[], 
  orgSettings: OrgSettings | null
): ProcessoRow[] {
  const headerMap = mapHeaders(sheet.headers, 'processo');
  
  return rawData.map((row, index) => {
    const mappedRow: any = {};
    
    // Map headers to normalized names
    for (const [original, normalized] of Object.entries(headerMap)) {
      mappedRow[normalized] = row[original];
    }
    
    // Normalize CNJ
    const rawCnj = mappedRow.cnj || '';
    const cnjDigits = String(rawCnj).replace(/[^\d]/g, '');
    mappedRow.cnj_digits = cnjDigits.length === 20 ? cnjDigits : null;
    
    // Apply org defaults if configured
    if (orgSettings?.applyDefaultReuOnTestemunha && !mappedRow.reu_nome && orgSettings.defaultReuNome) {
      mappedRow.reu_nome = orgSettings.defaultReuNome;
      mappedRow.__autofill = { reu_nome: true };
    }
    
    // Handle array fields (convert strings to arrays if needed)
    ['advogados_ativo', 'advogados_passivo', 'testemunhas_ativo', 'testemunhas_passivo'].forEach(field => {
      if (mappedRow[field] && typeof mappedRow[field] === 'string') {
        mappedRow[field] = mappedRow[field].split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    });
    
    return mappedRow;
  }).filter(row => row.cnj && row.reclamante_nome && row.reu_nome); // Only keep valid rows
}

/**
 * Normalizes testemunha data (legacy support)
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
    
    // Map headers
    for (const [originalHeader, normalizedHeader] of Object.entries(headerMap)) {
      normalizedRow[normalizedHeader] = row[originalHeader];
    }
    
    if (normalizedRow.cnj && normalizedRow.nome_testemunha) {
      const cnjDigits = String(normalizedRow.cnj).replace(/[^\d]/g, '');
      if (cnjDigits.length === 20) {
        const testemunhaRow: any = {
          cnj: normalizedRow.cnj,
          cnj_digits: cnjDigits,
          nome_testemunha: normalizedRow.nome_testemunha,
          reclamante_nome: normalizedRow.reclamante_nome || null,
          reu_nome: normalizedRow.reu_nome || null,
        };
        
        const finalRow = applyOrgDefaults(testemunhaRow, orgSettings);
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
 * Main normalization function
 * Prioritizes processo data over testemunha for the new system  
 */
export async function normalizeSheetData(
  file: File,
  sheet: DetectedSheet,
  orgSettings: OrgSettings | null = null
): Promise<{ processos?: ProcessoRow[]; testemunhas?: TestemunhaRow[] }> {
  
  const rawData = await loadRawData(file, sheet);
  
  if (sheet.model === 'processo') {
    const processos = normalizeProcessoData(sheet, rawData, orgSettings);
    return { processos };
  } 
  else if (sheet.model === 'testemunha') {
    const testemunhas = normalizeTestemunhaData(sheet, rawData, orgSettings);
    return { testemunhas };
  }
  else {
    // For ambiguous sheets, try to detect based on content
    const hasProcessoFields = sheet.headers.some(h => 
      ['comarca', 'tribunal', 'vara', 'status'].some(f => 
        h.toLowerCase().includes(f)
      )
    );
    
    if (hasProcessoFields) {
      const processos = normalizeProcessoData(sheet, rawData, orgSettings);
      return { processos };
    } else {
      const testemunhas = normalizeTestemunhaData(sheet, rawData, orgSettings);
      return { testemunhas };
    }
  }
}