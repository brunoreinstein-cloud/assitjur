import Papa from 'papaparse';
import { PorProcesso, PorTestemunha } from '@/types/mapa-testemunhas';
import { formatProcessoForCSV, formatTestemunhaForCSV } from './formatters';
import { applyPIIMask } from './pii';

export interface ExportOptions {
  filename?: string;
  maskPII?: boolean;
  selectedOnly?: boolean;
  selectedIds?: string[];
}

export const exportProcessosToCSV = (
  data: PorProcesso[], 
  options: ExportOptions = {}
) => {
  const { 
    filename = `processos-${new Date().toISOString().split('T')[0]}.csv`,
    maskPII = false,
    selectedOnly = false,
    selectedIds = []
  } = options;

  // Filter data if selectedOnly is true
  let exportData = data;
  if (selectedOnly && selectedIds.length > 0) {
    exportData = data.filter(item => selectedIds.includes(item.cnj));
  }

  // Convert to CSV format
  const csvData = exportData.map(processo => {
    const formatted = formatProcessoForCSV(processo);
    
    if (maskPII) {
      // Apply PII masking to sensitive fields
      return {
        ...formatted,
        'Reclamante': applyPIIMask(formatted['Reclamante']),
        'Todas Testemunhas': applyPIIMask(formatted['Todas Testemunhas']),
        'Insight Estratégico': applyPIIMask(formatted['Insight Estratégico']),
      };
    }
    
    return formatted;
  });

  // Generate CSV
  const csv = Papa.unparse(csvData, {
    delimiter: ',',
    header: true
  });

  // Add BOM for proper UTF-8 encoding in Excel
  const csvWithBOM = '\uFEFF' + csv;

  // Create and trigger download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return csvData.length;
};

export const exportTestemunhasToCSV = (
  data: PorTestemunha[], 
  options: ExportOptions = {}
) => {
  const { 
    filename = `testemunhas-${new Date().toISOString().split('T')[0]}.csv`,
    maskPII = false,
    selectedOnly = false,
    selectedIds = []
  } = options;

  // Filter data if selectedOnly is true
  let exportData = data;
  if (selectedOnly && selectedIds.length > 0) {
    exportData = data.filter(item => selectedIds.includes(item.nome_testemunha));
  }

  // Convert to CSV format
  const csvData = exportData.map(testemunha => {
    const formatted = formatTestemunhaForCSV(testemunha);
    
    if (maskPII) {
      // Apply PII masking to sensitive fields
      return {
        ...formatted,
        'Nome Testemunha': applyPIIMask(formatted['Nome Testemunha']),
        'CNJs como Testemunha': applyPIIMask(formatted['CNJs como Testemunha']),
        'CNJs como Reclamante': applyPIIMask(formatted['CNJs como Reclamante']),
      };
    }
    
    return formatted;
  });

  // Generate CSV
  const csv = Papa.unparse(csvData, {
    delimiter: ',',
    header: true
  });

  // Add BOM for proper UTF-8 encoding in Excel
  const csvWithBOM = '\uFEFF' + csv;

  // Create and trigger download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return csvData.length;
};

// Utility function to estimate CSV size
export const estimateCSVSize = (recordCount: number, isProcesso: boolean = true): string => {
  // Rough estimation based on average field sizes
  const avgRecordSize = isProcesso ? 500 : 350; // bytes per record
  const totalSize = recordCount * avgRecordSize;
  
  if (totalSize < 1024) {
    return `${totalSize} bytes`;
  } else if (totalSize < 1024 * 1024) {
    return `${(totalSize / 1024).toFixed(1)} KB`;
  } else {
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  }
};

// Validate export limits (max 5000 records as per requirements)
export const validateExportSize = (recordCount: number, selectedOnly: boolean = false): {
  isValid: boolean;
  message?: string;
  maxRecords: number;
} => {
  const maxRecords = 5000;
  
  if (recordCount === 0) {
    return {
      isValid: false,
      message: selectedOnly ? 'Nenhum registro selecionado para exportação.' : 'Nenhum registro encontrado para exportação.',
      maxRecords
    };
  }
  
  if (recordCount > maxRecords) {
    return {
      isValid: false,
      message: `Limite de exportação excedido. Máximo permitido: ${maxRecords.toLocaleString()} registros. ${selectedOnly ? 'Selecione menos registros' : 'Aplique filtros para reduzir o resultado'}.`,
      maxRecords
    };
  }
  
  return {
    isValid: true,
    maxRecords
  };
};