import type { DetectedSheet, ImportSession, ValidationResult, ValidationIssue } from './types';
import { normalizeSheetData } from './normalize';
import { findNormalizedColumnName, applyColumnMapping } from '@/features/importer/etl/synonyms';

// Field correction utilities
const onlyDigits = (s = '') => s.replace(/\D/g, '');
const isCNJ20 = (s: string) => onlyDigits(s).length === 20;

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
    // CNJ correction
    if (correctedData.cnj) {
      const original = correctedData.cnj;
      const digits = onlyDigits(String(original));
      
      if (digits.length < 20) {
        // Try to complete CNJ if it's partially filled
        if (digits.length >= 15) {
          const completed = digits.padEnd(20, '0');
          correctedData.cnj = completed;
          corrections.push({
            field: 'cnj',
            originalValue: original,
            correctedValue: completed,
            correctionType: 'auto_complete',
            confidence: 0.7
          });
        } else {
          isValid = false;
        }
      } else if (digits.length > 20) {
        // Truncate if too long
        const truncated = digits.substring(0, 20);
        correctedData.cnj = truncated;
        corrections.push({
          field: 'cnj',
          originalValue: original,
          correctedValue: truncated,
          correctionType: 'format',
          confidence: 0.8
        });
      }
      
      // Store normalized version
      correctedData.cnj_digits = onlyDigits(correctedData.cnj);
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
      
      // Check if required field is missing
      if (!correctedData[field] || String(correctedData[field]).trim() === '') {
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
    
    // CNJ validation
    if (correctedData.cnjs_como_testemunha) {
      const cnjs = Array.isArray(correctedData.cnjs_como_testemunha) 
        ? correctedData.cnjs_como_testemunha 
        : String(correctedData.cnjs_como_testemunha).split(/[;,]/).map(s => s.trim());
      
      const validCnjs = cnjs.filter(cnj => isCNJ20(cnj));
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
  const allCorrections: CorrectedRow[] = [];
  const normalizedData: any = { processos: [], testemunhas: [] };

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
      
      dataToProcess.forEach((row: any, index: number) => {
        const rowNumber = index + 1;
        totalAnalyzed++;
        
        // Apply intelligent corrections
        const correctedRow = autoCorrections.intelligentCorrections 
          ? correctRowData(row, index, sheetType)
          : { originalData: row, correctedData: row, corrections: [], isValid: true };
        
        allCorrections.push(correctedRow);
        
        // Validate corrected data
        if (correctedRow.isValid) {
          totalValid++;
          
          // Add corrected data to normalized result
          if (sheetType === 'processo') {
            normalizedData.processos.push(correctedRow.correctedData);
          } else {
            normalizedData.testemunhas.push(correctedRow.correctedData);
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
                severity: 'error',
                rule: 'Nome do réu é obrigatório',
                message: 'Campo "reu_nome" é obrigatório mas está vazio',
                value: correctedRow.correctedData.reu_nome || 'N/A'
              });
            }
            
            if (!correctedRow.correctedData.cnj || !isCNJ20(correctedRow.correctedData.cnj)) {
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

  const result: IntelligentValidationResult = {
    summary: {
      analyzed: totalAnalyzed,
      valid: totalValid,
      errors: allIssues.filter(i => i.severity === 'error').length,
      warnings: allIssues.filter(i => i.severity === 'warning').length,
      infos: allIssues.filter(i => i.severity === 'info').length,
    },
    issues: allIssues,
    normalizedData,
    intelligentCorrections: allCorrections
  };

  return result;
}