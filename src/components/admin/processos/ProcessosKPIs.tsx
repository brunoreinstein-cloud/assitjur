import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  UserMinus, 
  AlertTriangle, 
  AlertCircle 
} from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
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

  // Agrupar KPIs em blocos semânticos: Volume e Risco
  const volumeKPIs = [
    {
      key: 'total',
      label: 'Total de Processos',
      value: total,
      icon: FileText,
      variant: 'volume' as const,
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
      label: 'Com Testemunhas',
      value: comTestemunhasAtivas,
      icon: Users,
      variant: 'volume' as const,
      filter: () => onFilterApply({ 
        ...filters,
        search: filters.search
      })
    },
    {
      key: 'sem-testemunhas',
      label: 'Sem Testemunhas',
      value: semTestemunhas,
      icon: UserMinus,
      variant: 'default' as const,
      filter: () => onFilterApply({ 
        ...filters,
        search: filters.search
      })
    },
  ];

  const riscoKPIs = [
    {
      key: 'a-validar',
      label: 'A Validar',
      value: aValidar,
      icon: AlertTriangle,
      variant: 'warning' as const,
      filter: () => onFilterApply({ 
        ...filters,
        classificacao: []
      })
    },
  ];

  // Só mostrar Risco Alto se houver dados > 0
  if (riscoAlto > 0) {
    riscoKPIs.push({
      key: 'risco-alto',
      label: 'Risco Alto',
      value: riscoAlto,
      icon: AlertCircle,
      variant: 'warning' as const,
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
        <div className="space-y-4">
          {/* Bloco Volume */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Volume
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {volumeKPIs.map((kpi) => (
                <KPICard
                  key={kpi.key}
                  label={kpi.label}
                  value={kpi.value}
                  icon={kpi.icon}
                  variant={kpi.variant}
                  onClick={kpi.filter}
                />
              ))}
            </div>
          </div>

          {/* Bloco Risco - só aparece se houver items */}
          {riscoKPIs.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Risco
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {riscoKPIs.map((kpi) => (
                  <KPICard
                    key={kpi.key}
                    label={kpi.label}
                    value={kpi.value}
                    icon={kpi.icon}
                    variant={kpi.variant}
                    onClick={kpi.filter}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}