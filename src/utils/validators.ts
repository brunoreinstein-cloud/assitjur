/**
 * Advanced validation utilities for legal data processing
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  normalizedValue?: any;
}

export interface HeaderMappingResult {
  requiredFields: Record<string, number>;
  optionalFields: Record<string, number>;
  unmappedFields: string[];
  suggestions: Array<{
    header: string;
    suggestion: string;
    confidence: number;
  }>;
}

/**
 * Advanced CNJ validation with check digit algorithm
 */
export function validateCNJ(cnj: string): ValidationResult {
  if (!cnj) {
    return { isValid: false, error: "CNJ é obrigatório" };
  }

  // Normalize CNJ (remove all non-digits)
  const normalized = cnj.replace(/\D/g, "");

  if (normalized.length !== 20) {
    return {
      isValid: false,
      error: "CNJ deve ter exatamente 20 dígitos",
      normalizedValue: normalized,
    };
  }

  // Validate CNJ check digits
  const isValidCheckDigit = validateCNJCheckDigits(normalized);
  if (!isValidCheckDigit) {
    return {
      isValid: false,
      error: "CNJ possui dígitos verificadores inválidos",
      normalizedValue: normalized,
    };
  }

  // Format CNJ for display

  return {
    isValid: true,
    normalizedValue: normalized,
  };
}

/**
 * Validates CNJ check digits using the official algorithm
 */
function validateCNJCheckDigits(cnj: string): boolean {
  if (cnj.length !== 20) return false;

  // Extract parts: NNNNNNN-DD.AAAA.J.TR.OOOO
  const sequencial = cnj.substring(0, 7);
  const digitosVerificadores = cnj.substring(7, 9);
  const ano = cnj.substring(9, 13);
  const segmento = cnj.substring(13, 14);
  const tribunal = cnj.substring(14, 16);
  const origem = cnj.substring(16, 20);

  // Calculate first check digit
  const weights1 = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3];
  let sum1 = 0;

  const digits = (sequencial + ano + segmento + tribunal + origem)
    .split("")
    .map(Number);

  for (let i = 0; i < digits.length; i++) {
    sum1 += digits[i] * weights1[i];
  }

  const remainder1 = sum1 % 97;
  const checkDigit1 = 98 - remainder1;

  return checkDigit1.toString().padStart(2, "0") === digitosVerificadores;
}


/**
 * Advanced CPF validation with check digit algorithm
 */
export function validateCPF(cpf: string): ValidationResult {
  if (!cpf) {
    return { isValid: true, warning: "CPF não informado" }; // CPF is optional
  }

  const normalized = cpf.replace(/\D/g, "");

  if (normalized.length !== 11) {
    return {
      isValid: false,
      error: "CPF deve ter exatamente 11 dígitos",
      normalizedValue: normalized,
    };
  }

  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(normalized)) {
    return {
      isValid: false,
      error: "CPF inválido (todos os dígitos iguais)",
      normalizedValue: normalized,
    };
  }

  // Validate check digits
  if (!validateCPFCheckDigits(normalized)) {
    return {
      isValid: false,
      error: "CPF possui dígitos verificadores inválidos",
      normalizedValue: normalized,
    };
  }

  return {
    isValid: true,
    normalizedValue: maskCPF(normalized),
  };
}

/**
 * Validates CPF check digits
 */
function validateCPFCheckDigits(cpf: string): boolean {
  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 >= 10) checkDigit1 = 0;

  if (checkDigit1 !== parseInt(cpf.charAt(9))) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 >= 10) checkDigit2 = 0;

  return checkDigit2 === parseInt(cpf.charAt(10));
}

/**
 * Mask CPF for privacy
 */
function maskCPF(cpf: string): string {
  if (cpf.length !== 11) return cpf;
  return `${cpf.substring(0, 3)}.***.***-${cpf.substring(9, 11)}`;
}

/**
 * Validate date formats
 */
