import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { DetectedSheet, SheetModel } from '@/lib/importer/types';

/**
 * Detecta a estrutura de um arquivo CSV ou Excel
 */
export async function detectFileStructure(file: File): Promise<DetectedSheet[]> {
  const fileType = file.type;
  
  if (fileType === 'text/csv' || file.name.endsWith('.csv')) {
    return detectCsvStructure(file);
  } else if (fileType.includes('spreadsheet') || file.name.match(/\.(xlsx?|xls)$/i)) {
    return detectExcelStructure(file);
  } else {
    throw new Error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)');
  }
}

/**
 * Detecta estrutura de arquivo CSV
 */
async function detectCsvStructure(file: File): Promise<DetectedSheet[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 100, // Only analyze first 100 rows for performance
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }

          const headers = results.meta.fields || [];
          const data = results.data as any[];
          
          if (headers.length === 0) {
            throw new Error('Nenhuma coluna foi detectada no arquivo CSV');
          }

          const sheet: DetectedSheet = {
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            headers,
            rows: data.length,
            model: detectSheetModel(headers),
            hasListColumn: detectListColumn(headers),
            sampleData: data.slice(0, 5)
          };

          resolve([sheet]);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao analisar CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Lista de nomes de abas que devem ser ignoradas automaticamente
 */
const IGNORED_SHEET_NAMES = [
  'dicionario', 'dictionary', 'docs', 'documentação', 'documentacao', 
  'info', 'instructions', 'instrucoes', 'readme', 'help', 'ajuda',
  'template', 'exemplo', 'sample', 'metadata', 'config', 'configuracao'
];

/**
 * Verifica se uma aba deve ser ignorada automaticamente
 */
function shouldIgnoreSheet(sheetName: string, headers: string[], dataRows: any[]): boolean {
  const normalizedName = sheetName.toLowerCase().trim();
  
  // Ignora abas com nomes conhecidos de documentação
  if (IGNORED_SHEET_NAMES.some(ignored => normalizedName.includes(ignored))) {
    console.log(`Ignoring sheet '${sheetName}' - matches documentation pattern`);
    return true;
  }
  
  // Ignora abas com muito poucos dados (menos de 2 linhas de dados)
  if (dataRows.length < 2) {
    console.log(`Ignoring sheet '${sheetName}' - insufficient data (${dataRows.length} rows)`);
    return true;
  }
  
  // Ignora abas com muito poucas colunas (menos de 3 colunas)
  if (headers.length < 3) {
    console.log(`Ignoring sheet '${sheetName}' - insufficient columns (${headers.length} columns)`);
    return true;
  }
  
  return false;
}

/**
 * Detecta estrutura de arquivo Excel
 */
