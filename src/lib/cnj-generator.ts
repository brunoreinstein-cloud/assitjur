/**
 * Utility functions for generating valid CNJ numbers with correct check digits
 */

/**
 * Calculate CNJ check digits using the official algorithm
 */
export function calculateCNJCheckDigits(cnjWithoutCheckDigits: string): string {
  if (cnjWithoutCheckDigits.length !== 18) {
    throw new Error("CNJ without check digits must have exactly 18 digits");
  }

  // Calculate check digits using the official algorithm
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3];
  let sum = 0;

  const digits = cnjWithoutCheckDigits.split("").map(Number);

  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 97;
  const checkDigits = 98 - remainder;

  return checkDigits.toString().padStart(2, "0");
}

/**
 * Generate a valid CNJ with correct check digits
 * Format: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function generateValidCNJ(options?: {
  year?: number;
  justice?: string; // Default: '5' (Trabalho)
  tribunal?: string; // Default: random 01-24
  origin?: string; // Default: random 0001-9999
  sequential?: string; // Default: random 7 digits
}): string {
  const year = options?.year || 2018 + Math.floor(Math.random() * 8); // 2018-2025
  const sequential =
    options?.sequential ||
    String(Math.floor(Math.random() * 9999999) + 1).padStart(7, "0");
  const justice = options?.justice || "5"; // Justiça do Trabalho
  const tribunal =
    options?.tribunal ||
    String(Math.floor(Math.random() * 24) + 1).padStart(2, "0");
  const origin =
    options?.origin ||
    String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");

  // Build CNJ without check digits: NNNNNNN + AAAA + J + TR + OOOO
  const cnjWithoutCheckDigits = sequential + year + justice + tribunal + origin;

  // Calculate check digits
  const checkDigits = calculateCNJCheckDigits(cnjWithoutCheckDigits);

  // Format final CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  return `${sequential}-${checkDigits}.${year}.${justice}.${tribunal}.${origin}`;
}

/**
 * Generate multiple sequential valid CNJs
 */
export function generateSequentialCNJs(
  count: number,
  startYear = 2024,
): string[] {
  const cnjs: string[] = [];
  const baseSequential = 1000000;

  for (let i = 0; i < count; i++) {
    const sequential = String(baseSequential + i).padStart(7, "0");
    cnjs.push(
      generateValidCNJ({
        sequential,
        year: startYear,
        justice: "5", // Justiça do Trabalho
        tribunal: "02", // TRT 2ª Região (SP)
        origin: String(1000 + i).padStart(4, "0"),
      }),
    );
  }

  return cnjs;
}

/**
 * Validate and format an existing CNJ
 */
export function formatCNJ(cnj: string): string {
  const normalized = cnj.replace(/\D/g, "");
  if (normalized.length !== 20) return cnj;

  return `${normalized.substring(0, 7)}-${normalized.substring(7, 9)}.${normalized.substring(9, 13)}.${normalized.substring(13, 14)}.${normalized.substring(14, 16)}.${normalized.substring(16, 20)}`;
}
