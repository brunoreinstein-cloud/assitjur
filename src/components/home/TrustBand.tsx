import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Eye, AlertTriangle } from "lucide-react";

export const TrustBand = () => {
  const badges = [
    {
      icon: Shield,
      text: "LGPD by design",
      variant: "secondary" as const,
    },
    {
      icon: CheckCircle2,
      text: "Auditoria de acesso",
      variant: "secondary" as const,
    },
    {
      icon: Eye,
      text: "Máscara automática de PII",
      variant: "secondary" as const,
    },
  ];

  return (
    <section className="mb-16">
      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <Badge
              key={index}
              variant={badge.variant}
              className="px-4 py-2 text-sm font-medium bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <Icon className="w-4 h-4 mr-2" />
              {badge.text}
            </Badge>
          );
        })}
      </div>

      {/* Client Logos Placeholder */}
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground mb-4">
          Confiado por escritórios de advocacia em todo o Brasil
        </p>
        <div className="flex justify-center items-center gap-8 opacity-50">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-24 h-12 bg-muted/30 rounded-lg flex items-center justify-center"
            >
              <span className="text-xs text-muted-foreground">Logo {i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-warning-light/50 border border-warning/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-warning-foreground" />
          <span className="text-sm text-warning-foreground">
            Conteúdo assistivo. Revisão humana obrigatória.
          </span>
        </div>
      </div>
    </section>
  );
};