export function validateDate(dateStr: any): ValidationResult {
  if (!dateStr) {
    return { isValid: true, warning: "Data não informada" };
  }

  let date: Date;

  // Try parsing different date formats
  if (typeof dateStr === "number") {
    // Excel serial date
    date = new Date((dateStr - 25569) * 86400 * 1000);
  } else if (typeof dateStr === "string") {
    // Try various string formats
    const cleanDateStr = dateStr.trim();

    // DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDateStr)) {
      const [day, month, year] = cleanDateStr.split("/").map(Number);
      date = new Date(year, month - 1, day);
    }
    // YYYY-MM-DD
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDateStr)) {
      date = new Date(cleanDateStr);
    }
    // DD-MM-YYYY
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDateStr)) {
      const [day, month, year] = cleanDateStr.split("-").map(Number);
      date = new Date(year, month - 1, day);
    } else {
      return {
        isValid: false,
        error:
          "Formato de data inválido. Use DD/MM/YYYY, YYYY-MM-DD ou DD-MM-YYYY",
      };
    }
  } else {
    return {
      isValid: false,
      error: "Tipo de data inválido",
    };
  }

  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: "Data inválida",
    };
  }

  // Check reasonable date range (not too old, not in future)
  const now = new Date();
  const minDate = new Date(1900, 0, 1);
  const maxDate = new Date(now.getFullYear() + 10, 11, 31);

  if (date < minDate || date > maxDate) {
    return {
      isValid: false,
      error: `Data fora do intervalo válido (${minDate.getFullYear()}-${maxDate.getFullYear()})`,
    };
  }

  return {
    isValid: true,
    normalizedValue: date.toISOString().split("T")[0], // YYYY-MM-DD format
  };
}

/**
 * Validate numeric score range
 */
export function validateScoreRisco(score: any): ValidationResult {
  if (!score && score !== 0) {
    return { isValid: true, warning: "Score de risco não informado" };
  }

  const numScore = Number(score);

  if (isNaN(numScore)) {
    return {
      isValid: false,
      error: "Score de risco deve ser um número",
    };
  }

  if (numScore < 0 || numScore > 100) {
    return {
      isValid: false,
      error: "Score de risco deve estar entre 0 e 100",
    };
  }

  return {
    isValid: true,
    normalizedValue: Math.round(numScore),
  };
}

/**
 * Sanitize text fields
 */
export function sanitizeText(text: any): ValidationResult {
  if (!text) {
    return { isValid: true, normalizedValue: null };
  }

  const cleanText = String(text)
    .trim()
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/[<>]/g, "") // Remove potential HTML
    .substring(0, 1000); // Limit length

  return {
    isValid: true,
    normalizedValue: cleanText || null,
  };
}

/**
 * Parse array fields (advogados, testemunhas)
 */
export function parseArrayField(value: any): ValidationResult {
  if (!value) {
    return { isValid: true, normalizedValue: [] };
  }

  let names: string[] = [];

  if (Array.isArray(value)) {
    names = value.map((v) => String(v).trim()).filter(Boolean);
  } else if (typeof value === "string") {
    // Split by common separators
    names = value
      .split(/[;,\|\n]/)
      .map((name) => name.trim())
      .filter(Boolean);
  } else {
    names = [String(value).trim()].filter(Boolean);
  }

  // Sanitize each name
  const sanitizedNames = names.map((name) =>
    name.replace(/[<>]/g, "").substring(0, 200),
  );

  return {
    isValid: true,
    normalizedValue: sanitizedNames,
  };
}

/**
 * Smart header mapping with suggestions
 */
export function mapHeadersAdvanced(headers: string[]): HeaderMappingResult {
  const requiredFieldMappings = {
    cnj: ["cnj", "numero", "processo", "num_processo"],
    reclamante_nome: ["reclamante", "autor", "requerente", "nome_reclamante"],
    reu_nome: ["reu", "réu", "requerido", "nome_reu", "demandado"],
  };

  const optionalFieldMappings = {
    comarca: ["comarca", "local", "municipio"],
    tribunal: ["tribunal", "trib", "orgao"],
    vara: ["vara", "juizo", "juízo"],
    fase: ["fase", "situacao", "etapa"],
    status: ["status", "situacao", "estado"],
    reclamante_cpf: ["cpf", "cpf_reclamante", "documento", "doc_reclamante"],
    data_audiencia: ["audiencia", "audiência", "data_audiencia", "data"],
    advogados_ativo: ["advogados_ativo", "adv_ativo", "advogado_autor"],
    advogados_passivo: ["advogados_passivo", "adv_passivo", "advogado_reu"],
    testemunhas_ativo: ["testemunhas_ativo", "test_ativo", "testemunha_autor"],
    testemunhas_passivo: [
      "testemunhas_passivo",
      "test_passivo",
      "testemunha_reu",
    ],
    observacoes: ["observacoes", "observações", "obs", "comentarios"],
  };

  const requiredFields: Record<string, number> = {};
  const optionalFields: Record<string, number> = {};
  const unmappedFields: string[] = [];
  const suggestions: Array<{
    header: string;
    suggestion: string;
    confidence: number;
  }> = [];

  headers.forEach((header, index) => {
    const normalized = header
      .toLowerCase()
      .trim()
      .replace(/[áàâãä]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôõö]/g, "o")
      .replace(/[úùûü]/g, "u")
      .replace(/[ç]/g, "c");

    let mapped = false;

    // Check required fields
    for (const [field, patterns] of Object.entries(requiredFieldMappings)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern)) {
          requiredFields[field] = index;
          mapped = true;
          break;
        }
      }
      if (mapped) break;
    }

    // Check optional fields if not already mapped
    if (!mapped) {
      for (const [field, patterns] of Object.entries(optionalFieldMappings)) {
        for (const pattern of patterns) {
          if (normalized.includes(pattern)) {
            optionalFields[field] = index;
            mapped = true;
            break;
          }
        }
        if (mapped) break;
      }
    }

    // If still not mapped, try to suggest
    if (!mapped) {
      const allMappings = {
        ...requiredFieldMappings,
        ...optionalFieldMappings,
      };

      for (const [field, patterns] of Object.entries(allMappings)) {
        for (const pattern of patterns) {
          const similarity = calculateSimilarity(normalized, pattern);
          if (similarity > 0.6) {
            suggestions.push({
              header,
              suggestion: field,
              confidence: similarity,
            });
            break;
          }
        }
      }

      if (
        suggestions.length === 0 ||
        !suggestions.some((s) => s.header === header)
      ) {
        unmappedFields.push(header);
      }
    }
  });

  return {
    requiredFields,
    optionalFields,
    unmappedFields,
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
  };
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return (maxLength - matrix[str2.length][str1.length]) / maxLength;
}

/**
 * Validate boolean fields
 */
export function validateBoolean(value: any): ValidationResult {
  if (value === null || value === undefined || value === "") {
    return { isValid: true, normalizedValue: false };
  }

  if (typeof value === "boolean") {
    return { isValid: true, normalizedValue: value };
  }

  const strValue = String(value).toLowerCase().trim();

  const trueValues = ["true", "1", "sim", "yes", "s", "verdadeiro", "ativo"];
  const falseValues = [
    "false",
    "0",
    "não",
    "nao",
    "no",
    "n",
    "falso",
    "inativo",
  ];

  if (trueValues.includes(strValue)) {
    return { isValid: true, normalizedValue: true };
  }

  if (falseValues.includes(strValue)) {
    return { isValid: true, normalizedValue: false };
  }

  return {
    isValid: false,
    error: `Valor booleano inválido: "${value}". Use: sim/não, true/false, 1/0`,
  };
}

/**
 * Check for duplicate CNJs
 */
export function checkDuplicateCNJ(
  cnj: string,
  existingCNJs: Set<string>,
): ValidationResult {
  const normalized = cnj.replace(/\D/g, "");

  if (existingCNJs.has(normalized)) {
    return {
      isValid: false,
      error: "CNJ duplicado encontrado",
    };
  }

  existingCNJs.add(normalized);
  return { isValid: true };
}
