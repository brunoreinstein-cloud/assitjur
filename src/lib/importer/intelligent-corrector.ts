import type { DetectedSheet, ImportSession, ValidationResult, ValidationIssue } from '@/lib/importer/types';
import { normalizeSheetData } from '@/lib/importer/normalize';
import { findNormalizedColumnName, applyColumnMapping } from '@/features/importer/etl/synonyms';
import { validateCNJ, correctCNJ, cleanCNJ } from '@/lib/validation/unified-cnj';

// Using unified CNJ validation - remove local utilities

interface FieldCorrection {
  field: string;
  originalValue: any;
  correctedValue: any;
  correctionType: 'auto_complete' | 'format' | 'infer' | 'default';
  confidence: number;
}

interface CorrectedRow {
  originalData: any;
  correctedData: any;
  corrections: FieldCorrection[];
  isValid: boolean;
}

// Extended result type for intelligent validation
export interface IntelligentValidationResult extends Omit<ValidationResult, 'corrections'> {
  corrections?: Map<string, any>; // Keep original field for compatibility
  intelligentCorrections?: CorrectedRow[]; // Add new field for intelligent corrections
}

/**
 * Intelligent field mapping with synonym support
 */
function mapFieldsIntelligently(headers: string[], sheetType: 'processo' | 'testemunha'): {
  mapped: Record<string, string>;
  unmapped: string[];
  missing: string[];
  suggestions: Record<string, string[]>;
} {
  const result = applyColumnMapping(headers, sheetType);
  
  // Generate suggestions for unmapped fields
  const suggestions: Record<string, string[]> = {};
  
  result.unmapped.forEach(unmappedField => {
    const possibleMatches: string[] = [];
    
    // Look for partial matches
    if (sheetType === 'processo') {
      if (unmappedField.toLowerCase().includes('reclamante')) {
        possibleMatches.push('reclamante_nome');
      }
      if (unmappedField.toLowerCase().includes('reu') || unmappedField.toLowerCase().includes('reclamado')) {
        possibleMatches.push('reu_nome');
      }
      if (unmappedField.toLowerCase().includes('cnj') || unmappedField.toLowerCase().includes('processo')) {
        possibleMatches.push('cnj');
      }
    }
    
    if (possibleMatches.length > 0) {
      suggestions[unmappedField] = possibleMatches;
    }
  });
  
  return { ...result, suggestions };
}

/**
 * Intelligent data correction
 */
function correctRowData(row: any, rowIndex: number, sheetType: 'processo' | 'testemunha'): CorrectedRow {
  const corrections: FieldCorrection[] = [];
  const correctedData = { ...row };
  let isValid = true;

  if (sheetType === 'processo') {
      // CNJ correction using unified system  
      if (correctedData.cnj) {
        const original = correctedData.cnj;
        const cnjCorrection = correctCNJ(original);
        
        if (cnjCorrection.needsCorrection) {
          corrections.push({
            field: 'cnj',
            originalValue: original,
            correctedValue: cnjCorrection.corrected,
            correctionType: 'auto_complete',
            confidence: 0.7
          });
        }
        
        correctedData.cnj = cnjCorrection.corrected;
        // Store normalized version
        correctedData.cnj_digits = cleanCNJ(correctedData.cnj);
      }

    // Name corrections
    ['reclamante_nome', 'reu_nome'].forEach(field => {
      if (correctedData[field] && typeof correctedData[field] === 'string') {
        const original = correctedData[field];
        const cleaned = original.trim().replace(/\s+/g, ' ');
        
        if (cleaned !== original) {
          correctedData[field] = cleaned;
          corrections.push({
            field,
            originalValue: original,
            correctedValue: cleaned,
            correctionType: 'format',
            confidence: 0.9
          });
        }
        
        // Title case correction
        if (cleaned === cleaned.toUpperCase() || cleaned === cleaned.toLowerCase()) {
          const titleCase = cleaned.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
          correctedData[field] = titleCase;
          corrections.push({
            field,
            originalValue: cleaned,
            correctedValue: titleCase,
            correctionType: 'format',
            confidence: 0.8
          });
        }
      }
      
      // Only reclamante_nome is truly required - reu_nome can be empty in some cases
      if (field === 'reclamante_nome' && (!correctedData[field] || String(correctedData[field]).trim() === '')) {
        isValid = false;
      }
    });

    // Default réu inference
    if (!correctedData.reu_nome && correctedData.reclamante_nome) {
      // Look for common patterns that might indicate the defendant
      const reclamante = correctedData.reclamante_nome.toLowerCase();
      if (reclamante.includes('vs') || reclamante.includes('x ')) {
        const parts = reclamante.split(/\s+(vs?\.?|x)\s+/i);
        if (parts.length >= 2) {
          correctedData.reu_nome = parts[1].trim();
          corrections.push({
            field: 'reu_nome',
            originalValue: null,
            correctedValue: correctedData.reu_nome,
            correctionType: 'infer',
            confidence: 0.6
          });
        }
      }
    }

    // Array field corrections
    ['advogados_ativo', 'advogados_passivo', 'testemunhas_ativo', 'testemunhas_passivo'].forEach(field => {
      if (correctedData[field] && typeof correctedData[field] === 'string') {
        const original = correctedData[field];
        const array = original.split(/[;,]/).map((s: string) => s.trim()).filter(Boolean);
        
        if (array.length > 0) {
          correctedData[field] = array;
          corrections.push({
            field,
            originalValue: original,
            correctedValue: array,
            correctionType: 'format',
            confidence: 0.9
          });
        }
      }
    });

  } else if (sheetType === 'testemunha') {
    // Testemunha validations
    if (!correctedData.nome_testemunha || String(correctedData.nome_testemunha).trim() === '') {
      isValid = false;
    }
    
    // CNJ validation using unified system
    if (correctedData.cnjs_como_testemunha) {
      const cnjs = Array.isArray(correctedData.cnjs_como_testemunha) 
        ? correctedData.cnjs_como_testemunha 
        : String(correctedData.cnjs_como_testemunha).split(/[;,]/).map(s => s.trim());
      
      const validCnjs = cnjs.filter((cnj: any) => {
        const validation = validateCNJ(cnj, 'final');
        return validation.isValid;
      });
      
      if (validCnjs.length === 0) {
        isValid = false;
      }
    }
  }

  return {
    originalData: row,
    correctedData,
    corrections,
    isValid
  };
}

