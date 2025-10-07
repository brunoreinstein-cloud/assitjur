import Papa from "papaparse";
import { DetectedSheet, SheetModel } from "@/lib/importer/types";
import {
  toSlugCase,
  detectCsvSeparator,
} from "@/lib/importer/utils";

/**
 * Detecta modelo da aba baseado em MAPEAMENTO EXATO de colunas
 * Implementa as regras exatas especificadas pelo usuário
 */
function detectSheetModel(headers: string[]): SheetModel {
  const normalizedHeaders = headers.map((h) => toSlugCase(h));

  // MAPEAMENTO EXATO: nome_testemunha SOMENTE de Nome_Testemunha
  const hasNomeTestemunha = normalizedHeaders.includes("nome_testemunha");

  // MAPEAMENTO EXATO: cnjs_como_testemunha SOMENTE de CNJs_Como_Testemunha
  const hasTestemunhaList = normalizedHeaders.includes("cnjs_como_testemunha");

  // CNJ individual (para modelo processo)
  const hasCNJ = normalizedHeaders.includes("cnj");

  // Modelo testemunha: DEVE ter ambos campos exatos
  if (hasTestemunhaList && hasNomeTestemunha) {
    return "testemunha";
  }

  // Modelo processo: tem CNJ mas não lista de testemunhas
  if (hasCNJ && !hasTestemunhaList) {
    return "processo";
  }

  // Ambíguo: tem CNJ e lista de testemunhas (forçar diálogo)
  if (hasCNJ && hasTestemunhaList) {
    return "ambiguous";
  }

  // Default baseado na presença de CNJ
  return hasCNJ ? "processo" : "testemunha";
}

/**
 * Processa arquivo XLSX
 */
async function processXlsxFile(file: File): Promise<DetectedSheet[]> {
  const XLSX = await import("xlsx");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheets: DetectedSheet[] = [];

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as unknown[][];

          if (jsonData.length === 0) continue;

          const headers = ((jsonData[0] as unknown[]) || []).filter((h): h is string => typeof h === "string");
          const dataRows = jsonData.slice(1);

          // Filtra colunas que começam com CNJ_ (conforme regra)
          const filteredHeaders = headers.filter((h) => {
            const normalized = toSlugCase(h);
            return !normalized.startsWith("cnj_") || normalized === "cnj";
          });

          const model = detectSheetModel(filteredHeaders);

          // Amostra dos dados (primeiras 5 linhas)
          const sampleData = dataRows.slice(0, 5).map((row) => {
            const obj: Record<string, unknown> = {};
            const rowArray = row as unknown[];
            filteredHeaders.forEach((header) => {
              if (typeof header === "string") {
                obj[header] = rowArray[headers.indexOf(header)];
              }
            });
            return obj;
          });

          // Verifica se tem coluna de lista EXATA (cnjs_como_testemunha)
          const hasListColumn = filteredHeaders.some((h) =>
            typeof h === "string" ? toSlugCase(h) === "cnjs_como_testemunha" : false,
          );

          sheets.push({
            name: sheetName,
            model,
            rows: dataRows.length,
            headers: filteredHeaders,
            sampleData,
            hasListColumn,
          });
        }

        resolve(sheets);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo XLSX: ${error}`));
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Processa arquivo CSV
 */
function processCsvFile(file: File): Promise<DetectedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const separator = detectCsvSeparator(text);

        Papa.parse(text, {
          delimiter: separator,
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as string[][];

            if (data.length === 0) {
              resolve([]);
              return;
            }

            const headers = data[0] || [];
            const dataRows = data.slice(1);

            // Filtra colunas CNJ_
            const filteredHeaders = headers.filter((h) => {
              const normalized = toSlugCase(h);
              return !normalized.startsWith("cnj_") || normalized === "cnj";
            });

            const model = detectSheetModel(filteredHeaders);

            const sampleData = dataRows.slice(0, 5).map((row) => {
              const obj: Record<string, any> = {};
              filteredHeaders.forEach((header) => {
                obj[header] = row[headers.indexOf(header)];
              });
              return obj;
            });

            const hasListColumn = filteredHeaders.some(
              (h) => toSlugCase(h) === "cnjs_como_testemunha",
            );

            resolve([
              {
                name: "CSV",
                model,
                rows: dataRows.length,
                headers: filteredHeaders,
                sampleData,
                hasListColumn,
              },
            ]);
          },
          error: (error: unknown) => {
            reject(new Error(`Erro ao processar CSV: ${error}`));
          },
        });
      } catch (error) {
        reject(new Error(`Erro ao ler CSV: ${error}`));
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(file, "utf-8");
  });
}

/**
 * Função principal de detecção
 */
export async function detectFileStructure(
  file: File,
): Promise<DetectedSheet[]> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (
    fileType.includes("spreadsheet") ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls")
  ) {
    return processXlsxFile(file);
  }

  if (fileType === "text/csv" || fileName.endsWith(".csv")) {
    return processCsvFile(file);
  }

  throw new Error("Formato de arquivo não suportado. Use XLSX, XLS ou CSV.");
}
