/**
 * Sistema de Validação Rigorosa ETL
 * Baseado na documentação do produto
 */

import type {
  DetectedSheet,
  ValidationResult as ImporterValidationResult,
  ValidationIssue,
  ValidationSeverity,
} from "@/lib/importer/types";

// Extended interface for validation with full data
export interface ValidationSheet extends DetectedSheet {
  data: any[][]; // Full row data for validation
}

// Tipos para validação
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
  processedData?: ProcessedValidationData;
}

export interface ValidationError {
  type: "BLOQUEANTE" | "CRITICO" | "GRAVE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  sheet?: string;
  row?: number;
  column?: string;
  field?: string;
  message: string;
  suggestion?: string;
  code: string;
}

export interface ValidationWarning {
  type: "ATENCAO" | "TOLERANCIA" | "HOMONIMO";
  severity: "MEDIUM" | "LOW";
  sheet?: string;
  row?: number;
  column?: string;
  field?: string;
  message: string;
  suggestion?: string;
  code: string;
}

export interface ValidationSummary {
  total_sheets: number;
  valid_sheets: number;
  total_rows: number;
  valid_rows: number;
  blocked_by_errors: boolean;
  required_sheets_found: boolean;
  column_mapping_success: boolean;
  integrity_check_passed: boolean;
  homonym_alerts: number;
  lgpd_compliant: boolean;
}

export interface ProcessedValidationData {
  processos: ProcessedProcesso[];
  testemunhas: ProcessedTestemunha[];
  integrity_links: IntegrityLink[];
  homonym_groups: HomonymGroup[];
  column_mappings: ColumnMapping[];
}

export interface ProcessedProcesso {
  row_number: number;
  cnj: string;
  cnj_normalized: string;
  uf: string | null;
  comarca: string | null;
  reclamantes: string[];
  advogados_ativo: string[];
  todas_testemunhas: string[];
  validation_flags: {
    cnj_valid: boolean;
    has_required_fields: boolean;
    lists_parsed: boolean;
  };
}

export interface ProcessedTestemunha {
  row_number: number;
  nome_testemunha: string;
  nome_normalized: string;
  qtd_depoimentos: number;
  cnjs_como_testemunha: string[];
  validation_flags: {
    name_valid: boolean;
    cnjs_valid: boolean;
    quantity_consistent: boolean;
  };
}

export interface IntegrityLink {
  cnj: string;
  exists_in_processos: boolean;
  exists_in_testemunhas: boolean;
  needs_stub_creation: boolean;
}

export interface HomonymGroup {
  nome_base: string;
  variantes: string[];
  probability: "BAIXA" | "MEDIA" | "ALTA";
  score: number;
  factors: {
    comarca_uf_match: number;
    advogado_match: number;
    temporal_proximity: number;
    common_name: boolean;
  };
  cnjs_involved: string[];
}

export interface ColumnMapping {
  sheet: string;
  original_name: string;
  mapped_name: string;
  mapping_type: "EXACT" | "SYNONYM" | "FALLBACK" | "NOT_FOUND";
  confidence: number;
}

/**
 * Engine principal de validação
 */
export class ValidationEngine {
  // Sinônimos aceitos para colunas
  private static readonly COLUMN_SYNONYMS = {
    // Processo
    cnj: ["cnj", "numero_cnj", "processo", "numero_processo"],
    uf: ["uf", "estado", "unidade_federativa"],
    comarca: ["comarca", "municipio", "cidade"],
    reclamantes: [
      "reclamantes",
      "reclamante",
      "autor",
      "autores",
      "requerente",
      "requerentes",
    ],
    advogados_ativo: [
      "advogados_ativo",
      "advogados_parte_ativa",
      "advogados (polo ativo)",
      "advogados polo ativo",
      "advogados_autor",
      "advogados do autor",
    ],
    todas_testemunhas: [
      "todas_testemunhas",
      "testemunhas_todas",
      "testemunhas",
      "todas as testemunhas",
      "lista_testemunhas",
    ],
    testemunhas_ativo: [
      "testemunhas_ativo",
      "testemunhas_autor",
      "testemunhas_parte_ativa",
    ],
    testemunhas_passivo: [
      "testemunhas_passivo",
      "testemunhas_reu",
      "testemunhas_parte_passiva",
    ],

    // Testemunha
    nome_testemunha: ["nome_testemunha", "nome", "testemunha", "nome_completo"],
    qtd_depoimentos: [
      "qtd_depoimentos",
      "quantidade_depoimentos",
      "depoimentos",
      "total_depoimentos",
    ],
    cnjs_como_testemunha: [
      "cnjs_como_testemunha",
      "processos",
      "cnjs",
      "lista_processos",
    ],
  };

