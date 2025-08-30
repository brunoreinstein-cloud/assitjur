import type { ValidationResult, ValidationIssue } from './types';

/**
 * Enhanced validation statistics and reporting
 */
export interface ValidationStats {
  originalRows: number;
  processedRows: number;
  filteredRows: number;
  validRows: number;
  correctedRows: number;
  errorRows: number;
  warningRows: number;
  
  // Per sheet breakdown
  sheetStats: Record<string, {
    originalRows: number;
    processedRows: number;
    validRows: number;
    issues: ValidationIssue[];
  }>;
  
  // Top issues summary
  commonIssues: Array<{
    rule: string;
    count: number;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export function calculateValidationStats(
  result: ValidationResult,
  originalRowCounts: Record<string, number> = {}
): ValidationStats {
  const sheetStats: ValidationStats['sheetStats'] = {};
  
  // Group issues by sheet
  const issuesBySheet = result.issues.reduce((acc, issue) => {
    if (!acc[issue.sheet]) acc[issue.sheet] = [];
    acc[issue.sheet].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>);
  
  // Calculate per-sheet stats
  Object.keys(issuesBySheet).forEach(sheetName => {
    const issues = issuesBySheet[sheetName];
    const originalCount = originalRowCounts[sheetName] || 0;
    
    sheetStats[sheetName] = {
      originalRows: originalCount,
      processedRows: Math.max(issues.length, originalCount),
      validRows: issues.filter(i => i.severity !== 'error').length,
      issues
    };
  });
  
  // Calculate common issues
  const issueCounts = result.issues.reduce((acc, issue) => {
    const key = `${issue.rule}|${issue.severity}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const commonIssues = Object.entries(issueCounts)
    .map(([key, count]) => {
      const [rule, severity] = key.split('|');
      return { rule, count, severity: severity as 'error' | 'warning' | 'info' };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const totalOriginal = Object.values(originalRowCounts).reduce((sum, count) => sum + count, 0);
  const totalProcessed = result.summary.analyzed;
  const correctedRows = result.issues.filter(i => i.autofilled).length;
  
  return {
    originalRows: totalOriginal,
    processedRows: totalProcessed,
    filteredRows: totalOriginal - totalProcessed,
    validRows: result.summary.valid,
    correctedRows,
    errorRows: result.summary.errors,
    warningRows: result.summary.warnings,
    sheetStats,
    commonIssues
  };
}

/**
 * Generate human-readable validation report
 */
export function generateValidationReport(stats: ValidationStats): string {
  const lines = [
    `📊 Relatório de Validação`,
    ``,
    `📥 Dados Processados:`,
    `  • Linhas originais: ${stats.originalRows}`,
    `  • Linhas processadas: ${stats.processedRows}`,
    `  • Linhas filtradas: ${stats.filteredRows}`,
    `  • Linhas válidas: ${stats.validRows}`,
    `  • Correções aplicadas: ${stats.correctedRows}`,
    ``,
    `⚠️ Problemas Encontrados:`,
    `  • Erros: ${stats.errorRows}`,
    `  • Avisos: ${stats.warningRows}`,
    ``
  ];
  
  if (stats.commonIssues.length > 0) {
    lines.push(`🔍 Principais Problemas:`);
    stats.commonIssues.forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`  ${icon} ${issue.rule}: ${issue.count} ocorrências`);
    });
    lines.push('');
  }
  
  if (Object.keys(stats.sheetStats).length > 1) {
    lines.push(`📋 Por Aba:`);
    Object.entries(stats.sheetStats).forEach(([sheet, stat]) => {
      lines.push(`  • ${sheet}: ${stat.validRows}/${stat.originalRows} válidas`);
    });
  }
  
  return lines.join('\n');
}