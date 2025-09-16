import { processoSamples, testemunhaSamples, dicionarioFields } from '@/lib/templates/samples';

export async function buildTemplateXlsx(): Promise<Buffer> {
  // Import XLSX only when generating the template
  const XLSX = await import('xlsx');
  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Aba "Por Processo"
  const processoWs = XLSX.utils.json_to_sheet(processoSamples);
  XLSX.utils.book_append_sheet(wb, processoWs, 'Por Processo');

  // Aba "Por Testemunha"
  const testemunhaWs = XLSX.utils.json_to_sheet(testemunhaSamples);
  XLSX.utils.book_append_sheet(wb, testemunhaWs, 'Por Testemunha');

  // Aba "Dicionario"
  const dicionarioWs = XLSX.utils.json_to_sheet(dicionarioFields);
  XLSX.utils.book_append_sheet(wb, dicionarioWs, 'Dicionario');

  // Gerar buffer
  return XLSX.write(wb, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  }) as Buffer;
}