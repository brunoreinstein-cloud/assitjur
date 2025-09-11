import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  ArrowRight,
  Target,
  TrendingUp,
  Shield,
  Award,
  Users,
  Brain,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";

export function ValueProps() {
  const [diffApi, setDiffApi] = React.useState<CarouselApi>();
  const [diffCurrent, setDiffCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!diffApi) return;

    const onSelect = () => setDiffCurrent(diffApi.selectedScrollSnap());
    onSelect();
    diffApi.on("select", onSelect);

    return () => {
      diffApi.off("select", onSelect);
    };
  }, [diffApi]);

  const diferentials = [
    {
      icon: Brain,
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      title: "Especialização Jurídica",
      text: "Desenvolvido por especialistas com mais de 20 anos de experiência em gestão de contencioso.",
    },
    {
      icon: Award,
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
      title: "Conhecimento de Jurisprudência",
      text: "Estrutura pensado para interpretar dados jurídicos, decisões e padrões processuais.",
    },
    {
      icon: TrendingUp,
      iconBg: "bg-success/20",
      iconColor: "text-success",
      title: "Integração com Bases Jurídicas",
      text: "Capacidade de cruzar dados internos da empresa com informações de tribunais e sistemas públicos.",
    },
    {
      icon: Shield,
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      title: "Supervisão Especializada",
      text: "Outputs sempre validados por advogados — tecnologia que apoia, mas não substitui a análise humana.",
    },
  ];

  return (
    <section id="diferenciais" className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Diferencial AssistJur.IA
            </h2>

            <div className="max-w-4xl mx-auto space-y-6">
              <p className="text-xl text-muted-foreground leading-relaxed">
                O AssistJur.IA não é apenas um catálogo de agentes de
                inteligência artificial. É a aplicação prática da experiência
                real em gestão de carteiras judiciais complexas, transformada em
                soluções seguras, estratégicas e orientadas a resultados.
              </p>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-primary mb-4">
                  Tecnologia + Consultoria Estratégica
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  O AssistJur.IA une inteligência artificial com a experiência
                  de uma consultoria especializada em gestão de contencioso. Não
                  apenas tecnologia: entregamos resultado estratégico, como em
                  um projeto de consultoria, mas com escala e velocidade de IA.
                </p>
              </div>
            </div>
          </div>

          {/* Problema vs Solução */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            {/* Problema */}
            <Card className="border-destructive/20 bg-destructive/5 animate-slide-up hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-destructive">
                  {" "}
                  Problema
                </h3>
                <p className="text-muted-foreground">
                  Excesso de soluções genéricas, pouca efetividade no
                  contencioso.
                </p>
              </CardContent>
            </Card>

            {/* Solução */}
            <Card
              className="border-primary/20 bg-primary/5 animate-slide-up hover:shadow-glow transition-all duration-300"
              style={{ animationDelay: "0.2s" }}
            >
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">
                  {" "}
                  Solução
                </h3>
                <p className="text-muted-foreground">
                  Hub único, testado em grandes carteiras, com foco em
                  governança, eficiência e estratégia.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Principais Focos */}
          <div className="space-y-8 mb-16">
            <h3 className="text-2xl font-bold text-center text-foreground">
              Principais focos do Hub
            </h3>

            <div className="grid md:grid-cols-4 gap-6">
              {/* Governança */}
              <Card className="border-border/50 hover:border-accent/50 hover:shadow-lg group transition-all duration-300 animate-slide-up">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition-colors">
                    <Shield className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">
                    Governança
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Aumento da governança sobre a carteira judicial
                  </p>
                </CardContent>
              </Card>

              {/* Estratégia */}
              <Card
                className="border-border/50 hover:border-primary/50 hover:shadow-glow group transition-all duration-300 animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition-colors">
                    <Target className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">
                    Estratégia
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Fortalecimento da estratégia jurídica e empresarial
                  </p>
                </CardContent>
              </Card>

              {/* Produtividade */}
              <Card
                className="border-border/50 hover:border-success/50 hover:shadow-lg group transition-all duration-300 animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/20 group-hover:bg-success/30 flex items-center justify-center transition-colors">
                    <TrendingUp className="h-6 w-6 text-success group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">
                    Produtividade
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Ganhos de produtividade para equipes e escritórios
                  </p>
                </CardContent>
              </Card>

              {/* Qualidade */}
              <Card
                className="border-border/50 hover:border-accent/50 hover:shadow-lg group transition-all duration-300 animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition-colors">
                    <Award className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">
                    Qualidade
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Melhoria na qualidade dos serviços jurídicos, com apoio em
                    dados e IA
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Exclusividade */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-primary mb-6 text-center">
              Exclusividade
            </h3>
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground leading-relaxed">
                Pensado e estruturado por Bianca Reinstein, referência nacional
                em gestão estratégica de passivos judiciais, com mais de 20 anos
                de atuação junto a grandes empresas e escritórios.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Clientes podem ter agentes customizados para suas bases, com uso
                exclusivo e privado.
              </p>
              <p className="text-lg font-semibold text-primary">
                Assistente inteligente, sempre aliado ao olhar humano do
                advogado.
              </p>
            </div>
          </div>

          {/* Supervisão Humana */}
          <Card className="border-primary/30 bg-primary/5 mb-12">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">
                ⚖️ Supervisão Humana Obrigatória
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                O AssistJur.IA funciona como um assistente inteligente, mas a
                análise e decisão final sempre dependem do olhar humano do
                advogado. Inteligência artificial estratégica, com
                responsabilidade e segurança.
              </p>
            </CardContent>
          </Card>

          {/* Por que não ChatGPT */}
          <div className="bg-muted/50 border border-border rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Por que não ChatGPT ou outras IAs?
            </h3>
            <div className="space-y-4 text-center max-w-3xl mx-auto">
              <p className="text-muted-foreground leading-relaxed">
                Ferramentas genéricas de inteligência artificial não foram
                criadas para lidar com a complexidade do contencioso judicial.
              </p>
              <p className="text-lg font-semibold text-primary">
                O AssistJur.IA nasceu da prática jurídica e é construído sob
                medida para esse contexto.
              </p>
            </div>
          </div>

          {/* Nossos Diferenciais */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-center text-foreground">
              Nossos Diferenciais
            </h3>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <Carousel
                setApi={setDiffApi}
                opts={{ align: "start" }}
                className="-mx-6"
              >
                <CarouselContent>
                  {diferentials.map((diff, index) => (
                    <CarouselItem key={index} className="pl-6">
                      <Card className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div
                              className={`w-10 h-10 rounded-full ${diff.iconBg} flex items-center justify-center flex-shrink-0`}
                            >
                              <diff.icon
                                className={`h-5 w-5 ${diff.iconColor}`}
                              />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold mb-2 text-foreground">
                                {diff.title}
                              </h4>
                              <p className="text-muted-foreground text-sm">
                                {diff.text}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <div className="flex justify-center mt-4 gap-2">
                {diferentials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => diffApi?.scrollTo(index)}
                    className="p-4"
                    aria-label={`Ir para diferencial ${index + 1}`}
                  >
                    <span
                      className={`block w-3 h-3 rounded-full ${
                        diffCurrent === index
                          ? "bg-primary"
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-6">
              {diferentials.map((diff, index) => (
                <Card
                  key={index}
                  className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full ${diff.iconBg} flex items-center justify-center flex-shrink-0`}
                      >
                        <diff.icon className={`h-5 w-5 ${diff.iconColor}`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2 text-foreground">
                          {diff.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {diff.text}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
