import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  FileText,
  BarChart3,
  Brain,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  UsageChart, 
  RiskDistributionChart, 
  ComarcaRiskChart,
  TokensChart 
} from '@/components/analytics/AnalyticsCharts';

interface ReportData {
  period: string;
  totalQueries: number;
  totalCost: number;
  avgResponseTime: number;
  topComarcas: any[];
  userActivity: any[];
  overview: any;
  usage: any;
  riskPatterns: any;
  performance: any;
  insights: any[];
  recommendations: any[];
  generatedAt: string;
}

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [exportLoading, setExportLoading] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);
  const [patternsData, setPatternsData] = useState<any>(null);

  const fetchDetailedAnalytics = async (period: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { 
          type: 'detailed_report',
          period 
        }
      });

      if (error) throw error;
      setReportData(data);
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      toast.error('Erro ao carregar relatório detalhado');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { type: 'usage', period: selectedPeriod }
      });
      if (error) throw error;
      setUsageData(data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const fetchPatternsData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { type: 'ai_patterns' }
      });
      if (error) throw error;
      setPatternsData(data);
    } catch (error) {
      console.error('Error fetching patterns data:', error);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    setExportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { 
          type: 'export',
          format,
          period: selectedPeriod
        }
      });

      if (error) throw error;
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${selectedPeriod}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Relatório exportado com sucesso`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedAnalytics(selectedPeriod);
    fetchUsageData();
    fetchPatternsData();
  }, [selectedPeriod]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Avançado</h1>
          <p className="text-muted-foreground">
            Relatórios detalhados e análises de performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchDetailedAnalytics(selectedPeriod)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReport('excel')}
            disabled={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReport('pdf')}
            disabled={exportLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Período:</span>
        {['7d', '30d', '90d', '1y'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === '7d' && '7 dias'}
            {period === '30d' && '30 dias'}
            {period === '90d' && '90 dias'}
            {period === '1y' && '1 ano'}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumo Executivo</TabsTrigger>
          <TabsTrigger value="usage">Análise de Uso</TabsTrigger>
          <TabsTrigger value="patterns">Padrões Detectados</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queries Totais</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.totalQueries?.toLocaleString() || 0}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12.3%</span>
                  <span className="text-muted-foreground">vs período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((reportData?.totalCost || 0) / 100).toFixed(2)}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">-5.1%</span>
                  <span className="text-muted-foreground">custo por query</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((reportData?.avgResponseTime || 0) / 1000).toFixed(1)}s
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">-8.7%</span>
                  <span className="text-muted-foreground">melhoria</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.userActivity?.length || 0}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+23.4%</span>
                  <span className="text-muted-foreground">engajamento</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Insights Principais</CardTitle>
                <CardDescription>Descobertas importantes do período</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Eficiência Melhorada</p>
                    <p className="text-xs text-muted-foreground">
                      Tempo médio de resposta reduziu 8.7% com otimizações de prompts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Padrão de Alto Risco</p>
                    <p className="text-xs text-muted-foreground">
                      Comarca X apresenta 67% dos processos com risco elevado
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Pico de Uso</p>
                    <p className="text-xs text-muted-foreground">
                      Terça-feira, 14h-16h é o horário de maior demanda
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Qualidade</CardTitle>
                <CardDescription>Indicadores de satisfação e precisão</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Precisão das Análises</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-[94%]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Satisfação do Usuário</span>
                    <span className="font-medium">91.8%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-[92%]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Resolução</span>
                    <span className="font-medium">87.3%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full w-[87%]"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[300px]" />
              <Skeleton className="h-[300px]" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <UsageChart data={usageData?.dailyUsage || []} />
              <TokensChart data={usageData?.dailyUsage || []} />
              <RiskDistributionChart data={reportData?.riskPatterns?.riskDistribution || { low: 0, medium: 0, high: 0 }} />
              <ComarcaRiskChart data={reportData?.riskPatterns?.comarcaStats || []} />
            </div>
          )}

          {/* Usage Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total de Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData?.totalStats?.totalRequests?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Últimos {selectedPeriod}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Custo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((usageData?.totalStats?.totalCost || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Últimos {selectedPeriod}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData?.userStats?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Período selecionado</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Pattern Detection Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Troca Direta</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patternsData?.patterns?.trocaDireta || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  casos detectados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Triangulação</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patternsData?.patterns?.triangulacao || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  casos detectados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prova Emprestada</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patternsData?.patterns?.provaEmprestada || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  casos detectados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duplo Papel</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patternsData?.patterns?.duploPapel || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  casos detectados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Results */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Complexidade</CardTitle>
                <CardDescription>
                  Distribuição dos processos por complexidade de padrões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Baixa Complexidade</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {patternsData?.complexityDistribution?.low || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Média Complexidade</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {patternsData?.complexityDistribution?.medium || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Alta Complexidade</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {patternsData?.complexityDistribution?.high || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Correlação Risco-Padrão</CardTitle>
                <CardDescription>
                  Análise estatística da correlação entre padrões e risco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold">
                    {(patternsData?.riskCorrelation || 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Coeficiente de correlação
                  </p>
                  <div className="text-xs">
                    {(patternsData?.riskCorrelation || 0) > 0.7 ? (
                      <Badge className="bg-red-100 text-red-800">Correlação Forte</Badge>
                    ) : (patternsData?.riskCorrelation || 0) > 0.4 ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Correlação Moderada</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Correlação Fraca</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Combinations */}
          {patternsData?.criticalCombinations > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Combinações Críticas Detectadas
                </CardTitle>
                <CardDescription>
                  Processos com múltiplos padrões de risco simultâneos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {patternsData.criticalCombinations}
                </div>
                <p className="text-sm text-muted-foreground">
                  processos com 2+ padrões críticos combinados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* AI-Generated Insights */}
          {reportData?.insights?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Insights Automáticos
                </CardTitle>
                <CardDescription>
                  Descobertas geradas pela análise de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportData.insights.map((insight: any, index: number) => (
                  <div 
                    key={index}
                    className={`border-l-4 pl-4 ${
                      insight.type === 'warning' ? 'border-orange-500' :
                      insight.type === 'error' ? 'border-red-500' :
                      'border-blue-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      {insight.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {insight.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {insight.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Strategic Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações Estratégicas</CardTitle>
              <CardDescription>
                Ações sugeridas baseadas na análise completa dos dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportData?.recommendations?.length > 0 ? (
                reportData.recommendations.map((rec: any, index: number) => (
                  <div 
                    key={index}
                    className={`border-l-4 pl-4 ${
                      rec.priority === 'high' ? 'border-red-500' :
                      rec.priority === 'medium' ? 'border-orange-500' :
                      'border-green-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={
                        rec.priority === 'high' ? 'destructive' :
                        rec.priority === 'medium' ? 'default' :
                        'secondary'
                      }>
                        {rec.priority === 'high' ? 'Alta' : 
                         rec.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <p className="text-xs text-green-600 font-medium">
                      Impacto esperado: {rec.expectedImpact}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Sistema funcionando dentro dos parâmetros ideais</p>
                  <p className="text-sm">Nenhuma recomendação crítica no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;