import {
  ImporterProcessoRow,
  ImporterTestemunhaRow,
  DetectedSheet,
  OrgSettings,
} from "@/lib/importer/types";
import Papa from "papaparse";
import { validateCNJ, cleanCNJ } from "@/lib/validation/unified-cnj";
import { resolveFieldName } from "@/etl/synonyms";

/**
 * Maps raw headers to expected field names using synonym mapping
 */
function mapHeaders(
  headers: string[],
  sheetModel: "processo" | "testemunha",
): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    const canonicalField = resolveFieldName(header);
    if (canonicalField) {
      mapping[canonicalField] = header;
    } else {
      // Keep original header for unmapped fields
      mapping[header] = header;
    }
  });

  return mapping;
}

/**
 * Aplica configurações padrão da organização
 */
function applyOrgDefaults(row: any, settings: OrgSettings | null): any {
  if (!settings) return row;

  const result = { ...row };

  // Auto-preenchimento do réu
  if (
    (!result.reu_nome || result.reu_nome.trim() === "") &&
    settings.applyDefaultReuOnTestemunha &&
    settings.defaultReuNome
  ) {
    result.reu_nome = settings.defaultReuNome;
    result.__autofill = { ...(result.__autofill || {}), reu_nome: true };
  }

  return result;
}

/**
 * Normalizes processo data from detected sheet
 * Maps to processos table structure
 */
function normalizeProcessoData(
  sheet: DetectedSheet,
  rawData: any[],
  orgSettings: OrgSettings | null,
): ImporterProcessoRow[] {
  const headerMap = mapHeaders(sheet.headers, "processo");

  return rawData
    .map((row, index) => {
      const mapped: any = {};

      // Map all available fields
      Object.entries(headerMap).forEach(([canonical, original]) => {
        mapped[canonical] = row[original];
      });

      // Apply org defaults
      applyOrgDefaults(mapped, orgSettings);

      // Clean and format CNJ using unified validation
      const cnjRaw = mapped.cnj || "";
      const cnjValidation = validateCNJ(cnjRaw, "correction");
      const processedCNJ = cnjValidation.cleaned;

      // Build ImporterProcessoRow object
      const processo: ImporterProcessoRow = {
        cnj: processedCNJ,
        cnj_digits: cleanCNJ(processedCNJ),
        reclamante_nome: mapped.reclamante_nome || "",
        reu_nome: mapped.reu_nome || "",
        comarca: mapped.comarca || "",
        tribunal: mapped.tribunal || "",
        vara: mapped.vara || "",
        fase: mapped.fase || "",
        status: mapped.status || "",
        observacoes: mapped.observacoes || "",
      };

      return processo;
    })
    .filter((processo) => {
      // Filter using unified CNJ validation - preserve more data
      const cnjValidation = validateCNJ(processo.cnj, "correction");
      const hasEssentialData = processo.reclamante_nome || processo.reu_nome;

      return cnjValidation.isValid || hasEssentialData;
    });
}

/**
 * Normalizes testemunha data from detected sheet
 * Maps to testemunhas table structure - legacy support
 */
function normalizeTestemunhaData(
  sheet: DetectedSheet,
  rawData: any[],
  orgSettings: OrgSettings | null,
): ImporterTestemunhaRow[] {
  const headerMap = mapHeaders(sheet.headers, "testemunha");

  return rawData.map((row) => {
    const mapped: any = {};

    // Map available fields
    Object.entries(headerMap).forEach(([canonical, original]) => {
      mapped[canonical] = row[original];
    });

    // Apply org defaults
    applyOrgDefaults(mapped, orgSettings);

    return {
      cnj: mapped.cnj || "",
      cnj_digits: cleanCNJ(mapped.cnj || ""),
      nome_testemunha: mapped.nome_testemunha || "",
      reclamante_nome: mapped.reclamante_nome || "",
      reu_nome: mapped.reu_nome || "",
      observacoes: mapped.observacoes || "",
    };
  });
}

/**
 * Loads raw data from file for a specific sheet
 */
async function loadRawData(file: File, sheet: DetectedSheet): Promise<any[]> {
  if (file.name.endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: reject,
      });
    });
  }

  const XLSX = await import("xlsx");
  return new Promise((resolve, reject) => {
    // Excel file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[sheet.name];

        if (!worksheet) {
          reject(new Error(`Sheet "${sheet.name}" not found`));
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);

        const objectData = rows.map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = (row as any)[index];
          });
          return obj;
        });

        resolve(objectData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Main normalization function
 * Prioritizes processo data over testemunha for the new system
 */
export async function normalizeSheetData(
  file: File,
  sheet: DetectedSheet,
  orgSettings: OrgSettings | null = null,
): Promise<{
  processos?: ImporterProcessoRow[];
  testemunhas?: ImporterTestemunhaRow[];
}> {
  const rawData = await loadRawData(file, sheet);

  if (sheet.model === "processo") {
    const processos = normalizeProcessoData(sheet, rawData, orgSettings);
    return { processos };
  } else if (sheet.model === "testemunha") {
    const testemunhas = normalizeTestemunhaData(sheet, rawData, orgSettings);
    return { testemunhas };
  } else {
    // For ambiguous sheets, try to detect based on content
    const hasProcessoFields = sheet.headers.some((h) =>
      ["comarca", "tribunal", "vara", "status"].some((f) =>
        h.toLowerCase().includes(f),
      ),
    );

    if (hasProcessoFields) {
      const processos = normalizeProcessoData(sheet, rawData, orgSettings);
      return { processos };
    } else {
      const testemunhas = normalizeTestemunhaData(sheet, rawData, orgSettings);
      return { testemunhas };
    }
  }
}
