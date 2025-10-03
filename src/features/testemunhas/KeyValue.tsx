import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KeyValueProps {
  label: string;
  value: string;
  type?: "reclamante" | "reu" | "status" | "observacoes" | "default";
}

export function KeyValue({ label, value, type = "default" }: KeyValueProps) {
  const getValueStyle = () => {
    switch (type) {
      case "reclamante":
        return "text-blue-700 font-medium";
      case "reu":
        return "text-red-700 font-medium";
      case "status":
        return "text-green-700";
      case "observacoes":
        return "text-muted-foreground text-sm";
      default:
        return "text-foreground";
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case "status":
        return value.toLowerCase().includes("ativo") ? "default" : "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className={cn("font-medium", getValueStyle())}>
        {type === "status" && value !== "Não informado" ? (
          <Badge variant={getBadgeVariant()} className="text-xs">
            {value}
          </Badge>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  );
}
