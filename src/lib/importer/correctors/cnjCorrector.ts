import { calculateCNJCheckDigits } from "@/lib/cnj-generator";

export interface CNJCorrection {
  original: string;
  corrected: string;
  type: "digits" | "format" | "checkDigits";
  confidence: number;
}

/**
 * Corrige CNJs inválidos automaticamente
 */
export function correctCNJ(cnj: string): CNJCorrection | null {
  if (!cnj) return null;

  const original = cnj;
  let corrected = cnj;
  let type: CNJCorrection["type"] = "format";
  let confidence = 0.9;

  // Remove formatação
  const digitsOnly = cnj.replace(/\D/g, "");

  // Se tem menos de 20 dígitos, tenta corrigir
  if (digitsOnly.length < 20) {
    // Se tem 18 dígitos, pode estar faltando os dígitos verificadores
    if (digitsOnly.length === 18) {
      const checkDigits = calculateCNJCheckDigits(digitsOnly);
      corrected = digitsOnly + checkDigits;
      type = "checkDigits";
      confidence = 0.95;
    } else if (digitsOnly.length >= 15 && digitsOnly.length < 18) {
      // Tenta preencher zeros à esquerda no número sequencial
      const sequentialPart = digitsOnly.substring(0, 7);
      const yearPart =
        digitsOnly.substring(7, 11) || new Date().getFullYear().toString();
      const segmentPart = digitsOnly.substring(11, 13) || "8"; // Tribunal de Justiça
      const tribunalPart = digitsOnly.substring(13, 15) || "01"; // Padrão
      const originPart = digitsOnly.substring(15) || "0001"; // Padrão

      const reconstructed =
        sequentialPart.padStart(7, "0") +
        yearPart +
        segmentPart +
        tribunalPart +
        originPart.padStart(4, "0");

      if (reconstructed.length === 18) {
        const checkDigits = calculateCNJCheckDigits(reconstructed);
        corrected = reconstructed + checkDigits;
        type = "digits";
        confidence = 0.7;
      }
    }
  } else if (digitsOnly.length === 20) {
    // Verifica se os dígitos verificadores estão corretos
    const withoutCheck = digitsOnly.substring(0, 18);
    const providedCheck = digitsOnly.substring(18);
    const calculatedCheck = calculateCNJCheckDigits(withoutCheck);

    if (providedCheck !== calculatedCheck) {
      corrected = withoutCheck + calculatedCheck;
      type = "checkDigits";
      confidence = 0.98;
    } else {
      // CNJ já está correto
      return null;
    }
  } else if (digitsOnly.length > 20) {
    // Remove dígitos extras (pega os primeiros 20)
    corrected = digitsOnly.substring(0, 20);
    type = "format";
    confidence = 0.6;
  }

  if (corrected !== original && corrected.length === 20) {
    return {
      original,
      corrected,
      type,
      confidence,
    };
  }

  return null;
}

/**
 * Formata CNJ para o padrão visual
 */
export function formatCNJ(cnj: string): string {
  const digitsOnly = cnj.replace(/\D/g, "");

  if (digitsOnly.length !== 20) return cnj;

  // NNNNNNN-DD.AAAA.J.TR.OOOO
  return `${digitsOnly.substring(0, 7)}-${digitsOnly.substring(7, 9)}.${digitsOnly.substring(9, 13)}.${digitsOnly.substring(13, 14)}.${digitsOnly.substring(14, 16)}.${digitsOnly.substring(16, 20)}`;
}

/**
 * Corrige lote de CNJs
 */
export function correctCNJBatch(cnjs: string[]): Map<string, CNJCorrection> {
  const corrections = new Map<string, CNJCorrection>();

  cnjs.forEach((cnj) => {
    if (cnj) {
      const correction = correctCNJ(cnj);
      if (correction) {
        corrections.set(cnj, correction);
      }
    }
  });

  return corrections;
}
