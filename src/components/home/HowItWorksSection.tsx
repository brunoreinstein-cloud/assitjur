import { Card, CardContent } from '@/components/ui/card';
import { Upload, Search, AlertTriangle, FileCheck } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Upload,
    title: 'Envie seus dados',
    description: 'Faça upload de planilhas CSV/XLSX com informações dos processos e testemunhas.',
    color: 'bg-blue-500'
  },
  {
    number: 2,
    icon: Search,
    title: 'Análise automática',
    description: 'Nossa IA cruza os dados identificando vínculos, padrões e possíveis irregularidades.',
    color: 'bg-purple-500'
  },
  {
    number: 3,
    icon: AlertTriangle,
    title: 'Detecção de riscos',
    description: 'Sistema identifica triangulações, trocas diretas e provas emprestadas automaticamente.',
    color: 'bg-orange-500'
  },
  {
    number: 4,
    icon: FileCheck,
    title: 'Relatórios precisos',
    description: 'Receba relatórios detalhados com alertas de risco e recomendações estratégicas.',
    color: 'bg-green-500'
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Como funciona
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Processo simples e automatizado para análise completa de testemunhas e identificação de riscos processuais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="relative">
              <Card className="text-center border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg group">
                <CardContent className="p-6">
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 ${step.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 text-${step.color.split('-')[1]}-500`} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform -translate-y-1/2 z-10" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};