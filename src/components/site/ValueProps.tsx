import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Target, TrendingUp, Shield } from 'lucide-react';

export function ValueProps() {
  return (
    <section id="diferenciais" className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Problema vs Solução */}
          <div className="text-center mb-16 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Diferencial AssistJur.IA
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Problema */}
              <Card className="border-destructive/20 bg-destructive/5 animate-slide-up hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                    <Target className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-destructive">Problema</h3>
                  <p className="text-muted-foreground">
                    Excesso de soluções genéricas, pouca efetividade no contencioso.
                  </p>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="hidden md:flex justify-center">
                <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="md:hidden flex justify-center">
                <ArrowRight className="h-8 w-8 text-primary rotate-90 animate-pulse" />
              </div>

              {/* Solução */}
              <Card className="border-primary/20 bg-primary/5 animate-slide-up hover:shadow-glow transition-all duration-300" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-primary">Solução</h3>
                  <p className="text-muted-foreground">
                    Hub único, testado em grandes carteiras, com foco em governança, eficiência e estratégia.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Proposta de Valor */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-center text-foreground mb-12">
              Nossa Proposta de Valor
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Governança */}
              <Card className="border-border/50 hover:border-accent/50 hover:shadow-lg group transition-all duration-300 animate-slide-up">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition-colors">
                    <Shield className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">
                    Aumento da governança
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    sobre a carteira judicial.
                  </p>
                </CardContent>
              </Card>

              {/* Estratégia */}
              <Card className="border-border/50 hover:border-primary/50 hover:shadow-glow group transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition-colors">
                    <Target className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">
                    Fortalecimento da estratégia
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    jurídica e empresarial.
                  </p>
                </CardContent>
              </Card>

              {/* Produtividade */}
              <Card className="border-border/50 hover:border-success/50 hover:shadow-lg group transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/20 group-hover:bg-success/30 flex items-center justify-center transition-colors">
                    <TrendingUp className="h-6 w-6 text-success group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-foreground">
                    Ganhos de produtividade
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    para equipes e escritórios.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}