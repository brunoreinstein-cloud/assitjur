import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Database,
  Search,
  BarChart3,
  Brain,
  Settings2,
  Zap,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";

export function AgentsPreview() {
  const agents = [
    {
      icon: Sparkles,
      title: "Assistente de Prompts Jurídicos",
      description:
        'Otimização inteligente de instruções para IA, guiando o advogado com insights estratégicos para construir a melhor estrutura de prompt. Explora todo o potencial da inteligência artificial, incorporando contexto, jurisdição e formato jurídico adequado, reduzindo retrabalho e riscos de "alucinação".',
      status: "Disponível (Beta)",
      statusColor: "bg-success/20 text-success border-success/30",
    },
    {
      icon: Database,
      title: "Coleta e Análise de Dados Judiciais",
      description:
        "Camada de inteligência estratégica sobre dados de contencioso. Extração inteligente de informações judiciais e processamento avançado para insights estratégicos.",
      status: "Em Breve",
      statusColor: "bg-primary/20 text-primary border-primary/30",
    },
    {
      icon: Search,
      title: "Mapeamento de Testemunhas",
      description:
        "Mapeamento e análise estratégica da prova testemunhal, identificando vícios e padrões.",
      status: "Em Breve",
      statusColor: "bg-primary/20 text-primary border-primary/30",
    },
    {
      icon: BarChart3,
      title: "Relatórios Especializados",
      description:
        "Geração automática de relatórios executivos e análises detalhadas.",
      status: "Em Breve",
      statusColor: "bg-primary/20 text-primary border-primary/30",
    },
    {
      icon: Brain,
      title: "Estratégia Jurídica",
      description:
        "Suporte inteligente para tomada de decisões estratégicas em contencioso.",
      status: "Em Breve",
      statusColor: "bg-primary/20 text-primary border-primary/30",
    },
    {
      icon: Settings2,
      title: "Assistentes Personalizados",
      description:
        "Encomende um assistente desenvolvido sob medida para a sua maior dor. Customizamos de acordo com a necessidade do seu time ou escritório.",
      examples: [
        "Relatórios de processos trabalhistas e cíveis",
        "Relatórios para escritórios no formato exigido por clientes externos",
        "Preenchimento automatizado de formulários (ex.: solicitação de seguro garantia)",
      ],
      status: "Consulte-nos",
      statusColor:
        "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    },
    {
      icon: Zap,
      title: "Assistentes Plug & Play",
      description:
        "Assistentes já prontos para facilitar etapas estratégicas do trabalho jurídico. A plataforma está em fase beta, com lançamento inicial e uso para clientes exclusivos da Bianca Reinstein Consultoria.",
      status: "Em Breve",
      statusColor: "bg-primary/20 text-primary border-primary/30",
    },
  ];

  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Catálogo de Assistentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Soluções inteligentes personalizadas e plug & play para
              transformar seu trabalho jurídico
            </p>
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden mb-12">
            <Carousel
              setApi={setApi}
              opts={{ align: "start" }}
              className="-mx-6"
            >
              <CarouselContent>
                {agents.map((agent, index) => (
                  <CarouselItem key={index} className="pl-6">
                    <Card className="relative border-border/50 hover:shadow-lg transition-all duration-300 group overflow-hidden">
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <Badge
                          variant="secondary"
                          className={`font-medium ${agent.statusColor}`}
                        >
                          {agent.status}
                        </Badge>
                      </div>

                      <CardHeader className="text-center pb-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-card border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <agent.icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-lg text-foreground leading-tight">
                          {agent.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="text-center space-y-3">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {agent.description}
                        </p>
                        {agent.examples && (
                          <div className="text-left pt-2">
                            <p className="text-xs font-semibold text-foreground mb-2">
                              Exemplos já criados:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                              {agent.examples.map((example, i) => (
                                <li key={i}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <div className="flex justify-center mt-4 gap-2">
              {agents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className="p-4"
                  aria-label={`Ir para agente ${index + 1}`}
                >
                  <span
                    className={`block w-3 h-3 rounded-full ${
                      current === index
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {agents.map((agent, index) => (
              <Card
                key={index}
                className="relative border-border/50 hover:shadow-lg transition-all duration-300 group overflow-hidden"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge
                    variant="secondary"
                    className={`font-medium ${agent.statusColor}`}
                  >
                    {agent.status}
                  </Badge>
                </div>

                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-card border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <agent.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-foreground leading-tight">
                    {agent.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {agent.description}
                  </p>
                  {agent.examples && (
                    <div className="text-left pt-2">
                      <p className="text-xs font-semibold text-foreground mb-2">
                        Exemplos já criados:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        {agent.examples.map((example, i) => (
                          <li key={i}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
