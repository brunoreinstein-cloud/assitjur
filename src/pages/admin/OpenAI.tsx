import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Activity, DollarSign, Zap, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const OpenAIOverview = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['org-settings', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', profile?.organization_id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch recent usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['usage-stats', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openai_logs')
        .select('*')
        .eq('org_id', profile?.organization_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const totalCost = data?.reduce((sum, log) => sum + (log.cost_cents || 0), 0) || 0;
      const avgLatency = data?.length ? 
        data.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / data.length : 0;
      
      return {
        requests24h: data?.length || 0,
        cost24h: totalCost,
        avgLatency: Math.round(avgLatency),
        activeModel: settings?.model || 'gpt-4o-mini'
      };
    },
    enabled: !!profile?.organization_id && !!settings,
  });

  // Toggle OpenAI integration
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase.functions.invoke('admin-openai-settings', {
        body: { 
          action: 'toggle',
          enabled
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      toast({
        title: "Configuração atualizada",
        description: "Integração OpenAI foi alterada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar configuração",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isEnabled = settings?.openai_enabled || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integração OpenAI</h1>
          <p className="text-muted-foreground">
            Geренаre análises inteligentes com IA
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {isEnabled ? 'Ativo' : 'Desativado'}
          </span>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            disabled={toggleMutation.isPending}
          />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status da API</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={isEnabled ? "default" : "secondary"}>
                {isEnabled ? "Ativa" : "Desativada"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isEnabled 
                ? "A API da OpenAI está ativa para esta organização." 
                : "Integração desativada"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modelo Ativo</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.activeModel || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Latência média: {usageStats?.avgLatency || 0}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.requests24h || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              requisições nas últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo 24h</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((usageStats?.cost24h || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              estimado das últimas 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Configure e monitore sua integração OpenAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <a href="/admin/ia/chaves">
                <Settings className="h-6 w-6 mb-2" />
                Gerenciar Chaves
              </a>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" asChild>
              <a href="/admin/ia/modelos">
                <Zap className="h-6 w-6 mb-2" />
                Configurar Modelos
              </a>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" asChild>
              <a href="/admin/ia/prompt-studio">
                <Settings className="h-6 w-6 mb-2" />
                Prompt Studio
              </a>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" asChild>
              <a href="/admin/ia/testes">
                <Activity className="h-6 w-6 mb-2" />
                Playground
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isEnabled && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Configuração Necessária</CardTitle>
            <CardDescription className="text-orange-700">
              Para usar a integração OpenAI, você precisa:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-700">
            <ol className="list-decimal list-inside space-y-2">
              <li>Adicionar uma chave API válida em <strong>Gerenciar Chaves</strong></li>
              <li>Configurar o modelo desejado em <strong>Configurar Modelos</strong></li>
              <li>Ativar a integração usando o switch acima</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpenAIOverview;