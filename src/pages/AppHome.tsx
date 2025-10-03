import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  Search,
  BarChart3,
  Brain,
  ArrowRight,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AppHome() {
  const navigate = useNavigate();

  const features = [
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
      status: "Parcialmente Disponível",
      statusColor: "bg-success/20 text-success border-success/30",
      available: true,
      route: "/mapa-testemunhas",
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
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Bem-vindo ao AssistJur.IA
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Plataforma de inteligência estratégica para contencioso jurídico
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/mapa-testemunhas")}
                className="gap-2"
              >
                <Users className="h-5 w-5" />
                Acessar Mapa de Testemunhas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Funcionalidades da Plataforma
          </h2>
          <p className="text-lg text-muted-foreground">
            Estamos constantemente desenvolvendo novas funcionalidades para
            tornar sua experiência ainda melhor.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="relative border-border/50 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Badge
                  variant="secondary"
                  className={`font-medium ${feature.statusColor}`}
                >
                  {feature.status}
                </Badge>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl text-foreground leading-tight">
                      {feature.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>

                {feature.available && feature.route && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => navigate(feature.route)}
                  >
                    Acessar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 max-w-6xl">
          <Card className="bg-muted/30 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Novidades em Desenvolvimento
              </h3>
              <p className="text-muted-foreground">
                Estamos trabalhando em novas funcionalidades que serão lançadas
                em breve. Fique atento às atualizações!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
