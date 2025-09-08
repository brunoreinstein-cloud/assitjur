import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  UserMinus, 
  AlertTriangle, 
  AlertCircle 
} from 'lucide-react';
import { ProcessoRow, ProcessoFiltersState } from '@/types/processos-explorer';

interface ProcessosKPIsProps {
  data: ProcessoRow[];
  filters: ProcessoFiltersState;
  onFilterApply: (filter: Partial<ProcessoFiltersState>) => void;
}

export function ProcessosKPIs({ data, filters, onFilterApply }: ProcessosKPIsProps) {
  const total = data.length;
  
  const comTestemunhasAtivas = data.filter(p => 
    (p.testemunhas_ativo?.length || 0) > 0
  ).length;
  
  const semTestemunhas = data.filter(p => 
    (p.testemunhas_ativo?.length || 0) === 0 && 
    (p.testemunhas_passivo?.length || 0) === 0
  ).length;
  
  const aValidar = data.filter(p => 
    !p.classificacao_final || 
    p.classificacao_final === '' || 
    p.classificacao_final === 'PENDENTE'
  ).length;
  
  const riscoAlto = data.filter(p => 
    p.classificacao_final === 'Alto' || 
    (p.score_risco && p.score_risco >= 80)
  ).length;

  const kpis = [
    {
      key: 'total',
      label: 'Total',
      value: total,
      icon: FileText,
      variant: 'default' as const,
      className: '',
      filter: () => onFilterApply({
        search: '',
        testemunha: '',
        uf: [],
        comarca: [],
        status: [],
        fase: [],
        classificacao: [],
        scoreRange: [0, 100],
        flags: { triangulacao: false, troca: false, prova: false, duplo: false }
      })
    },
    {
      key: 'com-testemunhas',
      label: 'Com Testemunhas Ativas',
      value: comTestemunhasAtivas,
      icon: Users,
      variant: 'secondary' as const,
      className: '',
      filter: () => onFilterApply({ 
        ...filters,
        // Aplicar filtro para mostrar apenas processos com testemunhas ativas > 0
        search: filters.search // Mantém busca atual mas vamos implementar lógica específica
      })
    },
    {
      key: 'sem-testemunhas',
      label: 'Sem Testemunhas',
      value: semTestemunhas,
      icon: UserMinus,
      variant: 'outline' as const,
      className: '',
      filter: () => onFilterApply({ 
        ...filters,
        // Aplicar filtro para mostrar apenas processos sem testemunhas
        search: filters.search
      })
    },
    {
      key: 'a-validar',
      label: 'A validar',
      value: aValidar,
      icon: AlertTriangle,
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      filter: () => onFilterApply({ 
        ...filters,
        classificacao: []
      })
    }
  ];

  // Só mostrar Risco Alto se houver dados
  if (riscoAlto > 0) {
    kpis.push({
      key: 'risco-alto',
      label: 'Risco alto',
      value: riscoAlto,
      icon: AlertCircle,
      variant: 'outline' as const,
      className: 'bg-red-100 text-red-800 hover:bg-red-200',
      filter: () => onFilterApply({ 
        ...filters,
        classificacao: ['Alto'],
        scoreRange: [80, 100]
      })
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Resumo:
          </span>
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Button
                key={kpi.key}
                variant="ghost"
                size="sm"
                onClick={kpi.filter}
                className={`h-8 px-3 gap-1.5 hover:bg-muted ${kpi.className || ''}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-medium">{kpi.label}</span>
                <Badge 
                  variant={kpi.variant}
                  className="ml-1 h-5 px-1.5 text-xs font-mono"
                >
                  {kpi.value}
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}