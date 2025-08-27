import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, DollarSign, BarChart3, HelpCircle } from 'lucide-react';

export function ROI() {
  const metrics = [
    {
      icon: Clock,
      value: '80%',
      label: 'menos tempo',
      description: 'em tarefas operacionais',
      tooltip: 'Baseado em estudos de casos reais de implementação em carteiras com mais de 1.000 processos.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: DollarSign,
      value: 'Milhões',
      label: 'de economia potencial',
      description: 'em provisões',
      tooltip: 'Economia através de melhor gestão de provisões contábeis e identificação precoce de riscos.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: BarChart3,
      value: 'Insights',
      label: 'estratégicos prontos',
      description: 'para diretoria',
      tooltip: 'Relatórios executivos automatizados com análises de risco e recomendações estratégicas.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ROI (Retorno sobre Investimento)
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Resultados comprovados em carteiras reais
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {metrics.map((metric, index) => (
              <TooltipProvider key={index}>
                <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${metric.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <metric.icon className={`h-10 w-10 ${metric.color}`} />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className={`text-4xl font-bold ${metric.color}`}>
                        {metric.value}
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {metric.label}
                      </div>
                      <div className="text-muted-foreground">
                        {metric.description}
                      </div>
                    </div>

                    {/* Tooltip com metodologia */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Metodologia
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{metric.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              </TooltipProvider>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground italic max-w-2xl mx-auto">
              * Resultados baseados em implementações piloto. Os resultados podem variar dependendo 
              do tamanho da carteira, complexidade dos processos e aderência às recomendações.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}