import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClassificationChipProps {
  value: string | null | undefined;
  size?: "sm" | "md";
}

export function ClassificationChip({
  value,
  size = "md",
}: ClassificationChipProps) {
  if (!value || value === "—" || value === "PENDENTE" || value === "") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-normal text-muted-foreground",
          size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs",
        )}
      >
        Não classificada
      </Badge>
    );
  }

  const normalized = value.toLowerCase();

  // Sistema de cores semântico
  const getChipStyles = () => {
    // Risco crítico/alto
    if (
      normalized.includes("crítica") ||
      normalized.includes("alto") ||
      normalized.includes("alta")
    ) {
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900";
    }

    // Risco médio/relevante
    if (
      normalized.includes("relevante") ||
      normalized.includes("médio") ||
      normalized.includes("media")
    ) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900";
    }

    // Risco baixo/comum
    if (
      normalized.includes("comum") ||
      normalized.includes("baixo") ||
      normalized.includes("baixa")
    ) {
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900";
    }

    // Padrão
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        getChipStyles(),
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs",
      )}
    >
      {value}
    </Badge>
  );
}
