import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { withErrorHandling } from '@/lib/error-handling';

interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: any;
  type: 'error' | 'warning';
}

interface ValidationResults {
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  headerMapping?: {
    requiredFields: Record<string, number>;
    optionalFields: Record<string, number>;
    unmappedFields: string[];
    suggestions: Array<{
      header: string;
      suggestion: string;
      confidence: number;
    }>;
  };
}

interface ErrorReportGeneratorProps {
  validationResults: ValidationResults;
  fileName: string;
}

const ErrorReportGenerator: React.FC<ErrorReportGeneratorProps> = ({
  validationResults,
  fileName
}) => {

  const generateCSVReport = () => {
    withErrorHandling(async () => {
      const headers = ['Linha', 'Coluna', 'Tipo', 'Mensagem', 'Valor'];
      const rows = [
        headers.join(','),
        // Add summary row
        `"Resumo","Total de linhas: ${validationResults.totalRows}","Linhas válidas: ${validationResults.validRows}","Erros: ${validationResults.errors.length}","Avisos: ${validationResults.warnings.length}"`,
        '', // Empty row for separation
        // Add errors
        ...validationResults.errors.map(error => [
          error.row,
          `"${error.column}"`,
          'Erro',
          `"${error.message}"`,
          `"${error.value || ''}"`
        ].join(',')),
        // Add warnings
        ...validationResults.warnings.map(warning => [
          warning.row,
          `"${warning.column}"`,
          'Aviso',
          `"${warning.message}"`,
          `"${warning.value || ''}"`
        ].join(','))
      ];

      // Add header mapping info if available
      if (validationResults.headerMapping) {
        rows.push('');
        rows.push('"Informações de Mapeamento de Colunas"');
        rows.push('');
        
        // Required fields
        rows.push('"Campos Obrigatórios Mapeados:"');
        Object.entries(validationResults.headerMapping.requiredFields).forEach(([field, index]) => {
          rows.push(`"${field}","Coluna ${index}","","",""`);
        });
        
        // Unmapped fields
        if (validationResults.headerMapping.unmappedFields.length > 0) {
          rows.push('');
          rows.push('"Campos Não Mapeados:"');
          validationResults.headerMapping.unmappedFields.forEach(field => {
            rows.push(`"${field}","Não mapeado","","",""`);
          });
        }
        
        // Suggestions
        if (validationResults.headerMapping.suggestions.length > 0) {
          rows.push('');
          rows.push('"Sugestões de Mapeamento:"');
          validationResults.headerMapping.suggestions.forEach(suggestion => {
            rows.push(`"${suggestion.header}","Sugestão: ${suggestion.suggestion}","Confiança: ${(suggestion.confidence * 100).toFixed(1)}%","",""`);
          });
        }
      }

      const csvContent = rows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-validacao-${fileName.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório CSV gerado",
        description: "Download iniciado com sucesso"
      });
    }, 'ErrorReportGenerator.generateCSVReport');
  };

  const generateDetailedReport = () => {
    withErrorHandling(async () => {
      const reportContent = `
RELATÓRIO DE VALIDAÇÃO DE DADOS
================================

Arquivo: ${fileName}
Data: ${new Date().toLocaleString('pt-BR')}

RESUMO GERAL
============
Total de linhas analisadas: ${validationResults.totalRows.toLocaleString()}
Linhas válidas: ${validationResults.validRows.toLocaleString()}
Linhas com erros: ${validationResults.errors.length.toLocaleString()}
Linhas com avisos: ${validationResults.warnings.length.toLocaleString()}
Taxa de sucesso: ${((validationResults.validRows / validationResults.totalRows) * 100).toFixed(2)}%

${validationResults.errors.length > 0 ? `
ERROS ENCONTRADOS (${validationResults.errors.length})
=====================
${validationResults.errors.map(error => `
Linha ${error.row}: ${error.message}
Coluna: ${error.column}
Valor: ${error.value || 'N/A'}
`).join('\n')}
` : ''}

${validationResults.warnings.length > 0 ? `
AVISOS (${validationResults.warnings.length})
======
${validationResults.warnings.map(warning => `
Linha ${warning.row}: ${warning.message}
Coluna: ${warning.column}
Valor: ${warning.value || 'N/A'}
`).join('\n')}
` : ''}

${validationResults.headerMapping ? `
MAPEAMENTO DE COLUNAS
====================

Campos Obrigatórios Mapeados:
${Object.entries(validationResults.headerMapping.requiredFields).map(([field, index]) => `- ${field} → Coluna ${index}`).join('\n')}

Campos Opcionais Mapeados:
${Object.entries(validationResults.headerMapping.optionalFields).map(([field, index]) => `- ${field} → Coluna ${index}`).join('\n')}

${validationResults.headerMapping.unmappedFields.length > 0 ? `
Campos Não Mapeados:
${validationResults.headerMapping.unmappedFields.map(field => `- ${field}`).join('\n')}
` : ''}

${validationResults.headerMapping.suggestions.length > 0 ? `
Sugestões de Mapeamento:
${validationResults.headerMapping.suggestions.map(s => `- ${s.header} → ${s.suggestion} (${(s.confidence * 100).toFixed(1)}% confiança)`).join('\n')}
` : ''}
` : ''}

RECOMENDAÇÕES
=============
${validationResults.errors.length > 0 ? '- Corrija os erros listados antes de prosseguir com a importação' : ''}
${validationResults.warnings.length > 0 ? '- Revise os avisos para garantir a qualidade dos dados' : ''}
${(validationResults.headerMapping?.unmappedFields?.length ?? 0) > 0 ? '- Considere mapear as colunas não reconhecidas' : ''}
${validationResults.validRows === 0 ? '- Arquivo não contém dados válidos para importação' : ''}

---
Relatório gerado automaticamente pelo sistema AssistJur.IA
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-detalhado-${fileName.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório detalhado gerado",
        description: "Download iniciado com sucesso"
      });
    }, 'ErrorReportGenerator.generateDetailedReport');
  };

  const getErrorTypeCount = (type: 'error' | 'warning') => {
    return type === 'error' ? validationResults.errors.length : validationResults.warnings.length;
  };

  const getTopErrorTypes = () => {
    const errorTypes: Record<string, number> = {};
    
    [...validationResults.errors, ...validationResults.warnings].forEach(item => {
      const key = item.message.split(':')[0] || item.message;
      errorTypes[key] = (errorTypes[key] || 0) + 1;
    });
    
    return Object.entries(errorTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Validação
          </CardTitle>
          <CardDescription>
            Gere relatórios detalhados dos erros e avisos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold">{validationResults.totalRows.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total de linhas</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{validationResults.validRows.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Linhas válidas</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">{getErrorTypeCount('error')}</div>
              <div className="text-xs text-muted-foreground">Erros</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{getErrorTypeCount('warning')}</div>
              <div className="text-xs text-muted-foreground">Avisos</div>
            </div>
          </div>

          {/* Top Error Types */}
          {getTopErrorTypes().length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Principais Tipos de Problemas:</h4>
              <div className="space-y-2">
                {getTopErrorTypes().map(([type, count], index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={generateCSVReport}
              className="flex items-center gap-2"
            >
              <Table className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={generateDetailedReport}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Relatório Detalhado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorReportGenerator;