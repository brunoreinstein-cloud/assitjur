import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  FileText,
  BarChart3
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
}

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [exportLoading, setExportLoading] = useState(false);

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
      
      // Create download link
      const blob = new Blob([data.content], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${selectedPeriod}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Relatório ${format.toUpperCase()} exportado com sucesso`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedAnalytics(selectedPeriod);
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
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada de Uso</CardTitle>
              <CardDescription>
                Padrões de consumo e comportamento dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                📊 Gráficos de uso detalhado serão exibidos aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Padrões Detectados pela IA</CardTitle>
              <CardDescription>
                Análises automatizadas de padrões nos dados jurídicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                🧠 Análise de padrões em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recomendações Estratégicas</CardTitle>
              <CardDescription>
                Sugestões baseadas nos dados coletados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-blue-700">Otimização de Custos</h4>
                <p className="text-sm text-muted-foreground">
                  Considere usar GPT-4o-mini para consultas simples, podendo reduzir custos em 40%
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-green-700">Melhoria de Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Implementar cache para consultas recorrentes pode reduzir tempo de resposta em 25%
                </p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-medium text-orange-700">Análise de Risco</h4>
                <p className="text-sm text-muted-foreground">
                  Foco especial na Comarca X - 67% dos processos apresentam alto risco
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;