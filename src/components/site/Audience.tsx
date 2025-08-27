import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Briefcase, TrendingUp } from 'lucide-react';

export function Audience() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Para Quem
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Soluções especializadas para diferentes necessidades do mercado jurídico
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Empresas */}
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-foreground">Empresas</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Reduzem tempo operacional
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Ajustam provisões
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Ganham previsibilidade
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Escritórios */}
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-foreground">Escritórios</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-accent rounded-full mr-3" />
                    Aumentam eficiência
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-accent rounded-full mr-3" />
                    Diferenciam oferta de serviços
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-accent rounded-full mr-3" />
                    Expandem capacidade
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Investidores */}
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-success to-success-light flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-foreground">Investidores</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-success rounded-full mr-3" />
                    Obtêm transparência
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-success rounded-full mr-3" />
                    Ganham previsibilidade
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-success rounded-full mr-3" />
                    Melhoram decisões
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}