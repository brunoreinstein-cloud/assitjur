import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { NeedsForm } from "./NeedsForm";

interface ROIProps {
  onSignup?: (data: {
    email: string;
    needs: string[];
    otherNeed?: string;
  }) => void;
}

export function ROI({ onSignup }: ROIProps) {
  const metrics = [
    {
      icon: Clock,
      value: "Redução no tempo",
      description: "de tarefas operacionais",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: DollarSign,
      value: "R$ Milhões",
      description: "em economia potencial em provisões e condenações",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: BarChart3,
      value: "24/7",
      description: "Insights estratégicos prontos para diretoria",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: TrendingUp,
      value: "100%",
      description: "de aumento na qualidade das decisões",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              ROI — Retorno sobre Investimento
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              O AssistJur.IA não é custo — é economia estratégica. Cada real
              investido se traduz em:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className="border-border/50 hover:shadow-lg transition-all duration-300 group"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${metric.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <metric.icon className={`h-8 w-8 ${metric.color}`} />
                  </div>

                  <div className="space-y-2">
                    <div className={`text-xl font-bold ${metric.color}`}>
                      {metric.value}
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {metric.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resultado Prático */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8 mb-12">
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold text-primary">
                Na prática: um único processo estratégico evitado ou um acordo
                bem negociado já pode pagar meses de uso da plataforma.
              </p>
              <p className="text-muted-foreground">
                <strong>Resultado:</strong> menos tempo perdido, menos dinheiro
                desperdiçado e muito mais previsibilidade para sua operação
                jurídica.
              </p>
            </div>
          </div>

          {/* CTA e Formulário */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-8">
              Testar o AssistJur — Entre na lista Beta
            </h3>

            <div className="max-w-2xl mx-auto">
              <NeedsForm onSubmit={onSignup} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
