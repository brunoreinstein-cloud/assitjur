/**
 * Sistema unificado de validação de CNJ
 * Padroniza critérios em todo o sistema de importação
 */

export interface CNJValidationResult {
  isValid: boolean;
  formatted: string;
  cleaned: string;
  errors: string[];
}

/**
 * Valida dígitos verificadores do CNJ
 */
function validateCNJCheckDigits(cnj: string): boolean {
  if (cnj.length !== 20) return false;

  const digits = cnj.split("").map(Number);

  // Primeiro dígito verificador
  const sequence1 = digits.slice(0, 6);
  const weights1 = [2, 3, 4, 5, 6, 7];
  const sum1 = sequence1.reduce(
    (acc, digit, idx) => acc + digit * weights1[idx],
    0,
  );
  const checkDigit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);

  // Segundo dígito verificador
  const sequence2 = digits.slice(7, 13);
  const weights2 = [2, 3, 4, 5, 6, 7];
  const sum2 = sequence2.reduce(
    (acc, digit, idx) => acc + digit * weights2[idx],
    0,
  );
  const checkDigit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);

  return digits[6] === checkDigit1 && digits[13] === checkDigit2;
}

/**
 * Formata CNJ no padrão visual
 */
function formatCNJ(cnj: string): string {
  if (cnj.length !== 20) return cnj;
  return `${cnj.slice(0, 7)}-${cnj.slice(7, 9)}.${cnj.slice(9, 13)}.${cnj.slice(13, 14)}.${cnj.slice(14, 16)}.${cnj.slice(16)}`;
}

/**
 * Limpa e extrai apenas dígitos do CNJ
 */
export function cleanCNJ(cnj: any): string {
  if (!cnj) return "";
  return String(cnj).replace(/\D/g, "");
}

/**
 * Validação unificada de CNJ
 * - Para correção: aceita 15+ dígitos (permite correção parcial)
 * - Para validação final: exige 20 dígitos válidos
 */
export function validateCNJ(
  cnj: any,
  mode: "correction" | "final" = "final",
): CNJValidationResult {
  const cleaned = cleanCNJ(cnj);
  const errors: string[] = [];

  // Validação básica de comprimento
  if (mode === "correction") {
    if (cleaned.length < 15) {
      errors.push(
        `CNJ muito curto: ${cleaned.length} dígitos (mínimo 15 para correção)`,
      );
      return {
        isValid: false,
        formatted: cleaned,
        cleaned,
        errors,
      };
    }

    // Para correção, completa com zeros se necessário
    let paddedCNJ = cleaned;
    if (cleaned.length < 20) {
      paddedCNJ = cleaned.padEnd(20, "0");
    }

    return {
      isValid: true,
      formatted: formatCNJ(paddedCNJ),
      cleaned: paddedCNJ,
      errors: [],
    };
  }

  // Validação final (modo 'final')
  if (cleaned.length !== 20) {
    errors.push(
      `CNJ deve ter exatamente 20 dígitos, encontrados: ${cleaned.length}`,
    );
  }

  if (cleaned.length === 20 && !validateCNJCheckDigits(cleaned)) {
    errors.push("CNJ com dígitos verificadores inválidos");
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    formatted: isValid ? formatCNJ(cleaned) : cleaned,
    cleaned,
    errors,
  };
}

/**
 * Corrige CNJ aplicando validação unificada
 */
export function correctCNJ(cnj: any): {
  corrected: string;
  needsCorrection: boolean;
  reason?: string;
} {
  const validationResult = validateCNJ(cnj, "correction");

  if (!validationResult.isValid) {
    return {
      corrected: cleanCNJ(cnj),
      needsCorrection: false,
      reason: validationResult.errors.join("; "),
    };
  }

  const original = cleanCNJ(cnj);
  const corrected = validationResult.cleaned;

  return {
    corrected,
    needsCorrection: original !== corrected,
    reason:
      original !== corrected
        ? `CNJ completado de ${original.length} para 20 dígitos`
        : undefined,
  };
}
