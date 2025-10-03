import { TestemunhaRowSchema, ProcessoRowSchema } from "@/lib/importer/types";
import { normalizeSheetData } from "@/lib/importer/normalize";
import type {
  ImportSession,
  ValidationResult,
  ValidationIssue,
  ValidationSummary,
  OrgSettings,
} from "@/lib/importer/types";

/**
 * Configurações padrão da organização (mock)
 */
const getMockOrgSettings = (): OrgSettings => ({
  orgId: "default",
  defaultReuNome: "Empresa Padrão Ltda",
  applyDefaultReuOnTestemunha: true,
  requireReuOnProcesso: true,
  updatedAt: new Date(),
});

/**
 * Valida dados normalizados usando Zod
 */
function validateNormalizedData(
  normalizedData: any,
  sheetName: string,
): { issues: ValidationIssue[]; validCount: number } {
  const issues: ValidationIssue[] = [];
  let validCount = 0;

  // Valida testemunhas
  if (normalizedData.testemunhas) {
    for (let i = 0; i < normalizedData.testemunhas.length; i++) {
      const row = normalizedData.testemunhas[i];
      const result = TestemunhaRowSchema.safeParse(row);

      if (result.success) {
        validCount++;

        // Warnings para campos opcionais
        if (!row.reclamante_nome) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: "reclamante_nome",
            severity: "warning",
            rule: "Nome do reclamante não informado",
            value: row.reclamante_nome,
          });
        }

        if (!row.reu_nome && !row.__autofill?.reu_nome) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: "reu_nome",
            severity: "warning",
            rule: "Nome do réu não informado",
            value: row.reu_nome,
          });
        }

        // Info para auto-preenchimentos
        if (row.__autofill?.reu_nome) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: "reu_nome",
            severity: "info",
            rule: "Auto-preenchido via Réu padrão da organização",
            value: row.reu_nome,
            autofilled: true,
          });
        }
      } else {
        // Erros de validação
        for (const issue of result.error.issues) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: issue.path[0] as string,
            severity: "error",
            rule: issue.message,
            value: row[issue.path[0] as string],
          });
        }
      }
    }
  }

  // Valida processos
  if (normalizedData.processos) {
    for (let i = 0; i < normalizedData.processos.length; i++) {
      const row = normalizedData.processos[i];
      const result = ProcessoRowSchema.safeParse(row);

      if (result.success) {
        validCount++;

        // Info para auto-preenchimentos
        if (row.__autofill?.reu_nome) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: "reu_nome",
            severity: "info",
            rule: "Auto-preenchido via Réu padrão da organização",
            value: row.reu_nome,
            autofilled: true,
          });
        }

        // Warnings para campos importantes
        if (!row.comarca) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: "comarca",
            severity: "warning",
            rule: "Comarca não informada",
            value: row.comarca,
          });
        }

        if (!row.status) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: "status",
            severity: "warning",
            rule: "Status do processo não informado",
            value: row.status,
          });
        }
      } else {
        // Erros de validação
        for (const issue of result.error.issues) {
          issues.push({
            sheet: sheetName,
            row: i + 1,
            column: issue.path[0] as string,
            severity: "error",
            rule: issue.message,
            value: row[issue.path[0] as string],
          });
        }
      }
    }
  }

  return { issues, validCount };
}

/**
 * Detecta CNJs duplicados
 */
function detectDuplicates(
  normalizedData: any,
  sheetName: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenCNJs = new Set<string>();

  // Verifica duplicatas em testemunhas
  if (normalizedData.testemunhas) {
    for (let i = 0; i < normalizedData.testemunhas.length; i++) {
      const row = normalizedData.testemunhas[i];
      const key = `${row.cnj_digits}_${row.nome_testemunha}`;

      if (seenCNJs.has(key)) {
        issues.push({
          sheet: sheetName,
          row: i + 1,
          column: "cnj + nome_testemunha",
          severity: "warning",
          rule: "Combinação CNJ + Testemunha duplicada",
          value: `${row.cnj} | ${row.nome_testemunha}`,
        });
      } else {
        seenCNJs.add(key);
      }
    }
  }

  // Verifica duplicatas em processos
  if (normalizedData.processos) {
    const processCNJs = new Set<string>();
    for (let i = 0; i < normalizedData.processos.length; i++) {
      const row = normalizedData.processos[i];

      if (processCNJs.has(row.cnj_digits)) {
        issues.push({
          sheet: sheetName,
          row: i + 1,
          column: "cnj",
          severity: "warning",
          rule: "CNJ de processo duplicado",
          value: row.cnj,
        });
      } else {
        processCNJs.add(row.cnj_digits);
      }
    }
  }

  return issues;
}

/**
 * Função principal de validação
 */
export async function normalizeAndValidate(
  session: ImportSession,
  autoCorrections: {
    explodeLists: boolean;
    standardizeCNJ: boolean;
    applyDefaultReu: boolean;
  },
): Promise<Omit<ValidationResult, "downloadUrls">> {
  const orgSettings = getMockOrgSettings();
  const allIssues: ValidationIssue[] = [];
  let totalAnalyzed = 0;
  let totalValid = 0;

  const normalizedData: { processos?: any[]; testemunhas?: any[] } = {
    processos: [],
    testemunhas: [],
  };

  // Processa cada sheet
  for (const sheet of session.sheets) {
    try {
      // Simula carregamento do arquivo (em produção seria do storage)
      const mockFile = new File(["mock"], session.fileName);

      // Normaliza dados da sheet
      const sheetData = await normalizeSheetData(
        mockFile,
        sheet,
        autoCorrections.applyDefaultReu ? orgSettings : null,
      );

      // Acumula dados normalizados - prioriza processos
      if (sheetData.processos) {
        normalizedData.processos!.push(...sheetData.processos);
        totalAnalyzed += sheetData.processos.length;
      }

      if (sheetData.testemunhas) {
        normalizedData.testemunhas!.push(...sheetData.testemunhas);
        totalAnalyzed += sheetData.testemunhas.length;
      }

      // Valida dados
      const { issues: validationIssues, validCount } = validateNormalizedData(
        sheetData,
        sheet.name,
      );
      allIssues.push(...validationIssues);
      totalValid += validCount;

      // Detecta duplicatas
      const duplicateIssues = detectDuplicates(sheetData, sheet.name);
      allIssues.push(...duplicateIssues);
    } catch (error) {
      allIssues.push({
        sheet: sheet.name,
        row: 0,
        column: "Sistema",
        severity: "error",
        rule: "Erro ao processar sheet",
        value: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  // Calcula estatísticas
  const summary: ValidationSummary = {
    analyzed: totalAnalyzed,
    valid: totalValid,
    errors: allIssues.filter((i) => i.severity === "error").length,
    warnings: allIssues.filter((i) => i.severity === "warning").length,
    infos: allIssues.filter((i) => i.severity === "info").length,
  };

  return {
    summary,
    issues: allIssues,
    normalizedData: {
      processos: normalizedData.processos?.length
        ? normalizedData.processos
        : undefined,
      testemunhas: normalizedData.testemunhas?.length
        ? normalizedData.testemunhas
        : undefined,
    },
  };
}
