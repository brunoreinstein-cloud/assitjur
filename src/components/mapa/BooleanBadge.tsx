import { Badge } from "@/components/ui/badge";

interface BooleanBadgeProps {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
}

export const BooleanBadge = ({
  value,
  trueLabel = "Sim",
  falseLabel = "Não",
}: BooleanBadgeProps) => {
  const result =
    value === true
      ? { text: trueLabel, variant: "destructive" as const }
      : value === false
        ? { text: falseLabel, variant: "secondary" as const }
        : { text: "N/A", variant: "outline" as const };

  return (
    <Badge variant={result.variant} className="text-xs">
      {result.text}
    </Badge>
  );
};
