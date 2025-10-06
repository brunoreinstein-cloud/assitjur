import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BooleanBadgeProps {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function BooleanBadge({
  value,
  trueLabel = "Sim",
  falseLabel = "Não",
  size = "md",
  className,
}: BooleanBadgeProps) {
  if (value === null || value === undefined) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-normal text-muted-foreground",
          size === "sm" ? "text-[10px] px-1.5" : "text-xs px-2",
          className,
        )}
      >
        —
      </Badge>
    );
  }

  if (value === true) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-green-100 text-green-800 border-green-200 font-medium",
          "dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
          size === "sm" ? "text-[10px] px-1.5" : "text-xs px-2",
          className,
        )}
      >
        {trueLabel}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-gray-100 text-gray-600 border-gray-200 font-normal",
        "dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
        size === "sm" ? "text-[10px] px-1.5" : "text-xs px-2",
        className,
      )}
    >
      {falseLabel}
    </Badge>
  );
}
