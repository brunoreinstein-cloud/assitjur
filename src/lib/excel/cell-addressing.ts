/**
 * Sistema unificado de endereçamento de células Excel
 * Converte índices em coordenadas Excel padrão (A1, B1, etc.)
 */

/**
 * Converte índice numérico da coluna para notação Excel (A, B, C, ..., AA, AB, etc.)
 */
export function getExcelColumn(columnIndex: number): string {
  let column = "";
  let index = columnIndex;

  while (index >= 0) {
    column = String.fromCharCode(65 + (index % 26)) + column;
    index = Math.floor(index / 26) - 1;
  }

  return column;
}

/**
 * Converte coordenadas de linha e coluna para endereço Excel (ex: A1, B2)
 */
export function getExcelAddress(rowIndex: number, columnIndex: number): string {
  const column = getExcelColumn(columnIndex);
  const row = rowIndex + 1; // Excel é 1-indexed
  return `${column}${row}`;
}

/**
 * Converte nome do campo para índice da coluna em um array de headers
 */
export function getColumnIndexFromField(
  field: string,
  headers: string[],
): number {
  // Procura pelo campo exato primeiro
  let index = headers.findIndex((h) => h === field);
  if (index !== -1) return index;

  // Procura por correspondência case-insensitive
  index = headers.findIndex((h) => h.toLowerCase() === field.toLowerCase());
  if (index !== -1) return index;

  // Procura por campos que contenham o termo
  index = headers.findIndex(
    (h) =>
      h.toLowerCase().includes(field.toLowerCase()) ||
      field.toLowerCase().includes(h.toLowerCase()),
  );

  return index !== -1 ? index : -1;
}

/**
 * Cria endereço Excel a partir de nome do campo e índice da linha
 */
export function createExcelAddressFromField(
  field: string,
  rowIndex: number,
  headers: string[],
): string | null {
  const columnIndex = getColumnIndexFromField(field, headers);
  if (columnIndex === -1) return null;

  return getExcelAddress(rowIndex, columnIndex);
}

/**
 * Valida se um endereço Excel está no formato correto (A1, B2, etc.)
 */
export function isValidExcelAddress(address: string): boolean {
  const excelAddressRegex = /^[A-Z]+\d+$/;
  return excelAddressRegex.test(address);
}

/**
 * Converte endereço no formato antigo "LinhaX!field" para endereço Excel válido
 */
export function convertLegacyAddress(
  legacyAddress: string,
  headers: string[],
): string | null {
  // Formato esperado: "Linha2!cnj" ou similar
  const match = legacyAddress.match(/Linha(\d+)!(.+)/);
  if (!match) return null;

  const rowIndex = parseInt(match[1]) - 1; // Converter para 0-indexed
  const field = match[2];

  return createExcelAddressFromField(field, rowIndex, headers);
}
