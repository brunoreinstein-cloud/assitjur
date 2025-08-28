import { TestemunhaRowSchema, ProcessoRowSchema } from './types';
import { normalizeSheetData } from './normalize';
import { correctCNJ, type CNJCorrection } from './correctors/cnjCorrector';
import { correctDate, type DateCorrection } from './correctors/dateCorrector';
import { fillEmptyFields, correctNameCapitalization, type FieldCorrection } from './correctors/fieldFiller';
import type { 
  ImportSession, 
  ValidationResult, 
  ValidationIssue, 
  ValidationSummary,
  OrgSettings 
} from './types';

/**
 * Configurações padrão da organização (mock)
 */
const getMockOrgSettings = (): OrgSettings => ({
  orgId: 'default',
  defaultReuNome: 'Empresa Padrão Ltda',
  applyDefaultReuOnTestemunha: true,
  requireReuOnProcesso: true,
  updatedAt: new Date()
});

/**
 * Função principal de validação com correções inteligentes
 */
export async function normalizeAndValidate(
  session: ImportSession, 
  autoCorrections: { 
    explodeLists: boolean; 
    standardizeCNJ: boolean; 
    applyDefaultReu: boolean; 
    intelligentCorrections?: boolean; 
  }
): Promise<Omit<ValidationResult, 'downloadUrls'> & { corrections?: Map<string, any> }> {
  
  let totalAnalyzed = 0;
  let totalValid = 0;
  const allIssues: ValidationIssue[] = [];
  const combinedNormalizedData: { testemunhas?: any[], processos?: any[] } = {};
  const allCorrections = new Map<string, any>();

  // Processa cada aba - simula processamento com dados mock
  for (const sheet of session.sheets) {
    // Cria dados mock baseado no tipo da sheet
    let mockData = createMockData(sheet);
    
    // Aplicar correções inteligentes se habilitado
    if (autoCorrections.intelligentCorrections !== false) {
      const { correctedData, corrections } = applyIntelligentCorrections(
        mockData, 
        sheet.name,
        sheet.model === 'processo' ? 'processo' : 'testemunha'
      );
      mockData = correctedData;
      
      // Registrar correções
      corrections.forEach((correction, key) => {
        allCorrections.set(`${sheet.name}!${key}`, correction);
      });
    }
    
    totalAnalyzed += mockData.length;

    // Validar dados normalizados
    const { issues: validationIssues, validCount } = validateNormalizedData(mockData, sheet.name);
    allIssues.push(...validationIssues);
    totalValid += validCount;

    // Detectar duplicatas
    const duplicateIssues = detectDuplicates(mockData, sheet.name);
    allIssues.push(...duplicateIssues);

    // Acumular dados por tipo
    if (sheet.model === 'processo' || sheet.model === 'ambiguous') {
      if (!combinedNormalizedData.processos) combinedNormalizedData.processos = [];
      combinedNormalizedData.processos.push(...(mockData.filter((row: any) => 
        row.reclamante_nome && row.reu_nome
      )));
    }
    
    if (sheet.model === 'testemunha' || sheet.model === 'ambiguous') {
      if (!combinedNormalizedData.testemunhas) combinedNormalizedData.testemunhas = [];
      combinedNormalizedData.testemunhas.push(...(mockData.filter((row: any) => 
        row.nome_testemunha
      )));
    }
  }

  return {
    summary: {
      analyzed: totalAnalyzed,
      valid: totalValid,
      errors: allIssues.filter(i => i.severity === 'error').length,
      warnings: allIssues.filter(i => i.severity === 'warning').length,
      infos: allIssues.filter(i => i.severity === 'info').length,
    },
    issues: allIssues,
    normalizedData: combinedNormalizedData,
    corrections: allCorrections
  };
}

/**
 * Cria dados mock para demonstração das correções
 */
function createMockData(sheet: any): any[] {
  const mockRows = [];
  const rowCount = Math.min(sheet.rows || 10, 20); // Limita para demo
  
  for (let i = 0; i < rowCount; i++) {
    if (sheet.model === 'processo') {
      mockRows.push({
        cnj: '123456789', // CNJ inválido para demonstrar correção
        cnj_digits: '12345678901234567890',
        reclamante_nome: 'joao silva santos', // Nome em minúscula para correção
        reu_nome: '', // Vazio para preenchimento automático
        data_audiencia: '31/12/2023', // Data em formato BR para correção
        comarca: 'São Paulo',
        tribunal: 'TRT-2',
        vara: '1ª Vara',
        fase: '',
        status: ''
      });
    } else if (sheet.model === 'testemunha') {
      mockRows.push({
        cnj: '987654321', // CNJ inválido
        cnj_digits: '98765432109876543210',
        nome_testemunha: 'maria OLIVEIRA', // Nome em caps misto para correção
        reclamante_nome: '', // Vazio
        reu_nome: '',
        data_audiencia: '2023-12-25'
      });
    }
  }
  
  return mockRows;
}

