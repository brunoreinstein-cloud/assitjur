import React from "react";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, Info, AlertCircle } from "lucide-react";

type Severity = "OK" | "WARNING" | "ERROR" | "INFO";

interface QualityChipsProps {
  severity: Severity;
  score?: number;
  className?: string;
  size?: "sm" | "default";
}

const severityConfig = {
  OK: {
    icon: Check,
    label: "OK",
    className: "bg-success text-success-foreground hover:bg-success/90",
  },
  WARNING: {
    icon: AlertTriangle,
    label: "Atenção",
    className: "bg-warning text-warning-foreground hover:bg-warning/90",
  },
  ERROR: {
    icon: AlertCircle,
    label: "Erro",
    className:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  INFO: {
    icon: Info,
    label: "Info",
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
} as const;

export function QualityChips({
  severity,
  score,
  className = "",
  size = "default",
}: QualityChipsProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <Badge
      className={`
        ${config.className} 
        ${sizeClasses}
        font-semibold 
        shadow-sm 
        flex items-center gap-1.5
        ${className}
      `}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="ml-1 opacity-90">({score})</span>
      )}
    </Badge>
  );
}

export default QualityChips;
