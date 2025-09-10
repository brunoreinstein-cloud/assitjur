import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Download, 
  Filter, 
  Calendar, 
  User, 
  Database,
  Shield,
  FileText,
  Search,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AccessLog {
  id: string;
  user_id: string;
  accessed_table: string;
  accessed_records?: string[];
  access_type: string;
  ip_address?: unknown;
  user_agent?: string;
  created_at: string;
  profiles?: any;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id?: string;
  fields_masked?: any;
  ip?: string;
  ua?: string;
  created_at: string;
  profiles?: any;
}

export default function AuditPanel() {
  const { user } = useAuth();
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateFilter));

      // Fetch access logs
      const { data: accessData, error: accessError } = await supabase
        .from('data_access_logs')
        .select(`
          *,
          profiles:user_id (
            email,
            role
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (accessError) {
        console.error('Error fetching access logs:', accessError);
      } else {
        setAccessLogs(accessData || []);
      }

      // Fetch audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          entity,
          entity_id,
          fields_masked,
          ip,
          ua,
          created_at,
          profiles:user_id (email)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) {
        console.error('Error fetching audit logs:', auditError);
      } else {
        setAuditLogs([]); // TODO: Re-enable when audit_logs entity column exists
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        period: dateFilter,
        generated_at: new Date().toISOString(),
        access_logs: accessLogs.length,
        audit_logs: auditLogs.length,
        summary: {
          unique_users: new Set(accessLogs.map(log => log.user_id)).size,
          tables_accessed: new Set(accessLogs.map(log => log.accessed_table)).size,
          most_accessed_table: getMostAccessedTable(),
          peak_activity_hour: getPeakActivityHour()
        },
        details: {
          access_logs: accessLogs,
          audit_logs: auditLogs
        }
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Relatório de auditoria exportado com sucesso');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const getMostAccessedTable = () => {
    const tableCounts = accessLogs.reduce((acc, log) => {
      acc[log.accessed_table] = (acc[log.accessed_table] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tableCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
  };

  const getPeakActivityHour = () => {
    const hourCounts = accessLogs.reduce((acc, log) => {
      const hour = new Date(log.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return peakHour ? `${peakHour}:00` : 'N/A';
  };

  const getTableDisplayName = (tableName: string) => {
    const names = {
      processos: 'Processos',
      pessoas: 'Pessoas',
      audit_logs: 'Logs de Auditoria',
      data_access_logs: 'Logs de Acesso',
      lgpd_requests: 'Solicitações LGPD'
    };
    return names[tableName as keyof typeof names] || tableName;
  };

  const getAccessTypeBadge = (type: string) => {
    const config = {
      SELECT: { variant: 'secondary' as const, text: 'Consulta' },
      INSERT: { variant: 'default' as const, text: 'Inserção' },
      UPDATE: { variant: 'default' as const, text: 'Atualização' },
      DELETE: { variant: 'destructive' as const, text: 'Exclusão' },
      EXPORT: { variant: 'outline' as const, text: 'Export' }
    };

    const { variant, text } = config[type as keyof typeof config] || config.SELECT;
    return <Badge variant={variant}>{text}</Badge>;
  };

  const filteredAccessLogs = accessLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.accessed_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTable = selectedTable === 'all' || log.accessed_table === selectedTable;
    
    return matchesSearch && matchesTable;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesUser = !userFilter ||
      log.profiles?.email?.toLowerCase().includes(userFilter.toLowerCase());

    return matchesSearch && matchesAction && matchesUser;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
          <p>Carregando painel de auditoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Painel de Auditoria
          </h1>
          <p className="text-muted-foreground">
            Transparência total sobre acesso aos seus dados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button onClick={fetchLogs} variant="outline">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acessos (Período)</p>
                <p className="text-2xl font-bold">{accessLogs.length}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Únicos</p>
                <p className="text-2xl font-bold">{new Set(accessLogs.map(log => log.user_id)).size}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tabelas Acessadas</p>
                <p className="text-2xl font-bold">{new Set(accessLogs.map(log => log.accessed_table)).size}</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ações de Auditoria</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tabela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tabelas</SelectItem>
                  <SelectItem value="processos">Processos</SelectItem>
                  <SelectItem value="pessoas">Pessoas</SelectItem>
                  <SelectItem value="audit_logs">Logs de Auditoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="EXPORT_PROCESSOS">Exportação</SelectItem>
                  <SelectItem value="DELETE">Deleção</SelectItem>
                  <SelectItem value="UPDATE_PERMISSION">Permissões</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Input
                placeholder="Filtrar por usuário"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por email, ação ou tabela..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert LGPD */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Transparência LGPD:</strong> Este painel oferece visibilidade completa sobre quem acessa 
          seus dados, quando e que tipo de operação foi realizada, conforme Art. 9º da LGPD.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList>
          <TabsTrigger value="access">Logs de Acesso</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="summary">Resumo Executivo</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4">
          <div className="space-y-4">
            {filteredAccessLogs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum acesso encontrado no período selecionado</p>
                </CardContent>
              </Card>
            ) : (
              filteredAccessLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getTableDisplayName(log.accessed_table)}</span>
                          {getAccessTypeBadge(log.access_type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Por: {log.profiles?.email || 'Sistema'} ({log.profiles?.role || 'SYSTEM'})
                        </p>
                        {log.accessed_records && log.accessed_records.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Registros afetados: {log.accessed_records.length}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{new Date(log.created_at).toLocaleString('pt-BR')}</div>
                        {log.ip_address && (
                          <div className="text-xs">IP: {String(log.ip_address)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="space-y-4">
            {filteredAuditLogs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma ação de auditoria encontrada</p>
                </CardContent>
              </Card>
            ) : (
              filteredAuditLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.action}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Por: {log.profiles?.email || 'Sistema'} • Entidade: {log.entity}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo Executivo - Acesso aos Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Tabela Mais Acessada</h4>
                    <p className="text-lg">{getTableDisplayName(getMostAccessedTable())}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Horário de Pico</h4>
                    <p className="text-lg">{getPeakActivityHour()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Distribuição por Tipo de Acesso</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT'].map(type => {
                      const count = accessLogs.filter(log => log.access_type === type).length;
                      return (
                        <div key={type} className="text-center p-3 border rounded">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">{type}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Compliance Note:</strong> Todos os acessos são registrados automaticamente 
                    para garantir transparência e conformidade com a LGPD. Este relatório pode ser 
                    exportado a qualquer momento para auditorias internas ou externas.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}