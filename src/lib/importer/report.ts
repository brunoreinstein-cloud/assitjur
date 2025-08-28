import * as XLSX from 'xlsx';
import type { ValidationResult } from './types';

export interface CorrectedCell {
  address: string;
  original: any;
  corrected: any;
  reason: string;
}

/**
 * Gera relatórios de validação em diferentes formatos incluindo arquivo Excel corrigido
 */
export async function generateReports(
  validationResult: Omit<ValidationResult, 'downloadUrls'>,
  fileName: string,
  originalData?: { [sheetName: string]: any[][] },
  corrections?: Map<string, CorrectedCell>
): Promise<{ fixedXlsx: string; reportCsv: string; reportJson: string }> {
  
  // Gera CSV do relatório
  const csvHeader = 'Aba,Linha,Coluna,Severidade,Regra,Valor,Auto-preenchido\n';
  const csvRows = validationResult.issues.map(issue => 
    `"${issue.sheet}",${issue.row},"${issue.column}","${issue.severity}","${issue.rule}","${String(issue.value).replace(/"/g, '""')}",${issue.autofilled || false}`
  ).join('\n');
  
  const csvContent = csvHeader + csvRows;
  const csvBlob = new Blob([csvContent], { type: 'text/csv' });
  const reportCsvUrl = URL.createObjectURL(csvBlob);
  
  // Gera JSON do relatório
  const reportData = {
    arquivo: fileName,
    dataHora: new Date().toISOString(),
    resumo: validationResult.summary,
    issues: validationResult.issues,
    correcoes: corrections ? Object.fromEntries(corrections) : {}
  };
  const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const reportJsonUrl = URL.createObjectURL(jsonBlob);
  
  // Gera arquivo Excel corrigido
  const fixedXlsxUrl = await generateCorrectedXlsx(
    validationResult.normalizedData,
    corrections,
    fileName
  );
  
  return {
    fixedXlsx: fixedXlsxUrl,
    reportCsv: reportCsvUrl,
    reportJson: reportJsonUrl
  };
}

/**
 * Gera arquivo XLSX corrigido com dados normalizados
 */
async function generateCorrectedXlsx(
  normalizedData: any,
  corrections?: Map<string, CorrectedCell>,
  fileName?: string
): Promise<string> {
  const wb = XLSX.utils.book_new();
  
  // Adiciona aba "Por Processo" se houver dados
  if (normalizedData.processos && normalizedData.processos.length > 0) {
    const ws = XLSX.utils.json_to_sheet(normalizedData.processos);
    
    // Aplica formatação para células corrigidas
    if (corrections) {
      applyCorrectionFormatting(ws, corrections, 'Por Processo');
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'Por Processo');
  }
  
  // Adiciona aba "Por Testemunha" se houver dados
  if (normalizedData.testemunhas && normalizedData.testemunhas.length > 0) {
    const ws = XLSX.utils.json_to_sheet(normalizedData.testemunhas);
    
    // Aplica formatação para células corrigidas
    if (corrections) {
      applyCorrectionFormatting(ws, corrections, 'Por Testemunha');
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'Por Testemunha');
  }
  
  // Se não há dados normalizados, cria planilha com mensagem
  if (wb.SheetNames.length === 0) {
    const emptyData = [{
      'Mensagem': 'Nenhum dado válido encontrado para gerar arquivo corrigido',
      'Arquivo_Original': fileName || 'Desconhecido',
      'Data_Processamento': new Date().toISOString()
    }];
    const ws = XLSX.utils.json_to_sheet(emptyData);
    XLSX.utils.book_append_sheet(wb, ws, 'Informações');
  }
  
  // Gera buffer e cria URL
  const buffer = XLSX.write(wb, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  }) as Buffer;
  
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  return URL.createObjectURL(blob);
}

/**
 * Aplica formatação visual para células corrigidas
 */
function applyCorrectionFormatting(
  ws: XLSX.WorkSheet, 
  corrections: Map<string, CorrectedCell>,
  sheetName: string
) {
  if (!ws['!cols']) ws['!cols'] = [];
  
  // Adiciona comentários para células corrigidas
  corrections.forEach((correction, address) => {
    if (address.startsWith(sheetName + '!')) {
      const cellAddress = address.substring(sheetName.length + 1);
      
      if (ws[cellAddress]) {
        // Adiciona comentário explicando a correção
        if (!ws['!comments']) ws['!comments'] = [];
        
        ws['!comments'].push({
          ref: cellAddress,
          a: 'Sistema',
          t: `Corrigido automaticamente: ${correction.reason}\nOriginal: ${correction.original}\nNovo: ${correction.corrected}`
        });
        
        // Marca célula como modificada (cor de fundo)
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        ws[cellAddress].s.fill = {
          fgColor: { rgb: 'FFFACD' }, // Cor amarelo claro
          patternType: 'solid'
        };
      }
    }
  });
}