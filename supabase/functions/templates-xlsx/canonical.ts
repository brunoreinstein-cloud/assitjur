// Import XLSX for Deno - using ESM.sh for better compatibility
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

// Import canonical data structures
import { 
  canonicalProcessoSamples, 
  canonicalTestemunhaSamples, 
  canonicalDicionarioFields,
  type CanonicalProcessoSample,
  type CanonicalTestemunhaSample,
  type DicionarioField
} from '../../../src/lib/templates/canonical-samples.ts';

/**
 * Build canonical XLSX template using the standardized format
 */
export function buildCanonicalXlsx(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Por Processo with canonical data
  const processoWs = XLSX.utils.json_to_sheet(canonicalProcessoSamples);
  XLSX.utils.book_append_sheet(wb, processoWs, 'Por Processo');

  // Sheet 2: Por Testemunha with canonical data
  const testemunhaWs = XLSX.utils.json_to_sheet(canonicalTestemunhaSamples);
  XLSX.utils.book_append_sheet(wb, testemunhaWs, 'Por Testemunha');

  // Sheet 3: Dicionario with canonical field definitions
  const dicionarioWs = XLSX.utils.json_to_sheet(canonicalDicionarioFields);
  XLSX.utils.book_append_sheet(wb, dicionarioWs, 'Dicionario');

  // Generate buffer with compression
  return XLSX.write(wb, { 
    type: 'array', 
    bookType: 'xlsx',
    compression: true 
  });
}