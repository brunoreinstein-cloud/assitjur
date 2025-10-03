import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "volume" | "risk" | "warning";
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  variant = "default",
  onClick,
  className,
}: KPICardProps) {
  // Sistema de cores inteligente: cinza neutro para zero, cores apropriadas para valores > 0
  const getVariantStyles = () => {
    if (value === 0) {
      return "text-muted-foreground hover:bg-muted/50";
    }

    switch (variant) {
      case "volume":
        return "text-primary hover:bg-primary/5";
      case "risk":
        return "text-destructive hover:bg-destructive/5";
      case "warning":
        return "text-yellow-700 hover:bg-yellow-50 dark:text-yellow-500 dark:hover:bg-yellow-950/20";
      default:
        return "text-foreground hover:bg-muted/50";
    }
  };

  const getBadgeVariant = () => {
    if (value === 0) return "outline";

    switch (variant) {
      case "risk":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto px-3 py-2 gap-2 transition-all",
        getVariantStyles(),
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
      <span className="font-medium text-sm">{label}</span>
      <Badge
        variant={getBadgeVariant()}
        className="ml-1 h-5 px-2 text-xs font-mono font-bold"
      >
        {value}
      </Badge>
    </Button>
  );
}
