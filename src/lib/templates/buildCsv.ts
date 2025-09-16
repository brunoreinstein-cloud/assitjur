import { processoSamples, testemunhaSamples, dicionarioFields } from '@/lib/templates/samples';

export function buildCsv(sheetName: string): string {
  let data: any[] = [];
  
  switch (sheetName) {
    case 'Por Processo':
      data = processoSamples;
      break;
    case 'Por Testemunha':
      data = testemunhaSamples;
      break;
    case 'Dicionario':
      data = dicionarioFields;
      break;
    default:
      throw new Error(`Sheet "${sheetName}" não encontrada`);
  }

  if (data.length === 0) {
    throw new Error(`Nenhum dado encontrado para a aba "${sheetName}"`);
  }

  // Obter headers
  const headers = Object.keys(data[0]);
  
  // Função para escapar valores CSV
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Se contém separador, quebra de linha ou aspas, envolver em aspas duplas
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Construir CSV
  const lines: string[] = [];
  
  // Header
  lines.push(headers.map(h => escapeCsvValue(h)).join(','));
  
  // Dados
  data.forEach(row => {
    const values = headers.map(header => escapeCsvValue(row[header]));
    lines.push(values.join(','));
  });

  return lines.join('\n');
}