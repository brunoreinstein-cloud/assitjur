import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { DetectedSheet, SheetModel } from './types';
import { toSlugCase, detectCsvSeparator, onlyDigits } from './utils';

/**
 * Detecta modelo da aba baseado nas colunas
 */
function detectSheetModel(headers: string[]): SheetModel {
  const normalizedHeaders = headers.map(h => toSlugCase(h));
  
  // Procura por coluna de CNJ exato (não CNJ_*)
  const hasCNJ = normalizedHeaders.some(h => h === 'cnj');
  
  // Procura por coluna de lista de CNJs (variações do CNJs_Como_Testemunha)
  const hasTestemunhaList = normalizedHeaders.some(h => 
    h.includes('cnjs_') && h.includes('testemunha')
  );
  
  // Procura por nome de testemunha
  const hasNomeTestemunha = normalizedHeaders.some(h => 
    h.includes('nome_testemunha') || h.includes('testemunha')
  );
  
  if (hasTestemunhaList && hasNomeTestemunha) {
    return 'testemunha';
  }
  
  if (hasCNJ && !hasTestemunhaList) {
    return 'processo';
  }
  
  // Se tem ambos CNJ e lista de testemunhas na mesma aba
  if (hasCNJ && hasTestemunhaList) {
    return 'ambiguous';
  }
  
  // Default para processo se tem CNJ
  return hasCNJ ? 'processo' : 'testemunha';
}

/**
 * Processa arquivo XLSX
 */
function processXlsxFile(file: File): Promise<DetectedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets: DetectedSheet[] = [];
        
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) continue;
          
          const headers = jsonData[0] || [];
          const dataRows = jsonData.slice(1);
          
          // Filtra colunas que começam com CNJ_ (conforme regra)
          const filteredHeaders = headers.filter((h: string) => {
            const normalized = toSlugCase(h);
            return !normalized.startsWith('cnj_') || normalized === 'cnj';
          });
          
          const model = detectSheetModel(filteredHeaders);
          
          // Amostra dos dados (primeiras 5 linhas)
          const sampleData = dataRows.slice(0, 5).map(row => {
            const obj: Record<string, any> = {};
            filteredHeaders.forEach((header: string, index: number) => {
              obj[header] = row[headers.indexOf(header)];
            });
            return obj;
          });
          
          // Verifica se tem coluna de lista
          const hasListColumn = filteredHeaders.some((h: string) => 
            toSlugCase(h).includes('cnjs_') && toSlugCase(h).includes('testemunha')
          );
          
          sheets.push({
            name: sheetName,
            model,
            rows: dataRows.length,
            headers: filteredHeaders,
            sampleData,
            hasListColumn
          });
        }
        
        resolve(sheets);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo XLSX: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Processa arquivo CSV
 */
function processCsvFile(file: File): Promise<DetectedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const separator = detectCsvSeparator(text);
        
        Papa.parse(text, {
          delimiter: separator,
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as string[][];
            
            if (data.length === 0) {
              resolve([]);
              return;
            }
            
            const headers = data[0] || [];
            const dataRows = data.slice(1);
            
            // Filtra colunas CNJ_
            const filteredHeaders = headers.filter(h => {
              const normalized = toSlugCase(h);
              return !normalized.startsWith('cnj_') || normalized === 'cnj';
            });
            
            const model = detectSheetModel(filteredHeaders);
            
            const sampleData = dataRows.slice(0, 5).map(row => {
              const obj: Record<string, any> = {};
              filteredHeaders.forEach((header, index) => {
                obj[header] = row[headers.indexOf(header)];
              });
              return obj;
            });
            
            const hasListColumn = filteredHeaders.some(h => 
              toSlugCase(h).includes('cnjs_') && toSlugCase(h).includes('testemunha')
            );
            
            resolve([{
              name: 'CSV',
              model,
              rows: dataRows.length,
              headers: filteredHeaders,
              sampleData,
              hasListColumn
            }]);
          },
          error: (error) => {
            reject(new Error(`Erro ao processar CSV: ${error}`));
          }
        });
      } catch (error) {
        reject(new Error(`Erro ao ler CSV: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Função principal de detecção
 */
export async function detectFileStructure(file: File): Promise<DetectedSheet[]> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  if (fileType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return processXlsxFile(file);
  }
  
  if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
    return processCsvFile(file);
  }
  
  throw new Error('Formato de arquivo não suportado. Use XLSX, XLS ou CSV.');
}