/**
 * ✅ Consent Metrics Dashboard Component
 * 
 * Displays comprehensive consent analytics and compliance metrics
 * for administrators and compliance officers.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  getConsentMetrics, 
  getConsentAnalytics, 
  exportConsentData,
  type ConsentMetrics
} from '@/lib/consent-metrics';
import { Download, RefreshCw, Shield, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export function ConsentMetrics() {
  const [metrics, setMetrics] = useState<ConsentMetrics | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = () => {
    setLoading(true);
    try {
      const consentMetrics = getConsentMetrics();
      const consentAnalytics = getConsentAnalytics();
      
      setMetrics(consentMetrics);
      setAnalytics(consentAnalytics);
    } catch (error) {
      console.error('Error loading consent metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleExport = () => {
    try {
      const data = exportConsentData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting consent data:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Métricas de Consentimento</h2>
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Carregando...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics || !analytics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar métricas</h3>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar as métricas de consentimento.
        </p>
        <Button onClick={loadMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métricas de Consentimento</h2>
          <p className="text-muted-foreground">
            Acompanhe a conformidade LGPD e o comportamento dos usuários
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Consentimento</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.consentRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalUsers} usuários totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.analyticsConsentRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Consentimento para medição
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.marketingConsentRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Consentimento para publicidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.complianceScore.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Score de conformidade LGPD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Atual do Consentimento</CardTitle>
            <CardDescription>
              Estado atual das preferências de consentimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analytics</span>
              <Badge variant={metrics.hasAnalyticsConsent ? "default" : "secondary"}>
                {metrics.hasAnalyticsConsent ? "Permitido" : "Negado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Marketing</span>
              <Badge variant={metrics.hasMarketingConsent ? "default" : "secondary"}>
                {metrics.hasMarketingConsent ? "Permitido" : "Negado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Consentimento Válido</span>
              <Badge variant={metrics.isConsentValid ? "default" : "destructive"}>
                {metrics.isConsentValid ? "Válido" : "Inválido"}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Versão da Política</span>
                <span className="font-mono">{metrics.consentVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Idade do Consentimento</span>
                <span>{metrics.consentAge ? `${metrics.consentAge} dias` : "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Mudanças Totais</span>
                <span>{metrics.totalConsentChanges}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scores de Conformidade</CardTitle>
            <CardDescription>
              Métricas de conformidade e privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score de Conformidade</span>
                <span className="font-semibold">{metrics.consentComplianceScore}%</span>
              </div>
              <Progress value={metrics.consentComplianceScore} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score de Privacidade</span>
                <span className="font-semibold">{metrics.privacyScore}%</span>
              </div>
              <Progress value={metrics.privacyScore} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Interpretação dos Scores</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Conformidade:</strong> Mede a implementação correta do sistema de consentimento</p>
                <p><strong>Privacidade:</strong> Mede o respeito à privacidade do usuário (maior = mais privado)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status de Conformidade LGPD</CardTitle>
          <CardDescription>
            Verificação dos requisitos de conformidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${metrics.hasAnyConsent ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Consentimento Implementado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${metrics.consentVersion !== 'unknown' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Versionamento</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${metrics.consentAge !== null ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Controle de Expiração</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${metrics.totalConsentChanges > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Histórico de Mudanças</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${metrics.consentComplianceScore >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Score de Conformidade</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${metrics.privacyScore >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm">Score de Privacidade</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