/**
 * Enhanced validation with real file processing and intelligent correction
 */
export async function intelligentValidateAndCorrect(
  session: ImportSession, 
  autoCorrections: { 
    explodeLists: boolean; 
    standardizeCNJ: boolean; 
    applyDefaultReu: boolean; 
    intelligentCorrections?: boolean; 
  },
  file?: File
): Promise<IntelligentValidationResult> {
  
  if (!file) {
    throw new Error('Arquivo é obrigatório para validação inteligente');
  }

  let totalAnalyzed = 0;
  let totalValid = 0;
  const allIssues: ValidationIssue[] = [];
  const intelligentCorrections: CorrectedRow[] = [];
  const normalizedData: any = { processos: [], testemunhas: [] };
  const rawDataCount: Record<string, number> = {};

  // Process each sheet with real data
  for (const sheet of session.sheets) {
    try {
      // Load and normalize real data from file
      const sheetData = await normalizeSheetData(file, sheet, null);
      
      // Determine sheet type for intelligent mapping
      const sheetType = sheet.model === 'testemunha' ? 'testemunha' : 'processo';
      
      // Intelligent field mapping
      const mappingResult = mapFieldsIntelligently(sheet.headers, sheetType);
      
      // Add mapping issues
      mappingResult.missing.forEach(missingField => {
        allIssues.push({
          sheet: sheet.name,
          row: 0, // Header issue
          column: missingField,
          severity: 'error',
          rule: 'Campo obrigatório não encontrado',
          message: `Campo obrigatório "${missingField}" não foi encontrado nos cabeçalhos`,
          value: 'N/A'
        });
      });

      // Process unmapped fields with suggestions
      Object.entries(mappingResult.suggestions).forEach(([unmapped, suggestions]) => {
        allIssues.push({
          sheet: sheet.name,
          row: 0,
          column: unmapped,
          severity: 'warning',
          rule: 'Campo não mapeado',
          message: `Campo "${unmapped}" não foi mapeado. Sugestões: ${suggestions.join(', ')}`,
          value: unmapped
        });
      });

      // Process data with intelligent correction
      const dataToProcess = sheetData.processos || sheetData.testemunhas || [];
      rawDataCount[sheet.name] = dataToProcess.length;
      
      dataToProcess.forEach((row: any, index: number) => {
        const rowNumber = index + 1;
        totalAnalyzed++;
        
        // Apply intelligent corrections
        const correctedRow = autoCorrections.intelligentCorrections 
          ? correctRowData(row, index, sheetType)
          : { originalData: row, correctedData: row, corrections: [], isValid: true };
        
        intelligentCorrections.push(correctedRow);
        
        // Validate corrected data with unified CNJ system
        const cnjValidation = validateCNJ(correctedRow.correctedData.cnj, 'correction');
        const hasMinimalCNJ = cnjValidation.isValid;
        
        if (correctedRow.isValid || hasMinimalCNJ) {
          totalValid++;
          
          // Determine data type based on available fields, not just sheet type
          const hasProcessoFields = correctedRow.correctedData.reclamante_nome || correctedRow.correctedData.reu_nome;
          const hasTestemunhaFields = correctedRow.correctedData.nome_testemunha;
          
          if (hasProcessoFields && (sheetType === 'processo' || !hasTestemunhaFields)) {
            if (!normalizedData.processos) normalizedData.processos = [];
            normalizedData.processos.push(correctedRow.correctedData);
          } 
          else if (hasTestemunhaFields && (sheetType === 'testemunha' || !hasProcessoFields)) {
            if (!normalizedData.testemunhas) normalizedData.testemunhas = [];
            normalizedData.testemunhas.push(correctedRow.correctedData);
          }
          else if (hasMinimalCNJ) {
            // Fallback: include based on sheet type even with minimal data
            if (sheetType === 'processo') {
              if (!normalizedData.processos) normalizedData.processos = [];
              normalizedData.processos.push(correctedRow.correctedData);
            } else {
              if (!normalizedData.testemunhas) normalizedData.testemunhas = [];
              normalizedData.testemunhas.push(correctedRow.correctedData);
            }
          }
          
          // Add warnings for incomplete but preserved data
          const cnjDigits = cleanCNJ(correctedRow.correctedData.cnj);
          if (hasMinimalCNJ && cnjDigits.length < 20) {
            allIssues.push({
              sheet: sheet.name,
              row: rowNumber,
              column: 'cnj',
              severity: 'warning',
              rule: 'CNJ incompleto mas preservado',
              message: `CNJ tem ${cnjDigits.length} dígitos (recomendado: 20). Dados preservados para revisão.`,
              value: correctedRow.correctedData.cnj || 'N/A'
            });
          }
          
          // Add info messages for corrections made
          correctedRow.corrections.forEach(correction => {
            allIssues.push({
              sheet: sheet.name,
              row: rowNumber,
              column: correction.field,
              severity: 'info',
              rule: 'Correção automática aplicada',
              message: `${correction.correctionType}: "${correction.originalValue}" → "${correction.correctedValue}" (confiança: ${Math.round(correction.confidence * 100)}%)`,
              value: correction.originalValue
            });
          });
        } else {
          // Add validation errors for invalid rows
          if (sheetType === 'processo') {
            if (!correctedRow.correctedData.reclamante_nome) {
              allIssues.push({
                sheet: sheet.name,
                row: rowNumber,
                column: 'reclamante_nome',
                severity: 'error',
                rule: 'Nome do reclamante é obrigatório',
                message: 'Campo "reclamante_nome" é obrigatório mas está vazio',
                value: correctedRow.correctedData.reclamante_nome || 'N/A'
              });
            }
            
            if (!correctedRow.correctedData.reu_nome) {
              allIssues.push({
                sheet: sheet.name,
                row: rowNumber,
                column: 'reu_nome',
                severity: 'warning',
                rule: 'Nome do réu recomendado',
                message: 'Campo "reu_nome" está vazio mas pode ser preenchido posteriormente',
                value: correctedRow.correctedData.reu_nome || 'N/A'
              });
            }
            
            if (!correctedRow.correctedData.cnj || !validateCNJ(correctedRow.correctedData.cnj, 'final').isValid) {
              allIssues.push({
                sheet: sheet.name,
                row: rowNumber,
                column: 'cnj',
                severity: 'error',
                rule: 'CNJ deve ter 20 dígitos',
                message: 'CNJ deve ter formato válido com 20 dígitos numéricos',
                value: correctedRow.correctedData.cnj || 'N/A'
              });
            }
          }
        }
      });

    } catch (error) {
      allIssues.push({
        sheet: sheet.name,
        row: 0,
        column: 'sistema',
        severity: 'error',
        rule: 'Erro no processamento',
        message: `Erro ao processar aba: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        value: 'N/A'
      });
    }
  }

  // Calculate enhanced statistics  
  const totalOriginal = Object.values(rawDataCount).reduce((acc, count) => acc + count, 0);
  const totalProcessed = Object.values(normalizedData).flat().length;
  const totalFiltered = totalOriginal - totalProcessed;
  const correctionsApplied = intelligentCorrections.filter(c => c.corrections.length > 0).length;
  const totalCorrectionsMade = intelligentCorrections.reduce((acc, c) => acc + c.corrections.length, 0);
  
  console.log(`🔍 Enhanced Validation Summary:
    📊 File Processing:
    - Original rows loaded: ${totalOriginal}
    - Successfully processed: ${totalProcessed}  
    - Filtered out (invalid): ${totalFiltered}
    - Final valid rows: ${totalValid}
    
    🔧 Corrections Applied:
    - Rows with corrections: ${correctionsApplied}
    - Individual corrections made: ${totalCorrectionsMade}
    
    📈 Data Breakdown:
    - Processos: ${normalizedData.processos?.length || 0}
    - Testemunhas: ${normalizedData.testemunhas?.length || 0}`);

  const result: IntelligentValidationResult = {
    summary: {
      analyzed: totalOriginal, // Show original count for transparency
      valid: totalValid,
      errors: allIssues.filter(i => i.severity === 'error').length,
      warnings: allIssues.filter(i => i.severity === 'warning').length,
      infos: allIssues.filter(i => i.severity === 'info').length,
    },
    issues: allIssues,
    normalizedData,
    intelligentCorrections
  };

  return result;
}