async function detectExcelStructure(file: File): Promise<DetectedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets: DetectedSheet[] = [];
        const ignoredSheets: string[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            console.log(`Skipping empty sheet: ${sheetName}`);
            return;
          }
          
          const headers = (jsonData[0] as string[]).filter(Boolean);
          const dataRows = jsonData.slice(1).filter((row: any) => 
            row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
          );
          
          if (headers.length === 0) {
            console.log(`Skipping sheet with no headers: ${sheetName}`);
            return;
          }
          
          // Verifica se a aba deve ser ignorada automaticamente
          if (shouldIgnoreSheet(sheetName, headers, dataRows)) {
            ignoredSheets.push(sheetName);
            return;
          }
          
          const sheet: DetectedSheet = {
            name: sheetName,
            headers,
            rows: dataRows.length,
            model: detectSheetModel(headers),
            hasListColumn: detectListColumn(headers),
            sampleData: dataRows.slice(0, 5).map((row: any) => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] || null;
              });
              return obj;
            })
          };
          
          sheets.push(sheet);
        });
        
        console.log(`Processed ${sheets.length} sheets, ignored ${ignoredSheets.length} sheets:`, ignoredSheets);
        
        if (sheets.length === 0) {
          throw new Error('Nenhuma aba com dados válidos foi encontrada. Todas as abas foram ignoradas ou estão vazias.');
        }
        
        resolve(sheets);
      } catch (error) {
        reject(new Error(`Erro ao analisar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detecta o modelo da aba baseado nos cabeçalhos
 */
function detectSheetModel(headers: string[]): SheetModel {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Strong indicators for "testemunha" model
  const strongTestemunhaIndicators = [
    'nome_testemunha',
    'cnjs_como_testemunha',
    'qtd_depoimentos',
    'quantidade_depoimentos'
  ];
  
  // Weak indicators for "testemunha" model
  const weakTestemunhaIndicators = [
    'testemunha',
    'depoimentos',
    'como_testemunha'
  ];
  
  // Strong indicators for "processo" model  
  const strongProcessoIndicators = [
    'reclamante_nome',
    'reu_nome',
    'advogados_ativo',
    'advogados_passivo',
    'todas_testemunhas',
    'testemunhas_todas'
  ];
  
  // Weak indicators for "processo" model
  const weakProcessoIndicators = [
    'reclamante',
    'reu',
    'advogado',
    'comarca',
    'tribunal',
    'vara',
    'fase',
    'status'
  ];
  
  // Calculate scores with weights
  const strongTestemunhaScore = strongTestemunhaIndicators.reduce((score, indicator) => 
    normalizedHeaders.some(h => h.includes(indicator)) ? score + 3 : score, 0
  );
  
  const weakTestemunhaScore = weakTestemunhaIndicators.reduce((score, indicator) => 
    normalizedHeaders.some(h => h.includes(indicator)) ? score + 1 : score, 0
  );
  
  const strongProcessoScore = strongProcessoIndicators.reduce((score, indicator) => 
    normalizedHeaders.some(h => h.includes(indicator)) ? score + 3 : score, 0
  );
  
  const weakProcessoScore = weakProcessoIndicators.reduce((score, indicator) => 
    normalizedHeaders.some(h => h.includes(indicator)) ? score + 1 : score, 0
  );
  
  const totalTestemunhaScore = strongTestemunhaScore + weakTestemunhaScore;
  const totalProcessoScore = strongProcessoScore + weakProcessoScore;
  
  // Must have CNJ for any model
  const hasCNJ = normalizedHeaders.some(h => 
    h.includes('cnj') || h.includes('numero_processo') || h.includes('processo')
  );
  
  if (!hasCNJ) {
    console.log('No CNJ column detected, marking as ambiguous');
    return 'ambiguous';
  }
  
  console.log(`Detection scores - Testemunha: ${totalTestemunhaScore} (strong: ${strongTestemunhaScore}), Processo: ${totalProcessoScore} (strong: ${strongProcessoScore})`);
  
  // If we have strong indicators, prefer them
  if (strongTestemunhaScore > 0 && strongTestemunhaScore >= strongProcessoScore) {
    return 'testemunha';
  } else if (strongProcessoScore > 0 && strongProcessoScore > strongTestemunhaScore) {
    return 'processo';
  }
  
  // Fall back to total scores with lower threshold
  if (totalTestemunhaScore > totalProcessoScore && totalTestemunhaScore >= 1) {
    return 'testemunha';
  } else if (totalProcessoScore > totalTestemunhaScore && totalProcessoScore >= 1) {
    return 'processo';
  } 
  
  // Default fallback - if we have CNJ but can't determine type, assume processo
  console.log('Could not determine sheet type, defaulting to processo');
  return 'processo';
}

/**
 * Detecta se há colunas com listas que precisam ser expandidas
 */
function detectListColumn(headers: string[]): boolean {
  const listIndicators = [
    'cnjs_como_testemunha',
    'todas_testemunhas',
    'testemunhas_todas',
    'advogados_ativo',
    'advogados_passivo'
  ];
  
  return headers.some(header => 
    listIndicators.some(indicator => 
      header.toLowerCase().includes(indicator.toLowerCase())
    )
  );
}