import type { ValidationResult } from './types';

/**
 * Gera relatórios de validação em diferentes formatos
 */
export async function generateReports(
  validationResult: Omit<ValidationResult, 'downloadUrls'>,
  fileName: string
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
    issues: validationResult.issues
  };
  const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const reportJsonUrl = URL.createObjectURL(jsonBlob);
  
  // Mock do arquivo Excel corrigido
  const mockXlsxBlob = new Blob(['Mock Excel Data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fixedXlsxUrl = URL.createObjectURL(mockXlsxBlob);
  
  return {
    fixedXlsx: fixedXlsxUrl,
    reportCsv: reportCsvUrl,
    reportJson: reportJsonUrl
  };
}