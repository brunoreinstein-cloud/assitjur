import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building2, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Database,
  Clock,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GlobalMetricsData {
  timestamp: string;
  total_organizations: number;
  total_users: number;
  total_processos: number;
  total_pessoas: number;
  total_conversations: number;
  total_messages: number;
  active_sessions_today: number;
  storage_usage_mb: number;
  openai_requests_today: number;
  openai_cost_today_cents: number;
  avg_response_time_ms: number;
  organizations_by_status?: {
    active?: number;
    inactive?: number;
  };
  users_by_role?: Record<string, number>;
}

export function GlobalMetrics() {
  const [metrics, setMetrics] = useState<GlobalMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_global_metrics');
      
      if (error) throw error;
      setMetrics(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar métricas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Não foi possível carregar as métricas globais.
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Organizações',
      value: metrics.total_organizations,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Usuários Ativos',
      value: metrics.total_users,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Processos',
      value: metrics.total_processos,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Pessoas',
      value: metrics.total_pessoas,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Conversas',
      value: metrics.total_conversations,
      icon: MessageSquare,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Sessões Hoje',
      value: metrics.active_sessions_today,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Storage (MB)',
      value: metrics.storage_usage_mb.toFixed(2),
      icon: Database,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Requests IA Hoje',
      value: metrics.openai_requests_today,
      icon: Clock,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      subtitle: `${metrics.avg_response_time_ms}ms avg`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {metric.subtitle && (
                    <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Custo IA */}
      {metrics.openai_cost_today_cents > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Custo IA Hoje</p>
              <p className="text-xl font-bold">
                R$ {(metrics.openai_cost_today_cents / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
