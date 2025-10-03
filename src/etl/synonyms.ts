/**
 * Sistema de mapeamento de sinônimos para campos do Mapa de Testemunhas
 * Normaliza diferentes nomenclaturas para campos padronizados
 */

export interface FieldSynonym {
  canonical: string;
  synonyms: string[];
  type: "string" | "array" | "number" | "boolean";
}

export interface SynonymMap {
  [canonicalField: string]: FieldSynonym;
}

// Mapeamento de sinônimos para campos do sistema
export const FIELD_SYNONYMS: SynonymMap = {
  // Advogados - múltiplas variações aceitas
  advogados_ativo: {
    canonical: "advogados_ativo",
    synonyms: [
      "Advogados (Polo Ativo)",
      "Advogados Polo Ativo",
      "advogados_polo_ativo",
      "advogados_ativo",
      "Advogados_Ativo",
    ],
    type: "array",
  },

  advogados_passivo: {
    canonical: "advogados_passivo",
    synonyms: [
      "Advogados (Polo Passivo)",
      "Advogados Polo Passivo",
      "advogados_polo_passivo",
      "advogados_passivo",
      "Advogados_Passivo",
    ],
    type: "array",
  },

  // Testemunhas - aceita variações
  testemunhas_ativo: {
    canonical: "testemunhas_ativo",
    synonyms: [
      "testemunhas_ativo",
      "Testemunhas_Ativo",
      "testemunhas_polo_ativo",
      "Testemunhas (Polo Ativo)",
    ],
    type: "array",
  },

  testemunhas_passivo: {
    canonical: "testemunhas_passivo",
    synonyms: [
      "testemunhas_passivo",
      "Testemunhas_Passivo",
      "testemunhas_polo_passivo",
      "Testemunhas (Polo Passivo)",
    ],
    type: "array",
  },

  // Todas as testemunhas - sinônimos importantes
  todas_testemunhas: {
    canonical: "todas_testemunhas",
    synonyms: [
      "testemunhas_todas",
      "Testemunhas_Todas",
      "todas_testemunhas",
      "Todas_Testemunhas",
      "testemunhas_completas",
    ],
    type: "array",
  },

  // Campos básicos
  cnj: {
    canonical: "cnj",
    synonyms: ["cnj", "CNJ", "numero_cnj", "numero_processo"],
    type: "string",
  },

  reclamantes: {
    canonical: "reclamantes",
    synonyms: [
      "reclamantes",
      "Reclamantes",
      "autores",
      "requerentes",
      "partes_ativas",
    ],
    type: "array",
  },

  nome_testemunha: {
    canonical: "nome_testemunha",
    synonyms: [
      "nome_testemunha",
      "Nome_Testemunha",
      "nome",
      "testemunha",
      "nome_completo",
    ],
    type: "string",
  },

  qtd_depoimentos: {
    canonical: "qtd_depoimentos",
    synonyms: [
      "qtd_depoimentos",
      "quantidade_depoimentos",
      "total_depoimentos",
      "numero_depoimentos",
    ],
    type: "number",
  },
};

/**
 * Resolve o nome canônico de um campo baseado em sinônimos
 */
export function resolveFieldName(inputField: string): string | null {
  // Busca exata primeiro
  if (FIELD_SYNONYMS[inputField]) {
    return inputField;
  }

  // Busca por sinônimos (case-insensitive)
  const normalizedInput = inputField.toLowerCase().trim();

  for (const [canonical, config] of Object.entries(FIELD_SYNONYMS)) {
    const matchFound = config.synonyms.some(
      (synonym) => synonym.toLowerCase().trim() === normalizedInput,
    );

    if (matchFound) {
      return canonical;
    }
  }

  return null;
}

/**
 * Mapeia um objeto com campos usando sinônimos para campos canônicos
 */
export function mapFieldsUsingSynonyms(
  inputObject: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [inputField, value] of Object.entries(inputObject)) {
    const canonicalField = resolveFieldName(inputField);

    if (canonicalField) {
      result[canonicalField] = value;
    } else {
      // Mantém campo original se não encontrar sinônimo
      result[inputField] = value;
    }
  }

  return result;
}

/**
 * Valida se um campo mapeado tem o tipo correto
 */
export function validateFieldType(canonicalField: string, value: any): boolean {
  const fieldConfig = FIELD_SYNONYMS[canonicalField];
  if (!fieldConfig) return true; // Campo não mapeado, aceita qualquer tipo

  switch (fieldConfig.type) {
    case "array":
      return Array.isArray(value) || typeof value === "string";
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" || !isNaN(Number(value));
    case "boolean":
      return (
        typeof value === "boolean" ||
        ["true", "false", "1", "0"].includes(String(value).toLowerCase())
      );
    default:
      return true;
  }
}
