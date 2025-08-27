import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, FolderOpen, BarChart3 } from 'lucide-react';

export function AgentsPreview() {
  const agents = [
    {
      icon: Search,
      title: '🔎 Mapeamento de Testemunhas',
      description: 'Identifica padrões e riscos estratégicos em depoimentos',
    },
    {
      icon: FolderOpen,
      title: '📂 Constatação de Arquivamento',
      description: 'Analisa processos prontos para encerramento',
    },
    {
      icon: BarChart3,
      title: '📊 Relatórios Processuais',
      description: 'Gera insights estratégicos automatizados',
    },
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Preview dos Agentes (fase Beta)
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Conheça os primeiros agentes especializados que estarão disponíveis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {agents.map((agent, index) => (
              <Card 
                key={index}
                className="relative border-border/50 hover:shadow-lg transition-all duration-300 group overflow-hidden"
              >
                {/* Badge Em Breve */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge 
                    variant="secondary" 
                    className="bg-primary/20 text-primary border-primary/30 font-medium"
                  >
                    Em Breve
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
                
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {agent.description}
                  </p>
                  
                  {/* Preview overlay */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/30">
                    <p className="text-xs text-muted-foreground">
                      Aguarde o lançamento oficial para testar este agente
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Observação */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground italic">
              Obs.: agentes apenas ilustrativos (sem marketplace por enquanto).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}