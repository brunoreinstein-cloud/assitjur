import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Activity,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  UsageChart,
  RiskDistributionChart,
  ComarcaRiskChart,
  TokensChart,
} from "@/components/analytics/AnalyticsCharts";
import { ReviewUpdateButton } from "@/components/admin/ReviewUpdateButton";
import { DatabaseCleanupButton } from "@/components/admin/DatabaseCleanupButton";
import { WitnessDataProcessor } from "@/components/admin/WitnessDataProcessor";

interface OverviewData {
  counts: {
    processos: number;
    pessoas: number;
    conversations: number;
    activeVersion: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  recentActivity: any[];
}

interface UsageData {
  dailyUsage: any[];
  userStats: any[];
  totalStats: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgResponseTime: number;
  };
}

interface RiskPatternData {
  comarcaStats: any[];
  tribunalStats: any[];
  totalProcessos: number;
  avgRisk: number;
  highRiskPercentage: number;
}

const Dashboard = () => {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [riskPatternData, setRiskPatternData] =
    useState<RiskPatternData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async (type: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-analytics",
        {
          body: { type },
        },
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Erro ao carregar dados analíticos");
      return null;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const overview = await fetchAnalytics("overview");
      if (overview) {
        setOverviewData(overview);
      }
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const loadTabData = async (tab: string) => {
    if (tab === "usage" && !usageData) {
      const usage = await fetchAnalytics("usage");
      if (usage) setUsageData(usage);
    } else if (tab === "risk_patterns" && !riskPatternData) {
      const riskData = await fetchAnalytics("risk_patterns");
      if (riskData) setRiskPatternData(riskData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Analítico
        </h1>
        <p className="text-muted-foreground">
          Insights avançados e métricas do sistema
        </p>
      </div>

      {/* Operações de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Operações de Dados
          </CardTitle>
          <CardDescription>
            Ferramentas administrativas para manutenção e otimização da base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <ReviewUpdateButton />
            <DatabaseCleanupButton />
          </div>
        </CardContent>
      </Card>

      {/* Processamento de Testemunhas */}
      <WitnessDataProcessor />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          loadTabData(value);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="usage">Uso & Custos</TabsTrigger>
          <TabsTrigger value="risk_patterns">Padrões de Risco</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Processos
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewData?.counts?.processos?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registros na base ativa
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pessoas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewData?.counts?.pessoas?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cadastros únicos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewData?.counts?.conversations || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Interações com IA
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Versão Ativa
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  v{overviewData?.counts?.activeVersion || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Base de dados atual
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <RiskDistributionChart
              data={
                overviewData?.riskDistribution || { low: 0, medium: 0, high: 0 }
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas interações com o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overviewData?.recentActivity
                    ?.slice(0, 5)
                    .map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.role === "user" ? "Pergunta" : "Resposta"}{" "}
                            - Conversa
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                      </div>
                    )) || (
                    <div className="text-center text-muted-foreground py-4">
                      Nenhuma atividade recente
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {usageData ? (
            <>
              {/* Usage Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Consultas
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {usageData.totalStats.totalRequests.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Últimos 30 dias
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Custo Total
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(usageData.totalStats.totalCost / 100).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">OpenAI API</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tokens Processados
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(usageData.totalStats.totalTokens / 1000).toFixed(1)}K
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Entrada + Saída
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tempo Médio
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(usageData.totalStats.avgResponseTime / 1000).toFixed(1)}
                      s
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Resposta da API
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Charts */}
              <div className="grid gap-6">
                <UsageChart data={usageData.dailyUsage} />
                <TokensChart data={usageData.dailyUsage} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk_patterns" className="space-y-6">
          {riskPatternData ? (
            <>
              {/* Risk Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Risco Médio Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {riskPatternData.avgRisk?.toFixed(1) || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      De {riskPatternData.totalProcessos} processos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Alto Risco
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {riskPatternData.highRiskPercentage?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Processos com score ≥ 8
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Total Analisado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {riskPatternData.totalProcessos?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Processos com score
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Charts */}
              <ComarcaRiskChart data={riskPatternData.comarcaStats} />
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>
                Em desenvolvimento - métricas de sistema e performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                🚧 Funcionalidade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
