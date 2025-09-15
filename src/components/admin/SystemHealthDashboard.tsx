import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Database,
  Zap,
  Users,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react';
import { observability } from '@/lib/observability';
import { TestUtils } from '@/lib/testing-utilities';
import { SecurityStatusBanner } from '@/components/security/SecurityStatusBanner';

interface SystemMetrics {
  errors: {
    total: number;
    last24h: number;
    topErrors: Array<{error: string, count: number}>;
  };
  performance: {
    avgApiTime: number;
    slowQueries: number;
    memoryUsage: number;
  };
  usage: {
    activeUsers: number;
    totalSessions: number;
    peakConcurrency: number;
  };
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    services: Array<{name: string, status: 'up' | 'down' | 'degraded'}>;
    lastCheck: Date;
  };
}

/**
 * Dashboard de saúde do sistema para administradores
 * Mostra métricas, erros, performance e status geral
 */
export function SystemHealthDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      // Simular dados (em produção, viria de APIs específicas)
      const observabilityMetrics = observability.getMetricsSummary();
      const healthCheck = await TestUtils.healthCheck();
      
      const mockMetrics: SystemMetrics = {
        errors: {
          total: observabilityMetrics.errors,
          last24h: Math.floor(observabilityMetrics.errors * 0.7),
          topErrors: observabilityMetrics.topErrors
        },
        performance: {
          avgApiTime: observabilityMetrics.averageApiDuration || 245,
          slowQueries: 3,
          memoryUsage: healthCheck.memory.usage
        },
        usage: {
          activeUsers: 47,
          totalSessions: 234,
          peakConcurrency: 12
        },
        health: {
          overall: healthCheck.overall ? 'healthy' : 'warning',
          services: [
            { name: 'API Gateway', status: 'up' },
            { name: 'Database', status: 'up' },
            { name: 'Auth Service', status: healthCheck.overall ? 'up' : 'degraded' },
            { name: 'File Storage', status: 'up' },
            { name: 'Background Jobs', status: 'up' }
          ],
          lastCheck: new Date()
        }
      };
      
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading system metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthBadge = (status: string) => {
    const variants = {
      healthy: { variant: 'default' as const, icon: CheckCircle, text: 'Saudável', color: 'text-green-600' },
      warning: { variant: 'secondary' as const, icon: AlertTriangle, text: 'Atenção', color: 'text-yellow-600' },
      critical: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Crítico', color: 'text-red-600' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.warning;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.text}
      </Badge>
    );
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 animate-pulse" />
            Carregando métricas do sistema...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Banner */}
      <SecurityStatusBanner />
      
      {/* Header com status geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <div>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>
                  Última atualização: {lastUpdate.toLocaleTimeString()}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getHealthBadge(metrics.health.overall)}
              <Button variant="outline" size="sm" onClick={loadMetrics}>
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{metrics.usage.activeUsers}</div>
            <div className="text-sm text-muted-foreground">Usuários ativos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold">{metrics.errors.total}</div>
            <div className="text-sm text-muted-foreground">Erros (5min)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{Math.round(metrics.performance.avgApiTime)}ms</div>
            <div className="text-sm text-muted-foreground">Tempo médio API</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">
              {Math.round(metrics.performance.memoryUsage / 1024 / 1024)}MB
            </div>
            <div className="text-sm text-muted-foreground">Uso de memória</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas críticos */}
      {metrics.health.overall !== 'healthy' && (
        <Alert variant={metrics.health.overall === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>
              {metrics.health.overall === 'critical' ? 'Sistema em estado crítico' : 'Atenção necessária'}
            </strong>
            <div className="mt-2">
              {metrics.health.services
                .filter(s => s.status !== 'up')
                .map(service => (
                  <div key={service.name} className="text-sm">
                    • {service.name}: {service.status === 'degraded' ? 'degradado' : 'indisponível'}
                  </div>
                ))
              }
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detalhes em abas */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Uso</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Status dos Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.health.services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{service.name}</span>
                    <Badge 
                      variant={service.status === 'up' ? 'default' : 'secondary'}
                      className={getServiceStatusColor(service.status)}
                    >
                      {service.status === 'up' ? 'Online' : 
                       service.status === 'degraded' ? 'Degradado' : 'Offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Principais Erros
              </CardTitle>
              <CardDescription>
                Erros mais frequentes nas últimas 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.errors.topErrors.length > 0 ? (
                <div className="space-y-3">
                  {metrics.errors.topErrors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{error.error}</span>
                      </div>
                      <Badge variant="secondary">{error.count}x</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  Nenhum erro registrado recentemente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Tempo médio de API</span>
                  <Badge variant={metrics.performance.avgApiTime > 1000 ? 'destructive' : 'default'}>
                    {Math.round(metrics.performance.avgApiTime)}ms
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Queries lentas</span>
                  <Badge variant={metrics.performance.slowQueries > 5 ? 'destructive' : 'default'}>
                    {metrics.performance.slowQueries}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Uso de memória</span>
                  <Badge>
                    {Math.round(metrics.performance.memoryUsage / 1024 / 1024)}MB
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {metrics.performance.avgApiTime > 1000 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>APIs lentas detectadas. Considere otimização.</span>
                    </div>
                  )}
                  {metrics.performance.slowQueries > 5 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Queries de banco lentas. Revise índices.</span>
                    </div>
                  )}
                  {metrics.performance.memoryUsage > 50 * 1024 * 1024 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Alto uso de memória. Verifique memory leaks.</span>
                    </div>
                  )}
                  {metrics.performance.avgApiTime <= 1000 && 
                   metrics.performance.slowQueries <= 5 && 
                   metrics.performance.memoryUsage <= 50 * 1024 * 1024 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Performance dentro do esperado.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{metrics.usage.activeUsers}</div>
                  <div className="text-sm text-muted-foreground">Usuários ativos agora</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{metrics.usage.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Sessões hoje</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{metrics.usage.peakConcurrency}</div>
                  <div className="text-sm text-muted-foreground">Pico de concorrência</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}