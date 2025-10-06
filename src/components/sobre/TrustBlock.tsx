import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Quote,
  Shield,
  CheckCircle2,
  Globe,
  Star,
  Users,
  TrendingUp,
  Linkedin,
  ExternalLink,
} from "lucide-react";

const certifications = [
  {
    label: "LGPD",
    icon: CheckCircle2,
    description: "Conformidade total com proteção de dados",
  },
  {
    label: "ISO 27001",
    icon: Shield,
    description: "Segurança da informação certificada",
  },
  {
    label: "SOC 2",
    icon: Globe,
    description: "Auditoria de controles organizacionais",
  },
];

const testimonials = [
  {
    quote:
      "Bianca transformou completamente nossa gestão de contencioso. Sua visão estratégica e domínio técnico são impressionantes.",
    author: "Director Jurídico",
    company: "Multinacional do Setor Financeiro",
    rating: 5,
  },
  {
    quote:
      "O AssistJur.IA representa o futuro da advocacia. A experiência da Bianca foi fundamental para entendermos nossas necessidades.",
    author: "Sócio-fundador",
    company: "Escritório de Advocacia Empresarial",
    rating: 5,
  },
];

const achievements = [
  { icon: Star, value: "Top 10", label: "Mulheres Mais Influentes do Direito" },
  { icon: Users, value: "500+", label: "Profissionais treinados" },
  { icon: TrendingUp, value: "85%", label: "Redução média de custos" },
];

export function TrustBlock() {
  return (
    <section className="py-20 bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Main Quote */}
          <Card className="mb-16 overflow-hidden border-2 border-primary/20 shadow-glow relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
            <CardContent className="p-8 md:p-12 text-center relative">
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-glow animate-pulse">
                  <Quote className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>

              <blockquote className="text-2xl md:text-4xl font-medium text-foreground leading-relaxed mb-8 max-w-4xl mx-auto">
                "O AssistJur.IA é a tradução prática de duas décadas de
                experiência em gestão de contencioso, agora
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}
                  potencializada pela inteligência artificial
                </span>
                ."
              </blockquote>

              <div className="flex items-center justify-center gap-4">
                <cite className="text-xl text-muted-foreground font-medium">
                  — Bianca Reinstein
                </cite>
                <Button variant="outline" size="sm" className="gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Testimonials Carousel */}
          <div className="mb-16">
            <h3 className="text-3xl font-semibold text-foreground mb-8 text-center">
              O que dizem sobre Bianca
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {Array.from({ length: testimonial.rating }).map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 text-yellow-400 fill-current"
                          />
                        ),
                      )}
                    </div>

                    <blockquote className="text-muted-foreground mb-4 italic">
                      "{testimonial.quote}"
                    </blockquote>

                    <div className="border-t pt-4">
                      <div className="font-medium text-foreground">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.company}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Conquistas e Reconhecimentos
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all hover:scale-105 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6">
                      <Icon className="h-8 w-8 text-primary mx-auto mb-4" />
                      <div className="text-2xl font-bold text-foreground mb-2">
                        {achievement.value}
                      </div>
                      <div className="text-muted-foreground">
                        {achievement.label}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Enhanced Certifications */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-8">
              Selos de Credibilidade e Conformidade
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              {certifications.map((cert, index) => {
                const Icon = cert.icon;
                return (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-all hover:scale-105 animate-fade-in"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">
                        {cert.label}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {cert.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