  // Nomes comuns que geram alerta de homônimo
  private static readonly COMMON_NAMES = [
    "JOÃO SILVA",
    "MARIA SANTOS",
    "JOSÉ OLIVEIRA",
    "ANA SOUZA",
    "CARLOS FERREIRA",
    "FRANCISCA LIMA",
    "ANTÔNIO COSTA",
    "LUIZA RODRIGUES",
    "MANUEL ALVES",
    "RITA PEREIRA",
    "FRANCISCO BARBOSA",
    "MARIA JOSÉ",
    "JOSÉ CARLOS",
    "ANA MARIA",
    "JOÃO CARLOS",
  ];

  // Campos obrigatórios por sheet
  private static readonly REQUIRED_FIELDS = {
    "Por Processo": [
      "cnj",
      "uf",
      "comarca",
      "advogados_ativo",
      "todas_testemunhas",
    ],
    "Por Testemunha": [
      "nome_testemunha",
      "qtd_depoimentos",
      "cnjs_como_testemunha",
    ],
  };

  /**
   * Validação principal
   */
  static async validateImportData(
    sheets: ValidationSheet[],
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let processedData: ProcessedValidationData | undefined;

    try {
      // 1. Validar abas obrigatórias
      const sheetsValidation = this.validateRequiredSheets(sheets);
      errors.push(...sheetsValidation.errors);
      warnings.push(...sheetsValidation.warnings);

      if (sheetsValidation.blocked) {
        return this.createFailedResult(errors, warnings, sheets);
      }

      // 2. Mapear colunas com tolerância de nomes
      const columnMappings = this.mapColumns(sheets);
      errors.push(...columnMappings.errors);
      warnings.push(...columnMappings.warnings);

      // 3. Validar campos obrigatórios
      const fieldsValidation = this.validateRequiredFields(
        sheets,
        columnMappings.mappings,
      );
      errors.push(...fieldsValidation.errors);
      warnings.push(...fieldsValidation.warnings);

      // 4. Processar e normalizar dados
      const processingResult = this.processAndNormalizeData(
        sheets,
        columnMappings.mappings,
      );
      errors.push(...processingResult.errors);
      warnings.push(...processingResult.warnings);
      processedData = processingResult.data;

      // 5. Validar integridade entre abas
      if (processedData) {
        const integrityValidation = this.validateIntegrity(processedData);
        errors.push(...integrityValidation.errors);
        warnings.push(...integrityValidation.warnings);
        processedData.integrity_links = integrityValidation.links;
      }

      // 6. Detectar homônimos
      if (processedData) {
        const homonymValidation = this.detectHomonyms(processedData);
        warnings.push(...homonymValidation.warnings);
        processedData.homonym_groups = homonymValidation.groups;
      }

      // 7. Validar conformidade LGPD
      const lgpdValidation = this.validateLGPDCompliance(sheets, processedData);
      errors.push(...lgpdValidation.errors);
      warnings.push(...lgpdValidation.warnings);

      const isValid =
        errors.filter((e) => e.type === "BLOQUEANTE").length === 0;

      return {
        isValid,
        errors,
        warnings,
        summary: this.generateSummary(
          sheets,
          processedData,
          errors,
          warnings,
          columnMappings.mappings,
        ),
        processedData: isValid ? processedData : undefined,
      };
    } catch (error) {
      errors.push({
        type: "BLOQUEANTE",
        severity: "HIGH",
        message: `Erro interno na validação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        code: "INTERNAL_ERROR",
      });

      return this.createFailedResult(errors, warnings, sheets);
    }
  }

  /**
   * Validar abas obrigatórias
   */
  private static validateRequiredSheets(sheets: DetectedSheet[]) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const sheetNames = sheets.map((s) => s.name.trim());
    const hasProcessos = sheetNames.some(
      (name) =>
        name.toLowerCase().includes("processo") ||
        name.toLowerCase() === "por processo",
    );
    const hasTestemunhas = sheetNames.some(
      (name) =>
        name.toLowerCase().includes("testemunha") ||
        name.toLowerCase() === "por testemunha",
    );

    if (!hasProcessos) {
      errors.push({
        type: "BLOQUEANTE",
        severity: "HIGH",
        message: 'Aba obrigatória "Por Processo" não encontrada',
        suggestion:
          'Certifique-se de que existe uma aba com nome "Por Processo" ou similar',
        code: "MISSING_PROCESSOS_SHEET",
      });
    }

    if (!hasTestemunhas) {
      errors.push({
        type: "BLOQUEANTE",
        severity: "HIGH",
        message: 'Aba obrigatória "Por Testemunha" não encontrada',
        suggestion:
          'Certifique-se de que existe uma aba com nome "Por Testemunha" ou similar',
        code: "MISSING_TESTEMUNHAS_SHEET",
      });
    }

    return {
      errors,
      warnings,
      blocked: errors.length > 0,
    };
  }

  /**
   * Mapear colunas com tolerância de nomes
   */
  private static mapColumns(sheets: DetectedSheet[]) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const mappings: ColumnMapping[] = [];

    sheets.forEach((sheet) => {
      const sheetType = this.detectSheetType(sheet.name);
      if (!sheetType) return;

      const requiredFields = this.REQUIRED_FIELDS[sheetType];

      requiredFields.forEach((requiredField) => {
        const mapping = this.findColumnMapping(sheet.headers, requiredField);

        if (mapping.mapping_type === "NOT_FOUND") {
          errors.push({
            type: "BLOQUEANTE",
            severity: "HIGH",
            sheet: sheet.name,
            field: requiredField,
            message: `Campo obrigatório "${requiredField}" não localizado`,
            suggestion: `Verifique se existe uma coluna similar a: ${this.COLUMN_SYNONYMS[requiredField as keyof typeof this.COLUMN_SYNONYMS]?.join(", ")}`,
            code: "REQUIRED_FIELD_NOT_FOUND",
          });
        } else if (
          mapping.mapping_type === "SYNONYM" ||
          mapping.mapping_type === "FALLBACK"
        ) {
          warnings.push({
            type: "TOLERANCIA",
            severity: "LOW",
            sheet: sheet.name,
            column: mapping.original_name,
            field: requiredField,
            message: `Campo "${mapping.original_name}" mapeado para "${requiredField}" por tolerância`,
            code: "COLUMN_MAPPED_BY_TOLERANCE",
          });
        }

        mappings.push({
          sheet: sheet.name,
          original_name: mapping.original_name,
          mapped_name: requiredField,
          mapping_type: mapping.mapping_type,
          confidence: mapping.confidence,
        });
      });
    });

    return { errors, warnings, mappings };
  }

  /**
   * Encontrar mapeamento de coluna
   */
  private static findColumnMapping(
    headers: string[],
    requiredField: string,
  ): ColumnMapping {
    const synonyms =
      this.COLUMN_SYNONYMS[
        requiredField as keyof typeof this.COLUMN_SYNONYMS
      ] || [];

    // Busca exata
    for (const header of headers) {
      if (header.toLowerCase().trim() === requiredField.toLowerCase()) {
        return {
          sheet: "",
          original_name: header,
          mapped_name: requiredField,
          mapping_type: "EXACT",
          confidence: 100,
        };
      }
    }

    // Busca por sinônimos
    for (const synonym of synonyms) {
      for (const header of headers) {
        if (header.toLowerCase().trim() === synonym.toLowerCase()) {
          return {
            sheet: "",
            original_name: header,
            mapped_name: requiredField,
            mapping_type: "SYNONYM",
            confidence: 90,
          };
        }
      }
    }

    // Busca fuzzy (contém)
    for (const synonym of synonyms) {
      for (const header of headers) {
        if (
          header.toLowerCase().includes(synonym.toLowerCase()) ||
          synonym.toLowerCase().includes(header.toLowerCase().trim())
        ) {
          return {
            sheet: "",
            original_name: header,
            mapped_name: requiredField,
            mapping_type: "FALLBACK",
            confidence: 70,
          };
        }
      }
    }

    return {
      sheet: "",
      original_name: "",
      mapped_name: requiredField,
      mapping_type: "NOT_FOUND",
      confidence: 0,
    };
  }

  /**
   * Validar campos obrigatórios
   */
  private static validateRequiredFields(
    sheets: DetectedSheet[],
    mappings: ColumnMapping[],
  ) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    sheets.forEach((sheet) => {
      const sheetType = this.detectSheetType(sheet.name);
      if (!sheetType) return;

      const sheetMappings = mappings.filter((m) => m.sheet === sheet.name);
      const requiredFields = this.REQUIRED_FIELDS[sheetType];

      // Verificar se todos os campos obrigatórios foram mapeados
      const missingFields = requiredFields.filter(
        (field) =>
          !sheetMappings.some(
            (m) => m.mapped_name === field && m.mapping_type !== "NOT_FOUND",
          ),
      );

      missingFields.forEach((field) => {
        errors.push({
          type: "BLOQUEANTE",
          severity: "HIGH",
          sheet: sheet.name,
          field,
          message: `Campo obrigatório "${field}" ausente ou não mapeável`,
          code: "MISSING_REQUIRED_FIELD",
        });
      });
    });

    return { errors, warnings };
  }

  /**
   * Processar e normalizar dados
   */
  private static processAndNormalizeData(
    sheets: ValidationSheet[],
    mappings: ColumnMapping[],
  ) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const processos: ProcessedProcesso[] = [];
    const testemunhas: ProcessedTestemunha[] = [];

    // Processar aba de processos
    const processosSheet = this.findSheetByType(sheets, "Por Processo");
    if (processosSheet) {
      const processosResult = this.processProcessosSheet(
        processosSheet,
        mappings,
      );
      errors.push(...processosResult.errors);
      warnings.push(...processosResult.warnings);
      processos.push(...processosResult.data);
    }

    // Processar aba de testemunhas
    const testemunhasSheet = this.findSheetByType(sheets, "Por Testemunha");
    if (testemunhasSheet) {
      const testemunhasResult = this.processTestemunhasSheet(
        testemunhasSheet,
        mappings,
      );
      errors.push(...testemunhasResult.errors);
      warnings.push(...testemunhasResult.warnings);
      testemunhas.push(...testemunhasResult.data);
    }

    return {
      errors,
      warnings,
      data: {
        processos,
        testemunhas,
        integrity_links: [],
        homonym_groups: [],
        column_mappings: mappings,
      },
    };
  }

  /**
   * Processar aba de processos
   */
  private static processProcessosSheet(
    sheet: ValidationSheet,
    mappings: ColumnMapping[],
  ) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const data: ProcessedProcesso[] = [];

    const sheetMappings = mappings.filter((m) => m.sheet === sheet.name);

    sheet.data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque index 0 é header e rows começam em 1

      try {
        // Extrair dados usando mapeamentos
        const cnj = this.extractMappedValue(
          row,
          "cnj",
          sheetMappings,
          sheet.headers,
        );
        const uf = this.extractMappedValue(
          row,
          "uf",
          sheetMappings,
          sheet.headers,
        );
        const comarca = this.extractMappedValue(
          row,
          "comarca",
          sheetMappings,
          sheet.headers,
        );
        const reclamantes = this.parseListField(
          this.extractMappedValue(
            row,
            "reclamantes",
            sheetMappings,
            sheet.headers,
          ) || "",
        );
        const advogados_ativo = this.parseListField(
          this.extractMappedValue(
            row,
            "advogados_ativo",
            sheetMappings,
            sheet.headers,
          ) || "",
        );
        const todas_testemunhas = this.parseListField(
          this.extractMappedValue(
            row,
            "todas_testemunhas",
            sheetMappings,
            sheet.headers,
          ) || "",
        );

        // Validações específicas
        const cnjValid = this.validateCNJ(cnj ?? "");
        const hasRequiredFields = !!(
          cnj &&
          uf &&
          comarca &&
          advogados_ativo.length > 0
        );

        if (!cnjValid && cnj) {
          warnings.push({
            type: "ATENCAO",
            severity: "MEDIUM",
            sheet: sheet.name,
            row: rowNumber,
            field: "cnj",
            message: `CNJ "${cnj}" com formato inválido`,
            code: "INVALID_CNJ_FORMAT",
          });
        }

        if (!hasRequiredFields) {
          errors.push({
            type: "GRAVE",
            severity: "MEDIUM",
            sheet: sheet.name,
            row: rowNumber,
            message: "Processo sem campos obrigatórios preenchidos",
            code: "MISSING_PROCESSO_REQUIRED_DATA",
          });
        }

        data.push({
          row_number: rowNumber,
          cnj: cnj || "",
          cnj_normalized: this.normalizeCNJ(cnj || ""),
          uf,
          comarca,
          reclamantes,
          advogados_ativo,
          todas_testemunhas,
          validation_flags: {
            cnj_valid: cnjValid,
            has_required_fields: hasRequiredFields,
            lists_parsed: true,
          },
        });
      } catch (error) {
        errors.push({
          type: "GRAVE",
          severity: "HIGH",
          sheet: sheet.name,
          row: rowNumber,
          message: `Erro ao processar linha: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          code: "ROW_PROCESSING_ERROR",
        });
      }
    });

    return { errors, warnings, data };
  }

  /**
   * Processar aba de testemunhas
   */
  private static processTestemunhasSheet(
    sheet: ValidationSheet,
    mappings: ColumnMapping[],
  ) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const data: ProcessedTestemunha[] = [];

    const sheetMappings = mappings.filter((m) => m.sheet === sheet.name);

    sheet.data.forEach((row, index) => {
      const rowNumber = index + 2;

      try {
        const nome_testemunha = this.extractMappedValue(
          row,
          "nome_testemunha",
          sheetMappings,
          sheet.headers,
        );
        const qtd_depoimentos = parseInt(
          this.extractMappedValue(
            row,
            "qtd_depoimentos",
            sheetMappings,
            sheet.headers,
          ) || "0",
        );
        const cnjs_como_testemunha = this.parseListField(
          this.extractMappedValue(
            row,
            "cnjs_como_testemunha",
            sheetMappings,
            sheet.headers,
          ) || "",
        );

        // Validações específicas
        const nameValid = !!(
          nome_testemunha && nome_testemunha.trim().length > 0
        );
        const cnjsValid = cnjs_como_testemunha.every((cnj) =>
          this.validateCNJ(cnj),
        );
        const quantityConsistent =
          qtd_depoimentos === cnjs_como_testemunha.length;

        if (!nameValid && nome_testemunha) {
          errors.push({
            type: "GRAVE",
            severity: "MEDIUM",
            sheet: sheet.name,
            row: rowNumber,
            field: "nome_testemunha",
            message: "Nome da testemunha inválido ou vazio",
            code: "INVALID_TESTEMUNHA_NAME",
          });
        }

        if (!quantityConsistent) {
          warnings.push({
            type: "ATENCAO",
            severity: "LOW",
            sheet: sheet.name,
            row: rowNumber,
            message: `Quantidade de depoimentos (${qtd_depoimentos}) não confere com CNJs listados (${cnjs_como_testemunha.length})`,
            code: "QUANTITY_MISMATCH",
          });
        }

        data.push({
          row_number: rowNumber,
          nome_testemunha: nome_testemunha || "",
          nome_normalized: this.normalizeName(nome_testemunha || ""),
          qtd_depoimentos,
          cnjs_como_testemunha,
          validation_flags: {
            name_valid: nameValid,
            cnjs_valid: cnjsValid,
            quantity_consistent: quantityConsistent,
          },
        });
      } catch (error) {
        errors.push({
          type: "GRAVE",
          severity: "HIGH",
          sheet: sheet.name,
          row: rowNumber,
          message: `Erro ao processar linha: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          code: "ROW_PROCESSING_ERROR",
        });
      }
    });

    return { errors, warnings, data };
  }

  /**
   * Validar integridade entre abas
   */
  private static validateIntegrity(data: ProcessedValidationData) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const links: IntegrityLink[] = [];

    // Coletar todos os CNJs únicos
    const cnjsFromProcessos = new Set(
      data.processos.map((p) => p.cnj_normalized).filter(Boolean),
    );
    const cnjsFromTestemunhas = new Set(
      data.testemunhas.flatMap((t) =>
        t.cnjs_como_testemunha.map(this.normalizeCNJ),
      ),
    );

    const allCnjs = new Set([...cnjsFromProcessos, ...cnjsFromTestemunhas]);

    // Verificar integridade
    allCnjs.forEach((cnj) => {
      const existsInProcessos = cnjsFromProcessos.has(cnj);
      const existsInTestemunhas = cnjsFromTestemunhas.has(cnj);

      links.push({
        cnj,
        exists_in_processos: existsInProcessos,
        exists_in_testemunhas: existsInTestemunhas,
        needs_stub_creation: !existsInProcessos && existsInTestemunhas,
      });

      if (!existsInProcessos && existsInTestemunhas) {
        warnings.push({
          type: "ATENCAO",
          severity: "MEDIUM",
          message: `CNJ "${cnj}" presente em testemunhas mas ausente em processos - será criado stub`,
          suggestion: "Verifique se o processo não deveria estar na planilha",
          code: "MISSING_PROCESSO_FOR_CNJ",
        });
      }
    });

    return { errors, warnings, links };
  }

  /**
   * Detectar homônimos
   */
  private static detectHomonyms(data: ProcessedValidationData) {
    const warnings: ValidationWarning[] = [];
    const groups: HomonymGroup[] = [];

    // Agrupar nomes similares
    const nameGroups = new Map<string, string[]>();

    data.testemunhas.forEach((t) => {
      const baseName = this.extractBaseName(t.nome_normalized);
      if (!nameGroups.has(baseName)) {
        nameGroups.set(baseName, []);
      }
      nameGroups.get(baseName)!.push(t.nome_testemunha);
    });

    // Analisar grupos com múltiplas variantes
    nameGroups.forEach((variantes, baseName) => {
      if (
        variantes.length > 1 ||
        this.COMMON_NAMES.some((common) => baseName.includes(common))
      ) {
        const score = this.calculateHomonymScore(baseName, variantes, data);
        const probability =
          score >= 80 ? "ALTA" : score >= 50 ? "MEDIA" : "BAIXA";

        if (score >= 30) {
          const cnjs = this.getCNJsForNames(variantes, data);

          groups.push({
            nome_base: baseName,
            variantes,
            probability,
            score,
            factors: this.calculateHomonymFactors(variantes, data),
            cnjs_involved: cnjs,
          });

          warnings.push({
            type: "HOMONIMO",
            severity: probability === "ALTA" ? "MEDIUM" : "LOW",
            message: `Possível homônimo detectado: "${baseName}" (${probability.toLowerCase()} probabilidade, score: ${score})`,
            suggestion:
              "Verificar identidade através de CPF/documentos nos autos",
            code: "POTENTIAL_HOMONYM",
          });
        }
      }
    });

    return { warnings, groups };
  }

  /**
   * Validar conformidade LGPD
   */
  private static validateLGPDCompliance(
    sheets: ValidationSheet[],
    _data?: ProcessedValidationData,
  ) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Verificar se há CPF completo exposto
    sheets.forEach((sheet) => {
      sheet.headers.forEach((header) => {
        if (
          header.toLowerCase().includes("cpf") &&
          !header.toLowerCase().includes("mask")
        ) {
          warnings.push({
            type: "ATENCAO",
            severity: "MEDIUM",
            sheet: sheet.name,
            column: header,
            message:
              "Coluna de CPF detectada - verificar se não contém dados completos",
            suggestion: "Use apenas CPF mascarado (ex: 123.***.***-45)",
            code: "LGPD_CPF_EXPOSURE_RISK",
          });
        }
      });

      // Verificar dados nas linhas
      sheet.data.forEach((row, index) => {
        row.forEach((cell, cellIndex) => {
          if (typeof cell === "string" && this.isPotentialCPF(cell)) {
            warnings.push({
              type: "ATENCAO",
              severity: "MEDIUM",
              sheet: sheet.name,
              row: index + 2,
              column: sheet.headers[cellIndex],
              message: "Possível CPF completo detectado",
              suggestion: "Substituir por versão mascarada",
              code: "LGPD_CPF_DETECTED",
            });
          }
        });
      });
    });

    return { errors, warnings };
  }

  // Métodos auxiliares
  private static detectSheetType(
    sheetName: string,
  ): keyof typeof ValidationEngine.REQUIRED_FIELDS | null {
    const name = sheetName.toLowerCase().trim();
    if (name.includes("processo") || name === "por processo")
      return "Por Processo";
    if (name.includes("testemunha") || name === "por testemunha")
      return "Por Testemunha";
    return null;
  }

  private static findSheetByType(
    sheets: ValidationSheet[],
    type: string,
  ): ValidationSheet | null {
    return sheets.find((s) => this.detectSheetType(s.name) === type) || null;
  }

  private static extractMappedValue(
    row: any[],
    field: string,
    mappings: ColumnMapping[],
    headers: string[],
  ): string | null {
    const mapping = mappings.find((m) => m.mapped_name === field);
    if (!mapping || mapping.mapping_type === "NOT_FOUND") return null;

    const columnIndex = headers.findIndex((h) => h === mapping.original_name);
    if (columnIndex === -1) return null;

    const value = row[columnIndex];
    return value ? String(value).trim() : null;
  }

  private static parseListField(value: string): string[] {
    if (!value) return [];

    // Remover colchetes, aspas e dividir por separadores
    const cleaned = value.replace(/[\[\]"']/g, "").trim();
    if (!cleaned) return [];

    return cleaned
      .split(/[;,\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicatas
  }

  private static validateCNJ(cnj: string): boolean {
    if (!cnj) return false;
    const digits = cnj.replace(/\D/g, "");
    return digits.length === 20;
  }

  private static normalizeCNJ(cnj: string): string {
    return cnj.replace(/\D/g, "").slice(0, 20);
  }

  private static normalizeName(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
  }

  private static extractBaseName(normalizedName: string): string {
    // Extrair primeiro e último nome para agrupamento
    const parts = normalizedName.split(" ").filter((p) => p.length > 2);
    if (parts.length <= 2) return normalizedName;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }

  private static calculateHomonymScore(
    baseName: string,
    variantes: string[],
    data: ProcessedValidationData,
  ): number {
    let score = 0;

    // Score base para nomes comuns
    if (this.COMMON_NAMES.some((common) => baseName.includes(common))) {
      score += 40;
    }

    // Score por múltiplas variantes
    score += Math.min(variantes.length * 15, 30);

    // Score por CNJs em comum (indica possível mesma pessoa)
    const allCNJs = variantes.flatMap((nome) => {
      const testemunha = data.testemunhas.find(
        (t) => t.nome_testemunha === nome,
      );
      return testemunha?.cnjs_como_testemunha || [];
    });
    const uniqueCNJs = new Set(allCNJs);
    const commonCNJs = allCNJs.length - uniqueCNJs.size;
    score += Math.min(commonCNJs * 10, 20);

    return Math.min(score, 100);
  }

  private static calculateHomonymFactors(
    variantes: string[],
    _data: ProcessedValidationData,
  ) {
    // Implementação simplificada - em produção seria mais complexa
    return {
      comarca_uf_match: 0,
      advogado_match: 0,
      temporal_proximity: 0,
      common_name: this.COMMON_NAMES.some((common) =>
        variantes.some((v) => v.includes(common)),
      ),
    };
  }

  private static getCNJsForNames(
    nomes: string[],
    data: ProcessedValidationData,
  ): string[] {
    const cnjs = nomes.flatMap((nome) => {
      const testemunha = data.testemunhas.find(
        (t) => t.nome_testemunha === nome,
      );
      return testemunha?.cnjs_como_testemunha || [];
    });
    return [...new Set(cnjs)];
  }

  private static isPotentialCPF(value: string): boolean {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11 && !value.includes("*");
  }

  private static generateSummary(
    sheets: ValidationSheet[],
    data?: ProcessedValidationData,
    errors: ValidationError[] = [],
    warnings: ValidationWarning[] = [],
    mappings: ColumnMapping[] = [],
  ): ValidationSummary {
    const totalRows = sheets.reduce(
      (sum, sheet) => sum + (sheet.data?.length || 0),
      0,
    );
    const validRows = data
      ? data.processos.length + data.testemunhas.length
      : 0;
    const homonymAlerts = warnings.filter((w) => w.type === "HOMONIMO").length;
    const lgpdCompliant =
      !errors.some((e) => e.code.includes("LGPD")) &&
      !warnings.some((w) => w.code.includes("LGPD") && w.severity === "MEDIUM");

    return {
      total_sheets: sheets.length,
      valid_sheets: sheets.filter((s) => this.detectSheetType(s.name)).length,
      total_rows: totalRows,
      valid_rows: validRows,
      blocked_by_errors: errors.some((e) => e.type === "BLOQUEANTE"),
      required_sheets_found: sheets.length >= 2,
      column_mapping_success: mappings.every(
        (m) => m.mapping_type !== "NOT_FOUND",
      ),
      integrity_check_passed:
        data?.integrity_links.every(
          (l) => l.exists_in_processos || l.needs_stub_creation,
        ) ?? false,
      homonym_alerts: homonymAlerts,
      lgpd_compliant: lgpdCompliant,
    };
  }

  private static createFailedResult(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    sheets: ValidationSheet[],
  ): ValidationResult {
    return {
      isValid: false,
      errors,
      warnings,
      summary: this.generateSummary(sheets, undefined, errors, warnings),
      processedData: undefined,
    };
  }
}
