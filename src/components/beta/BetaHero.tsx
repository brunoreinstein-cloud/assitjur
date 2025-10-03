import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, Sparkles, Clock, Users, Award } from "lucide-react";

export function BetaHero() {
  const scrollToSignup = () => {
    const signupElement = document.querySelector("[data-beta-signup]");
    if (signupElement) {
      signupElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div className="absolute inset-0 bg-gradient-glow opacity-60" />

      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div
        className="absolute bottom-20 right-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Limited Spots Badge */}
          <Badge
            variant="secondary"
            className="mx-auto px-6 py-2 text-sm font-medium animate-fade-in"
          >
            <Clock
              className="w-4 h-4 mr-2"
              aria-hidden="true"
              focusable="false"
            />
            Vagas limitadas para o programa Beta
          </Badge>

          {/* Main Headline */}
          <div
            className="space-y-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Seja um dos primeiros a{" "}
              <span className="relative">
                <span className="absolute inset-0 bg-gradient-primary bg-clip-text text-transparent blur-sm opacity-50" />
                <span className="relative bg-gradient-primary bg-clip-text text-transparent">
                  revolucionar
                </span>
              </span>{" "}
              o contencioso com IA
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Acesso exclusivo ao <strong>AssistJur.IA</strong> antes do
              lançamento oficial. Ajude a moldar o futuro da advocacia com
              inteligência artificial.
            </p>
          </div>

          {/* Value Proposition */}
          <div
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Award
                className="w-6 h-6 text-primary flex-shrink-0"
                aria-hidden="true"
                focusable="false"
              />
              <span className="font-medium text-foreground">
                Acesso prioritário
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
              <Users
                className="w-6 h-6 text-accent flex-shrink-0"
                aria-hidden="true"
                focusable="false"
              />
              <span className="font-medium text-foreground">
                Comunidade exclusiva
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <Sparkles
                className="w-6 h-6 text-secondary flex-shrink-0"
                aria-hidden="true"
                focusable="false"
              />
              <span className="font-medium text-foreground">
                Suporte dedicado
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="pt-8 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              size="lg"
              onClick={scrollToSignup}
              className="bg-gradient-primary hover:bg-primary/90 text-lg px-12 py-6 shadow-xl hover:shadow-glow transition-all duration-300 group"
            >
              Quero entrar na lista Beta
              <ArrowDown
                className="ml-3 w-5 h-5 group-hover:translate-y-1 transition-transform"
                aria-hidden="true"
                focusable="false"
              />
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              Sem compromisso • Acesso gratuito durante o Beta • Cancele quando
              quiser
            </p>
          </div>

          {/* Social Proof */}
          <div
            className="pt-12 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <p className="text-sm text-muted-foreground mb-6">
              Já demonstramos resultados para:
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-lg font-semibold text-muted-foreground">
                Escritórios de Grande Porte
              </div>
              <div className="text-lg font-semibold text-muted-foreground">
                Departamentos Jurídicos
              </div>
              <div className="text-lg font-semibold text-muted-foreground">
                Consultorias
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
