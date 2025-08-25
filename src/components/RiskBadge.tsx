import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface RiskBadgeProps {
  score: number
  className?: string
}

export function RiskBadge({ score, className }: RiskBadgeProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: "VALIDAR", color: "bg-destructive text-destructive-foreground" }
    if (score >= 50) return { level: "AVALIAR", color: "bg-warning text-warning-foreground" }
    if (score >= 30) return { level: "CONHECER", color: "bg-success text-success-foreground" }
    return { level: "DESCARTAR", color: "bg-muted text-muted-foreground" }
  }

  const risk = getRiskLevel(score)

  return (
    <Badge 
      className={cn(
        "font-semibold px-3 py-1 shadow-sm",
        risk.color,
        className
      )}
    >
      {risk.level} ({score})
    </Badge>
  )
}