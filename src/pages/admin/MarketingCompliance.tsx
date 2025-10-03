import { AppLayout } from "@/components/navigation/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Download,
  Target,
  TrendingUp,
  FileText,
  Users,
  Award,
  CheckCircle,
} from "lucide-react";

export function MarketingCompliance() {
  const marketingArguments = [
    {
      title: "Compliance LGPD 85% Automatizada",
      description:
        "Sistema com políticas de retenção automática, anonimização de PII e auditoria completa",
      icon: Shield,
      metrics: [
        "85% compliance automática",
        "100% dados protegidos",
        "0 vazamentos registrados",
      ],
    },
    {
      title: "ROI Comprovado em Compliance",
      description:
        "Redução de 70% nos custos de adequação LGPD vs. consultoria tradicional",
      icon: TrendingUp,
      metrics: [
        "70% redução de custos",
        "90% menos tempo de setup",
        "100% auditável",
      ],
    },
    {
      title: "Diferencial Competitivo",
      description:
        "Único sistema jurídico com LGPD by design para análise de testemunhas",
      icon: Award,
      metrics: [
        "1º no mercado",
        "Tecnologia exclusiva",
        "Certificação própria",
      ],
    },
  ];

  const leadMagnets = [
    {
      title: "Whitepaper: LGPD para Escritórios",
      description:
        "Guia completo de adequação LGPD para escritórios de advocacia",
      type: "PDF",
      pages: "24 páginas",
      icon: FileText,
      downloadUrl: "/whitepaper-assistjur.pdf",
    },
    {
      title: "Checklist de Compliance",
      description: "Lista verificação completa para auditoria LGPD interna",
      type: "Planilha",
      pages: "5 categorias",
      icon: CheckCircle,
      downloadUrl: "/checklist-compliance.xlsx",
    },
    {
      title: "Template de Políticas",
      description: "Modelos prontos de políticas de privacidade e retenção",
      type: "DOC",
      pages: "12 modelos",
      icon: FileText,
      downloadUrl: "/templates-politicas.docx",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Carlos Mendes",
      role: "Sócio, Mendes & Associados",
      quote:
        "Com o AssistJur.IA, nossa adequação LGPD foi 3x mais rápida que o esperado.",
      compliance: "100% conforme",
    },
    {
      name: "Dra. Ana Silva",
      role: "Coordenadora de Compliance",
      quote:
        "A auditoria automática nos deu total controle sobre os dados dos clientes.",
      compliance: "0 incidentes",
    },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Marketing Compliance</h1>
            <p className="text-muted-foreground">
              Argumentário comercial e lead magnets para conversão
            </p>
          </div>
        </div>

        <Tabs defaultValue="argumentario" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="argumentario">Argumentário</TabsTrigger>
            <TabsTrigger value="leadmagnets">Lead Magnets</TabsTrigger>
            <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
            <TabsTrigger value="cases">Cases de Sucesso</TabsTrigger>
          </TabsList>

          {/* Argumentário Comercial */}
          <TabsContent value="argumentario" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {marketingArguments.map((arg, index) => {
                const Icon = arg.icon;
                return (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">{arg.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {arg.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {arg.metrics.map((metric, i) => (
                          <Badge key={i} variant="secondary">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Value Proposition Summary */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Proposta de Valor Única
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">
                  <strong>AssistJur.IA</strong> é o único sistema jurídico com{" "}
                  <Badge variant="outline" className="mx-1">
                    LGPD by design
                  </Badge>
                  que oferece <strong>85% de compliance automatizada</strong>{" "}
                  para análise de testemunhas, com economia de{" "}
                  <strong>70% nos custos</strong> e{" "}
                  <strong>90% menos tempo</strong> de adequação.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Magnets */}
          <TabsContent value="leadmagnets" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {leadMagnets.map((magnet, index) => {
                const Icon = magnet.icon;
                return (
                  <Card
                    key={index}
                    className="group hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <Badge variant="outline">{magnet.type}</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{magnet.title}</CardTitle>
                      <CardDescription>{magnet.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        📄 {magnet.pages}
                      </div>
                      <Button
                        className="w-full group-hover:bg-primary/90 transition-colors"
                        onClick={() =>
                          window.open(magnet.downloadUrl, "_blank")
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Gratuito
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Download Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Lead Magnets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">1,247</div>
                    <div className="text-sm text-muted-foreground">
                      Downloads totais
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">32%</div>
                    <div className="text-sm text-muted-foreground">
                      Taxa de conversão
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">89</div>
                    <div className="text-sm text-muted-foreground">
                      Leads qualificados
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI Calculator */}
          <TabsContent value="roi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calculadora de ROI - Compliance LGPD</CardTitle>
                <CardDescription>
                  Compare os custos de adequação LGPD: AssistJur.IA vs.
                  Consultoria Tradicional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Consultoria Tradicional */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-destructive">
                      Consultoria Tradicional
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Consultoria inicial:</span>
                        <span className="font-medium">R$ 25.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Implementação (6 meses):</span>
                        <span className="font-medium">R$ 45.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auditoria anual:</span>
                        <span className="font-medium">R$ 15.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Manutenção/ano:</span>
                        <span className="font-medium">R$ 12.000</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold text-destructive">
                          <span>Total (1º ano):</span>
                          <span>R$ 97.000</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AssistJur.IA */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">
                      AssistJur.IA
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Setup inicial:</span>
                        <span className="font-medium">R$ 0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Implementação (1 semana):</span>
                        <span className="font-medium">R$ 2.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Licença anual:</span>
                        <span className="font-medium">R$ 24.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Suporte incluído:</span>
                        <span className="font-medium">R$ 0</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold text-primary">
                          <span>Total (1º ano):</span>
                          <span>R$ 26.000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Economia */}
                <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      R$ 71.000 de economia
                    </div>
                    <div className="text-lg text-muted-foreground">
                      73% menos custos no primeiro ano
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      + 90% menos tempo de implementação + Compliance automática
                      24/7
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cases de Sucesso */}
          <TabsContent value="cases" className="space-y-6">
            <div className="grid gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-l-4 border-l-accent">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-accent/10 rounded-full">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <blockquote className="text-lg italic mb-4">
                          "{testimonial.quote}"
                        </blockquote>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {testimonial.role}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-primary/10">
                            {testimonial.compliance}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-primary to-accent text-white">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold">
                    Pronto para 85% de Compliance Automatizada?
                  </h3>
                  <p className="text-lg opacity-90">
                    Junte-se aos escritórios que já economizam 70% em adequação
                    LGPD
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="secondary" size="lg">
                      Demonstração Gratuita
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Falar com Especialista
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default MarketingCompliance;
