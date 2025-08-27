import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Target, TrendingUp, Shield } from 'lucide-react';

export function ValueProps() {
  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Problema vs Solução */}
          <div className="text-center mb-16 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Diferencial HubJUR.IA
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Problema */}
              <Card className="border-destructive/20 bg-destructive/5">
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
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>
              <div className="md:hidden flex justify-center">
                <ArrowRight className="h-8 w-8 text-primary rotate-90" />
              </div>

              {/* Solução */}
              <Card className="border-primary/20 bg-primary/5">
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
              <Card className="border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-accent" />
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
              <Card className="border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
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
              <Card className="border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
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