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

// Funções de validação específicas conforme solicitado
const onlyDigits = (s = '') => s.replace(/\D/g, '');
const isCNJ20 = (s: string) => onlyDigits(s).length === 20;
const parseList = (v: any): string[] => {
  const s = String(v ?? '').trim();
  if (!s || s === '[]') return [];
  if (s.startsWith('[') && s.endsWith(']')) { 
    try { return JSON.parse(s.replace(/'/g, '"')).map((x: any) => String(x).trim()).filter(Boolean); } catch {} 
  }
  return s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
};

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
 * Função principal de validação com dados REAIS do arquivo
 */
export async function normalizeAndValidate(
  session: ImportSession, 
  autoCorrections: { 
    explodeLists: boolean; 
    standardizeCNJ: boolean; 
    applyDefaultReu: boolean; 
    intelligentCorrections?: boolean; 
  },
  file?: File
): Promise<Omit<ValidationResult, 'downloadUrls'> & { corrections?: Map<string, any> }> {
  
  let totalAnalyzed = 0;
  let totalValid = 0;
  const allIssues: ValidationIssue[] = [];
  const combinedNormalizedData: { testemunhas?: any[], processos?: any[] } = {};
  const allCorrections = new Map<string, any>();
  const orgSettings = getMockOrgSettings();

  // Processa cada aba com dados REAIS do arquivo
  for (const sheet of session.sheets) {
    let realData: any[] = [];
    
    // Se arquivo fornecido, processa dados reais
    if (file) {
      try {
        console.log('📊 Processando dados reais do arquivo:', file.name);
        const normalizedResult = await normalizeSheetData(file, sheet, orgSettings);
        
        if (sheet.model === 'testemunha' && normalizedResult.testemunhas) {
          realData = normalizedResult.testemunhas;
          console.log(`✅ ${realData.length} testemunhas carregadas do arquivo`);
        } else if (sheet.model === 'processo' && normalizedResult.processos) {
          realData = normalizedResult.processos;
          console.log(`✅ ${realData.length} processos carregados do arquivo`);
        }
        
        if (realData.length === 0) {
          throw new Error('Nenhum dado válido encontrado no arquivo. Verifique se o arquivo contém dados nas colunas corretas.');
        }
      } catch (error) {
        console.error('Erro ao processar dados reais:', error);
        throw new Error(`Erro ao processar arquivo: ${error.message}`);
      }
    } else {
      throw new Error('Arquivo não fornecido para validação');
    }
    
    // Aplicar correções inteligentes se habilitado
    if (autoCorrections.intelligentCorrections !== false && realData.length > 0) {
      const { correctedData, corrections } = applyIntelligentCorrections(
        realData, 
        sheet.name,
        sheet.model === 'processo' ? 'processo' : 'testemunha'
      );
      realData = correctedData;
      
      // Registrar correções
      corrections.forEach((correction, key) => {
        allCorrections.set(`${sheet.name}!${key}`, correction);
      });
    }
    
    totalAnalyzed += realData.length;

    // Validar dados com regras específicas por modelo
    const { issues: validationIssues, validCount } = validateDataByModel(realData, sheet);
    allIssues.push(...validationIssues);
    totalValid += validCount;

    // Detectar duplicatas
    const duplicateIssues = detectDuplicates(realData, sheet.name);
    allIssues.push(...duplicateIssues);

    // Acumular dados por tipo
    if (sheet.model === 'processo' || sheet.model === 'ambiguous') {
      if (!combinedNormalizedData.processos) combinedNormalizedData.processos = [];
      combinedNormalizedData.processos.push(...realData);
    }
    
    if (sheet.model === 'testemunha' || sheet.model === 'ambiguous') {
      if (!combinedNormalizedData.testemunhas) combinedNormalizedData.testemunhas = [];
      combinedNormalizedData.testemunhas.push(...realData);
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

// Removed createMockData - system now only processes real data

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
 * Valida dados por modelo específico conforme regras solicitadas
 */
function validateDataByModel(
  normalizedData: any[],
  sheet: { name: string; model: string }
): { issues: ValidationIssue[], validCount: number } {
  const issues: ValidationIssue[] = [];
  let validCount = 0;
  
  normalizedData.forEach((row: any, index: number) => {
    const rowNumber = index + 1;
    let rowValid = true;
    
    if (sheet.model === 'testemunha') {
      // VALIDAÇÃO MODO TESTEMUNHA
      
      // 1. Erro se nome_testemunha vazio
      if (!row.nome_testemunha || String(row.nome_testemunha).trim() === '') {
        issues.push({
          sheet: sheet.name,
          row: rowNumber,
          column: 'nome_testemunha',
          severity: 'error',
          rule: 'Nome da testemunha é obrigatório',
          value: row.nome_testemunha || 'N/A'
        });
        rowValid = false;
      }
      
      // 2. Erro se nenhum CNJ válido na lista
      const cnjsList = row.cnjs_como_testemunha ? parseList(row.cnjs_como_testemunha) : [];
      const validCNJs = cnjsList.filter(cnj => isCNJ20(cnj));
      
      if (validCNJs.length === 0) {
        issues.push({
          sheet: sheet.name,
          row: rowNumber,
          column: 'cnjs_como_testemunha',
          severity: 'error',
          rule: 'Nenhum CNJ válido encontrado',
          value: cnjsList
        });
        rowValid = false;
        
        // Avisos para CNJs inválidos
        cnjsList.forEach(cnj => {
          if (!isCNJ20(cnj)) {
            issues.push({
              sheet: sheet.name,
              row: rowNumber,
              column: 'cnjs_como_testemunha',
              severity: 'warning',
              rule: 'CNJ inválido no array',
              value: cnj
            });
          }
        });
      }
      
      // 3. Avisos para reclamante/réu vazios (não bloqueiam)
      if (!row.reclamante_nome || String(row.reclamante_nome).trim() === '') {
        issues.push({
          sheet: sheet.name,
          row: rowNumber,
          column: 'reclamante_nome',
          severity: 'warning',
          rule: 'Reclamante não informado',
          value: row.reclamante_nome || 'N/A'
        });
      }
      
      if (!row.reu_nome || String(row.reu_nome).trim() === '') {
        issues.push({
          sheet: sheet.name,
          row: rowNumber,
          column: 'reu_nome',
          severity: 'warning',
          rule: 'Réu não informado',
          value: row.reu_nome || 'N/A'
        });
      }
      
    } else if (sheet.model === 'processo') {
      // VALIDAÇÃO MODO PROCESSO
      
      // 1. Erro se reclamante_nome vazio
      if (!row.reclamante_nome || String(row.reclamante_nome).trim() === '') {
        issues.push({
          sheet: sheet.name,
          row: rowNumber,
          column: 'reclamante_nome',
          severity: 'error',
          rule: 'Nome do reclamante é obrigatório',
          value: row.reclamante_nome || 'N/A'
        });
        rowValid = false;
      }
      
      // 2. Erro se reu_nome vazio
      if (!row.reu_nome || String(row.reu_nome).trim() === '') {
        issues.push({
          sheet: sheet.name,
          row: rowNumber,
          column: 'reu_nome',
          severity: 'error',
          rule: 'Nome do réu é obrigatório',
          value: row.reu_nome || 'N/A'
        });
        rowValid = false;
      }
      
      // 3. Erro se CNJ inválido
      if (!row.cnj || !isCNJ20(row.cnj)) {
        issues.push({
          sheet: sheet.name,
          row: rowNumber,
          column: 'cnj',
          severity: 'error',
          rule: 'CNJ deve ter 20 dígitos',
          value: row.cnj || 'N/A'
        });
        rowValid = false;
      }
    }
    
    if (rowValid) {
      validCount++;
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