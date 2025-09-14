import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRightLeft, Users, TrendingUp } from "lucide-react";
import { useMapaTestemunhasStore } from "@/lib/store/mapa-testemunhas";
import { useMemo, useCallback } from "react";

interface RiskStats {
  triangulacoes: number;
  trocas: number;
  provas: number;
  total: number;
}

export const RiskPanel = () => {
  const activeTab = useMapaTestemunhasStore((s) => s.activeTab);
  const processos = useMapaTestemunhasStore((s) => s.processos);
  const setProcessoFilters = useMapaTestemunhasStore((s) => s.setProcessoFilters);

  const stats = useMemo<RiskStats>(() => {
    if (activeTab !== 'processos') {
      return { triangulacoes: 0, trocas: 0, provas: 0, total: 0 };
    }

    return {
      triangulacoes: processos.filter((p) => p.triangulacao_confirmada).length,
      trocas: processos.filter((p) => p.troca_direta).length,
      provas: processos.filter((p) => p.contem_prova_emprestada).length,
      total: processos.length,
    };
  }, [activeTab, processos]);

  const filterCallbacks = useMemo(
    () => ({
      triangulacao: () => setProcessoFilters({ temTriangulacao: true }),
      troca: () => setProcessoFilters({ temTroca: true }),
      prova: () => setProcessoFilters({ temProvaEmprestada: true }),
    }),
    [setProcessoFilters]
  );

  const riskItems = useMemo(
    () => [
      {
        id: 'triangulacao',
        title: 'Triangulações',
        description: 'Processos com triangulação confirmada',
        count: stats.triangulacoes,
        total: stats.total,
        icon: Users,
        color: 'text-destructive',
        bgColor: 'bg-destructive/5 hover:bg-destructive/10',
        borderColor: 'border-destructive/20',
        onClick: filterCallbacks.triangulacao,
      },
      {
        id: 'troca',
        title: 'Trocas Diretas',
        description: 'Processos com troca direta identificada',
        count: stats.trocas,
        total: stats.total,
        icon: ArrowRightLeft,
        color: 'text-warning',
        bgColor: 'bg-warning/5 hover:bg-warning/10',
        borderColor: 'border-warning/20',
        onClick: filterCallbacks.troca,
      },
      {
        id: 'prova',
        title: 'Provas Emprestadas',
        description: 'Processos com prova emprestada detectada',
        count: stats.provas,
        total: stats.total,
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor:
          'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-900/30',
        onClick: filterCallbacks.prova,
      },
    ],
    [stats, filterCallbacks]
  );

  const getPercentage = useCallback((count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }, []);

  const getVariantByPercentage = useCallback((percentage: number) => {
    if (percentage >= 20) return 'destructive';
    if (percentage >= 10) return 'secondary';
    return 'outline';
  }, []);

  if (activeTab !== 'processos') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {riskItems.map((item) => {
        const percentage = getPercentage(item.count, item.total);
        const Icon = item.icon;
        
        return (
          <Card 
            key={item.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${item.bgColor} border ${item.borderColor}`}
            onClick={item.onClick}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  {item.title}
                </div>
                {percentage > 0 && (
                  <Badge variant={getVariantByPercentage(percentage)} className="text-xs">
                    {percentage}%
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end justify-between">
                <div>
                  <div className={`text-2xl font-bold ${item.color}`}>
                    {item.count.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    de {item.total.toLocaleString()} processos
                  </div>
                </div>
                {item.count > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`h-8 text-xs ${item.color} hover:bg-current/10`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};