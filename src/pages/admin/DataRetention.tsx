import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Database,
  Shield,
  Play,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RetentionPolicy {
  id: string;
  table_name: string;
  retention_months: number;
  auto_cleanup: boolean;
  last_cleanup_at?: string;
  next_cleanup_at?: string;
  created_at: string;
  updated_at: string;
}

interface CleanupLog {
  id: string;
  table_name: string;
  records_affected: number;
  status: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  metadata: any;
}

export default function DataRetention() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [logs, setLogs] = useState<CleanupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch retention policies
      const { data: policiesData, error: policiesError } = await supabase
        .from("retention_policies")
        .select("*")
        .order("table_name");

      if (policiesError) {
        console.error("Error fetching policies:", policiesError);
        toast.error("Erro ao carregar políticas de retenção");
      } else {
        setPolicies(policiesData || []);
      }

      // Fetch cleanup logs
      const { data: logsData, error: logsError } = await supabase
        .from("cleanup_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (logsError) {
        console.error("Error fetching logs:", logsError);
      } else {
        setLogs(logsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePolicy = async (
    policyId: string,
    updates: Partial<RetentionPolicy>,
  ) => {
    try {
      const { error } = await supabase
        .from("retention_policies")
        .update(updates)
        .eq("id", policyId);

      if (error) throw error;

      toast.success("Política atualizada com sucesso");
      fetchData();
    } catch (error) {
      console.error("Error updating policy:", error);
      toast.error("Erro ao atualizar política");
    }
  };

  const handleExecuteCleanup = async (policyId: string) => {
    setExecuting(policyId);
    try {
      const { data, error } = await supabase.functions.invoke(
        "data-retention",
        {
          body: {
            action: "execute_cleanup",
            policyId,
          },
        },
      );

      if (error) throw error;

      toast.success(
        `Limpeza executada: ${data.result.records_affected} registros afetados`,
      );
      fetchData();
    } catch (error) {
      console.error("Error executing cleanup:", error);
      toast.error("Erro ao executar limpeza");
    } finally {
      setExecuting(null);
    }
  };

  const handleBatchCleanup = async () => {
    setExecuting("batch");
    try {
      const { data, error } = await supabase.functions.invoke(
        "data-retention",
        {
          body: {
            action: "batch_cleanup",
            orgId: user?.user_metadata?.organization_id,
          },
        },
      );

      if (error) throw error;

      toast.success(
        `Limpeza em lote executada: ${data.processed} políticas processadas`,
      );
      fetchData();
    } catch (error) {
      console.error("Error executing batch cleanup:", error);
      toast.error("Erro ao executar limpeza em lote");
    } finally {
      setExecuting(null);
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const names = {
      processos: "Processos",
      audit_logs: "Logs de Auditoria",
      openai_logs: "Logs OpenAI",
      data_access_logs: "Logs de Acesso",
      lgpd_requests: "Solicitações LGPD",
    };
    return names[tableName as keyof typeof names] || tableName;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      case "STARTED":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Iniciado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Database className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
          <p>Carregando políticas de retenção...</p>
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
            <Database className="h-8 w-8 text-primary" />
            Retenção de Dados
          </h1>
          <p className="text-muted-foreground">
            Gestão automatizada de políticas de retenção LGPD
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleBatchCleanup}
            disabled={executing === "batch"}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            {executing === "batch" ? "Executando..." : "Limpeza em Lote"}
          </Button>
          <Button onClick={fetchData} variant="outline">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alert de Compliance */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Compliance LGPD:</strong> As políticas de retenção
          automatizada garantem o descarte seguro de dados após o prazo legal
          necessário, conforme Art. 6º, VII da LGPD.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Políticas de Retenção</TabsTrigger>
          <TabsTrigger value="logs">Histórico de Limpezas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid gap-4">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {getTableDisplayName(policy.table_name)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Retenção: {policy.retention_months} meses
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Auto-limpeza:</span>
                        <Switch
                          checked={policy.auto_cleanup}
                          onCheckedChange={(checked) =>
                            handleUpdatePolicy(policy.id, {
                              auto_cleanup: checked,
                            })
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleExecuteCleanup(policy.id)}
                        disabled={executing === policy.id}
                        variant="outline"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {executing === policy.id
                          ? "Executando..."
                          : "Executar Limpeza"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Retenção (meses):
                      </label>
                      <Input
                        type="number"
                        value={policy.retention_months}
                        onChange={(e) =>
                          handleUpdatePolicy(policy.id, {
                            retention_months: parseInt(e.target.value),
                          })
                        }
                        className="mt-1"
                        min="1"
                        max="120"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Última Limpeza:
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {policy.last_cleanup_at
                          ? new Date(policy.last_cleanup_at).toLocaleString(
                              "pt-BR",
                            )
                          : "Nunca executada"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Próxima Limpeza:
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {policy.next_cleanup_at
                          ? new Date(policy.next_cleanup_at).toLocaleString(
                              "pt-BR",
                            )
                          : "Não agendada"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Limpezas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registro das execuções de políticas de retenção
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma limpeza executada ainda
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getTableDisplayName(log.table_name)}
                          </span>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.records_affected} registros afetados
                        </p>
                        {log.error_message && (
                          <p className="text-sm text-destructive">
                            Erro: {log.error_message}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>
                          Iniciado:{" "}
                          {new Date(log.started_at).toLocaleString("pt-BR")}
                        </div>
                        {log.completed_at && (
                          <div>
                            Concluído:{" "}
                            {new Date(log.completed_at).toLocaleString("pt-BR")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Globais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Períodos de Retenção Padrão</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Processos: 60 meses (5 anos)</div>
                    <div>Logs de Auditoria: 24 meses</div>
                    <div>Logs OpenAI: 12 meses</div>
                    <div>Logs de Acesso: 24 meses</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Frequência de Execução</h4>
                  <p className="text-sm text-muted-foreground">
                    Políticas com auto-limpeza habilitada são executadas
                    mensalmente
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Segurança</h4>
                  <p className="text-sm text-muted-foreground">
                    Dados críticos (processos ativos) são protegidos contra
                    exclusão acidental. Logs de auditoria são mantidos para
                    compliance regulatório.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance e Regulamentação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Base Legal LGPD:</strong> Art. 6º, VII - "não
                    conservação dos dados pessoais por tempo superior ao
                    necessário para o alcance das finalidades para as quais
                    foram coletados"
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Critérios de Retenção</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Processos: Mantidos enquanto tramitam + 5 anos
                      (prescrição)
                    </li>
                    <li>• Logs de Auditoria: 2 anos para investigações</li>
                    <li>• Dados de IA: 1 ano para melhorias do serviço</li>
                    <li>
                      • Solicitações LGPD: 3 anos para evidência de compliance
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
