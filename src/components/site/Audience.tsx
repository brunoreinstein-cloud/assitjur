import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Briefcase, TrendingUp, Users } from "lucide-react";

export function Audience() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Para Quem
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Empresas */}
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Empresas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Empresas com volume de processos judiciais, que buscam
                  aumentar a governança, mapear seu passivo, reduzir riscos,
                  otimizar provisões e transformar dados em insights
                  estratégicos.
                </p>
              </CardContent>
            </Card>

            {/* Escritórios de Advocacia */}
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Escritórios de Advocacia
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Escritórios de advocacia que desejam aumentar eficiência,
                  fortalecer a governança e aplicar inteligência na condução do
                  contencioso.
                </p>
              </CardContent>
            </Card>

            {/* Investidores */}
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-success to-success-light flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Investidores
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Investidores que precisam de informações confiáveis,
                  transparência e previsibilidade para avaliar e estruturar
                  oportunidades.
                </p>
              </CardContent>
            </Card>

            {/* Advogados Autônomos */}
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-foreground">
                  Advogados Autônomos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Profissionais que atuam individualmente e desejam ganhar
                  escala, reduzir tempo operacional, competir com bancas maiores
                  e entregar mais valor aos clientes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
