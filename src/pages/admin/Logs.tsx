import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Bot,
  Shield,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  user_id?: string;
  email?: string;
  role?: 'ADMIN' | 'ANALYST' | 'VIEWER';
  result: string;
  ip_address?: unknown;
  user_agent?: string;
  metadata?: any;
  organization_id?: string;
  created_at: string;
}

interface OpenAILog {
  id: string;
  user_id: string;
  model: string;
  request_type: string;
  status_code: number;
  duration_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_cents: number;
  streaming: boolean;
  error_code?: string;
  created_at: string;
}

interface DatabaseLog {
  id: string;
  identifier: string;
  timestamp: number;
  event_message: string;
  error_severity?: string;
}

interface SystemLog {
  id: string;
  function_id: string;
  timestamp: number;
  event_message: string;
  event_type: string;
  level: string;
}

const Logs = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [openaiLogs, setOpenaiLogs] = useState<OpenAILog[]>([]);
  const [databaseLogs, setDatabaseLogs] = useState<DatabaseLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [filterPeriod, setFilterPeriod] = useState('today');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLogs();
    }
  }, [profile?.organization_id, activeTab, filterPeriod]);

  const fetchLogs = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        await fetchAuditLogs();
      } else if (activeTab === 'openai') {
        await fetchOpenAILogs();
      } else if (activeTab === 'database') {
        await fetchDatabaseLogs();
      } else if (activeTab === 'system') {
        await fetchSystemLogs();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    const dateFilter = getDateFilter();
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', profile?.organization_id)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setAuditLogs(data || []);
  };

  const fetchOpenAILogs = async () => {
    const dateFilter = getDateFilter();
    
    const { data, error } = await supabase
      .from('openai_logs')
      .select('*')
      .eq('org_id', profile?.organization_id)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setOpenaiLogs(data || []);
  };

  const fetchDatabaseLogs = async () => {
    try {
      const query = `
        select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity 
        from postgres_logs
        cross join unnest(metadata) as m
        cross join unnest(m.parsed) as parsed
        order by timestamp desc
        limit 100
      `;

      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { query }
      });

      if (error) throw error;
      setDatabaseLogs(data?.data || []);
    } catch (error) {
      console.error('Error fetching database logs:', error);
      setDatabaseLogs([]);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const query = `
        select id, function_edge_logs.timestamp, event_message, 
               m.function_id, m.deployment_id, 'edge_function' as event_type, 'info' as level
        from function_edge_logs
        cross join unnest(metadata) as m
        order by timestamp desc
        limit 100
      `;

      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { query }
      });

      if (error) throw error;
      setSystemLogs(data?.data || []);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      setSystemLogs([]);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (filterPeriod) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
    toast({
      title: "Logs atualizados",
      description: "Os logs foram recarregados com sucesso"
    });
  };

  const getStatusBadge = (result: string) => {
    switch (result.toLowerCase()) {
      case 'success':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-destructive text-destructive-foreground"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-warning-foreground"><AlertCircle className="w-3 h-3 mr-1" />Aviso</Badge>;
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  const getHttpStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge className="bg-success text-success-foreground">{statusCode}</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge className="bg-warning text-warning-foreground">{statusCode}</Badge>;
    } else if (statusCode >= 500) {
      return <Badge className="bg-destructive text-destructive-foreground">{statusCode}</Badge>;
    }
    return <Badge variant="secondary">{statusCode}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCost = (costCents: number) => {
    return `R$ ${(costCents / 100).toFixed(4)}`;
  };

  const filteredAuditLogs = auditLogs.filter(log => 
    searchTerm === '' || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOpenAILogs = openaiLogs.filter(log => 
    searchTerm === '' || 
    log.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.error_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDatabaseLogs = databaseLogs.filter(log => 
    searchTerm === '' || 
    log.event_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.error_severity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSystemLogs = systemLogs.filter(log => 
    searchTerm === '' || 
    log.event_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.function_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs do Sistema</h1>
        <p className="text-muted-foreground">
          Visualize e monitore atividades do sistema, auditoria e integrações
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            OpenAI
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Logs de Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{log.email || 'Sistema'}</span>
                            {log.role && <span className="text-xs text-muted-foreground">{log.role}</span>}
                          </div>
                        </TableCell>
                        <TableCell>{log.resource || '-'}</TableCell>
                        <TableCell>{getStatusBadge(log.result)}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ip_address?.toString() || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Logs OpenAI
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpenAILogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.model}</Badge>
                        </TableCell>
                        <TableCell>{log.request_type}</TableCell>
                        <TableCell>{getHttpStatusBadge(log.status_code)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.duration_ms}ms
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>In: {log.tokens_in.toLocaleString()}</div>
                            <div>Out: {log.tokens_out.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCost(log.cost_cents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Logs do Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDatabaseLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(new Date(log.timestamp / 1000).toISOString())}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.error_severity === 'ERROR' ? 'destructive' : 
                                   log.error_severity === 'WARNING' ? 'secondary' : 'outline'}
                          >
                            {log.error_severity || 'LOG'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.identifier}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.event_message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSystemLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(new Date(log.timestamp / 1000).toISOString())}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.event_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.function_id}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.level === 'error' ? 'destructive' : 
                                   log.level === 'warn' ? 'secondary' : 'outline'}
                          >
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.event_message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Logs;