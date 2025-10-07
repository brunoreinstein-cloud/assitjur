
/**
 * Remove acentos e converte para slug (snake_case)
 */
export function toSlugCase(text: string): string {
  if (!text) return "";

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Normaliza CNJ para 20 dígitos (compatível com cnj_digits)
 */
export function normalizeCNJ(cnj: string): string {
  if (!cnj) return "";
  return onlyDigits(cnj);
}

/**
 * Extrai apenas dígitos
 */
export function onlyDigits(text: string): string {
  return String(text || "").replace(/\D/g, "");
}

/**
 * Sanitiza texto removendo caracteres especiais
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return String(text).trim();
}

/**
 * Verifica se valor está vazio
 */
export function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

/**
 * Parser de lista robusto (aceitar ['a','b'], a;b, a, b)
 * Exatamente conforme especificado pelo usuário
 */
export function parseList(value: unknown): string[] {
  const s = String(value ?? "").trim();
  if (!s || s === "[]") return [];

  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      return JSON.parse(s.replace(/'/g, '"'))
        .map((x: unknown) => String(x).trim())
        .filter(Boolean);
    } catch {
      // fallback para formato não-JSON
    }
  }

  return s
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Mapeamentos de colunas conhecidas (compatível com template)
 */
/**
 * Gera um ID de sessão único
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Detecta o separador CSV analisando uma amostra do arquivo
 */
export function detectCsvSeparator(csvText: string): "," | ";" | "\t" {
  const sample = csvText.substring(0, 1000); // Primeira parte do arquivo

  const separators = [",", ";", "\t"];
  const counts = separators.map(
    (sep) => (sample.match(new RegExp(`\\${sep}`, "g")) || []).length,
  );

  const maxCount = Math.max(...counts);
  const bestSeparator = separators[counts.indexOf(maxCount)];

  return bestSeparator as "," | ";" | "\t";
}

export function getColumnMappings() {
  return {
    // Colunas específicas por modelo
    processo: {
      CNJ: "cnj",
      Reclamante_Limpo: "reclamante_limpo",
      Reclamante_Nome: "reclamante_nome", // Compatibilidade
      Reu_Nome: "reu_nome",
      UF: "uf",
      Comarca: "comarca",
      Tribunal: "tribunal",
      Vara: "vara",
      Fase: "fase",
      Status: "status",
    },
    testemunha: {
      Nome_Testemunha: "nome_testemunha",
      CNJs_Como_Testemunha: "cnjs_como_testemunha",
      Reclamante_Nome: "reclamante_nome",
      Reu_Nome: "reu_nome",
    },
    // Colunas comuns
    common: {
      CNJ: "cnj",
      cnj: "cnj",
      observacoes: "observacoes",
      data_audiencia: "data_audiencia",
    },
  };
}

/**
 * Mapeamento avançado de headers (case-insensitive, fuzzy)
 */
export function mapHeadersAdvanced(headers: string[]): {
  requiredFields: Record<string, number>;
  optionalFields: Record<string, number>;
  unmapped: string[];
  suggestions: Array<{
    header: string;
    suggestion: string;
    confidence: number;
  }>;
} {
  const result = {
    requiredFields: {} as Record<string, number>,
    optionalFields: {} as Record<string, number>,
    unmapped: [] as string[],
    suggestions: [] as Array<{
      header: string;
      suggestion: string;
      confidence: number;
    }>,
  };

  const mappings = getColumnMappings();

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const normalized = header.toLowerCase().trim();
    let mapped = false;

    // Match exato (case-insensitive)
    for (const [key, value] of Object.entries({
      ...mappings.common,
      ...mappings.processo,
      ...mappings.testemunha,
    })) {
      if (key.toLowerCase() === normalized) {
        if (
          ["cnj", "reclamante_limpo", "reclamante_nome", "reu_nome"].includes(
            value,
          )
        ) {
          result.requiredFields[value] = i;
        } else {
          result.optionalFields[value] = i;
        }
        mapped = true;
        break;
      }
    }

    // Se não mapeou, tentar fuzzy matching
    if (!mapped) {
      if (normalized.includes("cnj") && !normalized.startsWith("cnj_")) {
        result.requiredFields.cnj = i;
        mapped = true;
      } else if (normalized.includes("reclamante")) {
        if (normalized.includes("limpo")) {
          result.requiredFields.reclamante_limpo = i;
        } else {
          result.requiredFields.reclamante_nome = i;
        }
        mapped = true;
      } else if (normalized.includes("reu") || normalized.includes("réu")) {
        result.requiredFields.reu_nome = i;
        mapped = true;
      }
    }

    if (!mapped) {
      result.unmapped.push(header);
    }
  }

  return result;
}
