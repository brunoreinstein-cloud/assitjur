export function formatCNPJ(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatOAB(value: string): string {
  return value
    .replace(/[^0-9A-Za-z]/g, "")
    .toUpperCase()
    .replace(/^([A-Z]{2})(\d+)/, "$1 $2")
    .slice(0, 9);
}
