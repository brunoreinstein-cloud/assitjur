import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDatePtBR(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return "—";

    return format(date, "dd MMM yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatDateWithTime(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return "—";

    return format(date, "dd/MM/yy HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatRelativeTime(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return "—";

    return formatDistanceToNow(date, {
      locale: ptBR,
      addSuffix: true,
    });
  } catch {
    return "—";
  }
}

export function formatCNJ(cnj?: string): string {
  if (!cnj) return "—";

  // Format: NNNNNNN-DD.AAAA.J.TR.OOOO
  const cleaned = cnj.replace(/\D/g, "");
  if (cleaned.length !== 20) return cnj;

  return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13, 14)}.${cleaned.slice(14, 16)}.${cleaned.slice(16, 20)}`;
}
