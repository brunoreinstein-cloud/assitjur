import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Shield, Award } from "lucide-react";

export function AboutAssistJur() {
  const purposes = [
    {
      icon: Shield,
      title: "Aumentar a governança",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Target,
      title: "Fortalecer a estratégia",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: TrendingUp,
      title: "Impulsionar a produtividade",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Award,
      title: "Elevar a qualidade dos serviços jurídicos",
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
              Sobre o AssistJur.IA
            </h2>
          </div>

          <div className="space-y-12">
            {/* Texto principal */}
            <div className="max-w-4xl mx-auto space-y-6 text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                O mercado jurídico está saturado de ferramentas de inteligência
                artificial. Mas a promessa de inovação esbarra em uma realidade
                frustrante: soluções genéricas, sem conexão com a complexidade
                do contencioso judicial. O resultado? Baixa aderência, pouca
                efetividade e mais complicação no dia a dia.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                É nesse cenário que nasce o AssistJur.IA, para entregar
                profundidade real no contencioso, integrando agentes de IA
                especializados em governança, estratégia e eficiência.
              </p>

              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6">
                <p className="text-xl font-semibold text-primary">
                  Não somos mais uma ferramenta isolada. Somos um hub integrado
                  de agentes de inteligência artificial, desenvolvido
                  exclusivamente para o contexto jurídico.
                </p>
              </div>
            </div>

            {/* Nosso Propósito */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-center text-foreground">
                Nosso propósito é claro:
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {purposes.map((purpose, index) => (
                  <Card
                    key={index}
                    className="border-border/50 hover:shadow-lg transition-all duration-300 group"
                  >
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${purpose.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <purpose.icon className={`h-8 w-8 ${purpose.color}`} />
                      </div>

                      <h4 className={`text-lg font-semibold ${purpose.color}`}>
                        {purpose.title}
                      </h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Conclusão */}
            <div className="text-center">
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Com o AssistJur.IA, você opera em um ecossistema único de
                inteligência jurídica, estratégico e orientado a resultados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
