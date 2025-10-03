import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  score?: number;
  riscoNivel?: "alto" | "medio" | "baixo";
  className?: string;
}

export function RiskBadge({ score, riscoNivel, className }: RiskBadgeProps) {
  const getRiskFromScore = (score: number) => {
    if (score >= 70)
      return {
        level: "VALIDAR",
        color: "bg-destructive text-destructive-foreground",
        riscoNivel: "alto" as const,
      };
    if (score >= 50)
      return {
        level: "AVALIAR",
        color: "bg-warning text-warning-foreground",
        riscoNivel: "medio" as const,
      };
    if (score >= 30)
      return {
        level: "CONHECER",
        color: "bg-success text-success-foreground",
        riscoNivel: "baixo" as const,
      };
    return {
      level: "DESCARTAR",
      color: "bg-muted text-muted-foreground",
      riscoNivel: "baixo" as const,
    };
  };

  const getRiskFromLevel = (nivel: "alto" | "medio" | "baixo") => {
    switch (nivel) {
      case "alto":
        return {
          level: "Alto",
          color: "bg-destructive text-destructive-foreground",
        };
      case "medio":
        return {
          level: "Médio",
          color: "bg-amber-500/15 text-amber-600 border-amber-500/30",
        };
      case "baixo":
        return {
          level: "Baixo",
          color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
        };
    }
  };

  const risk = riscoNivel
    ? getRiskFromLevel(riscoNivel)
    : score !== undefined
      ? getRiskFromScore(score)
      : { level: "N/A", color: "bg-muted text-muted-foreground" };

  return (
    <Badge
      className={cn("font-semibold px-3 py-1 shadow-sm", risk.color, className)}
    >
      {risk.level}
      {score !== undefined && !riscoNivel ? ` (${score})` : ""}
    </Badge>
  );
}