/**
 * Aplica correções inteligentes aos dados normalizados
 */
function applyIntelligentCorrections(
  data: any[],
  sheetName: string,
  sheetType: 'processo' | 'testemunha'
): { correctedData: any[], corrections: Map<string, any> } {
  const corrections = new Map<string, any>();
  const correctedData = data.map((row, index) => {
    const correctedRow = { ...row };
    
    // Correções de CNJ
    if (row.cnj || row.cnj_digits) {
      const cnjToCorrect = row.cnj_digits || row.cnj;
      const cnjCorrection = correctCNJ(cnjToCorrect);
      
      if (cnjCorrection) {
        correctedRow.cnj_digits = cnjCorrection.corrected;
        correctedRow.cnj = cnjCorrection.corrected;
        
        corrections.set(`${index + 1}_cnj`, {
          type: 'cnj',
          original: cnjCorrection.original,
          corrected: cnjCorrection.corrected,
          confidence: cnjCorrection.confidence,
          reason: `Correção de CNJ: ${cnjCorrection.type}`
        });
      }
    }
    
    // Correções de data
    if (row.data_audiencia) {
      const dateCorrection = correctDate(row.data_audiencia);
      
      if (dateCorrection) {
        correctedRow.data_audiencia = dateCorrection.corrected;
        
        corrections.set(`${index + 1}_data_audiencia`, {
          type: 'date',
          original: dateCorrection.original,
          corrected: dateCorrection.corrected,
          confidence: dateCorrection.confidence,
          reason: `Correção de data: ${dateCorrection.format}`
        });
      }
    }
    
    // Preenchimento de campos vazios
    const fieldCorrections = fillEmptyFields(correctedRow, index, sheetType);
    
    fieldCorrections.forEach(fieldCorrection => {
      if (fieldCorrection.corrected !== null) {
        correctedRow[fieldCorrection.field] = fieldCorrection.corrected;
      } else {
        delete correctedRow[fieldCorrection.field];
      }
      
      corrections.set(`${index + 1}_${fieldCorrection.field}`, {
        type: 'field',
        original: fieldCorrection.original,
        corrected: fieldCorrection.corrected,
        confidence: fieldCorrection.confidence,
        reason: fieldCorrection.reason
      });
    });
    
    // Correção de capitalização de nomes
    const nameFields = ['reclamante_nome', 'reu_nome', 'nome_testemunha'];
    nameFields.forEach(field => {
      if (correctedRow[field]) {
        const nameCorrection = correctNameCapitalization(correctedRow[field]);
        
        if (nameCorrection) {
          correctedRow[field] = nameCorrection.corrected;
          
          corrections.set(`${index + 1}_${field}_caps`, {
            type: 'name',
            original: nameCorrection.original,
            corrected: nameCorrection.corrected,
            confidence: nameCorrection.confidence,
            reason: nameCorrection.reason
          });
        }
      }
    });
    
    return correctedRow;
  });
  
  return { correctedData, corrections };
}

/**
 * Valida dados normalizados usando Zod
 */
function validateNormalizedData(
  normalizedData: any,
  sheetName: string
): { issues: ValidationIssue[], validCount: number } {
  const issues: ValidationIssue[] = [];
  let validCount = 0;
  
  // Simula validação para cada linha
  normalizedData.forEach((row: any, index: number) => {
    // Validação básica de CNJ
    if (!row.cnj_digits || row.cnj_digits.length !== 20) {
      issues.push({
        sheet: sheetName,
        row: index + 1,
        column: 'cnj',
        severity: 'error',
        rule: 'CNJ deve ter 20 dígitos',
        value: row.cnj
      });
    } else {
      validCount++;
    }
    
    // Validação de nomes obrigatórios
    if (!row.reclamante_nome && !row.nome_testemunha) {
      issues.push({
        sheet: sheetName,
        row: index + 1,
        column: 'nome',
        severity: 'error',
        rule: 'Nome do reclamante ou testemunha é obrigatório',
        value: null
      });
    }
  });
  
  return { issues, validCount };
}

/**
 * Detecta duplicatas
 */
function detectDuplicates(
  normalizedData: any[],
  sheetName: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenCNJs = new Set<string>();
  
  normalizedData.forEach((row, index) => {
    if (row.cnj_digits && seenCNJs.has(row.cnj_digits)) {
      issues.push({
        sheet: sheetName,
        row: index + 1,
        column: 'cnj',
        severity: 'warning',
        rule: 'CNJ duplicado detectado',
        value: row.cnj
      });
    } else if (row.cnj_digits) {
      seenCNJs.add(row.cnj_digits);
    }
  });
  
  return issues;
}