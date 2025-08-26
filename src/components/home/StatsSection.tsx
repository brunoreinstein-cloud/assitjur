import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Shield, Clock } from 'lucide-react';

const stats = [
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Precisão na detecção',
    description: 'Taxa de acerto na identificação de riscos'
  },
  {
    icon: Users,
    value: '50K+',
    label: 'Processos analisados',
    description: 'Volume de dados processados'
  },
  {
    icon: Shield,
    value: '100%',
    label: 'Conformidade LGPD',
    description: 'Proteção total de dados pessoais'
  },
  {
    icon: Clock,
    value: '80%',
    label: 'Economia de tempo',
    description: 'Redução no tempo de análise'
  }
];

export const StatsSection = () => {
  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Resultados Comprovados
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Nossa plataforma já ajudou centenas de escritórios a identificar riscos e otimizar suas estratégias jurídicas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="text-center border-border/50 hover:border-primary/20 transition-colors group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-foreground mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};