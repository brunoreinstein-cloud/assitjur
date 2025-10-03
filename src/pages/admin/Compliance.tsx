import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Users,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LGPDRequest {
  id: string;
  request_type: string;
  status: string;
  requested_by_email: string;
  justification?: string;
  created_at: string;
  completed_at?: string;
  expires_at: string;
}

interface AccessLog {
  id: string;
  accessed_table: string;
  access_type: string;
  created_at: string;
  user_id: string;
}

export default function Compliance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LGPDRequest[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch LGPD requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("lgpd_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
      } else {
        setRequests(requestsData || []);
      }

      // Fetch access logs
      const { data: logsData, error: logsError } = await supabase
        .from("data_access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) {
        console.error("Error fetching logs:", logsError);
      } else {
        setAccessLogs(logsData || []);
      }
    } catch (error) {
      console.error("Error fetching compliance data:", error);
      toast.error("Erro ao carregar dados de compliance");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, icon: Clock, text: "Pendente" },
      PROCESSING: {
        variant: "default" as const,
        icon: Eye,
        text: "Processando",
      },
      COMPLETED: {
        variant: "default" as const,
        icon: CheckCircle,
        text: "Concluída",
      },
      REJECTED: {
        variant: "destructive" as const,
        icon: XCircle,
        text: "Rejeitada",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    const extraClass =
      status === "COMPLETED" ? "bg-success text-success-foreground" : "";

    return (
      <Badge variant={config.variant} className={extraClass}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getRequestTypeLabel = (type: string) => {
    const typeLabels = {
      ACCESS: "Acesso aos Dados",
      RECTIFICATION: "Retificação",
      DELETION: "Exclusão",
      PORTABILITY: "Portabilidade",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const filteredRequests =
    selectedStatus === "all"
      ? requests
      : requests.filter((req) => req.status === selectedStatus);

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("lgpd_requests")
        .update({
          status: newStatus,
          completed_at:
            newStatus === "COMPLETED" ? new Date().toISOString() : null,
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Status atualizado com sucesso");
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
          <p>Carregando dados de compliance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Compliance LGPD
        </h1>
        <p className="text-muted-foreground">
          Gestão de solicitações e logs de acesso conforme a Lei Geral de
          Proteção de Dados
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Solicitações
                </p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pendentes
                </p>
                <p className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "PENDING").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Concluídas
                </p>
                <p className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "COMPLETED").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Logs de Acesso
                </p>
                <p className="text-2xl font-bold">{accessLogs.length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Solicitações LGPD</TabsTrigger>
          <TabsTrigger value="logs">Logs de Acesso</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="PROCESSING">Processando</SelectItem>
                <SelectItem value="COMPLETED">Concluídas</SelectItem>
                <SelectItem value="REJECTED">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData}>Atualizar</Button>
          </div>

          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma solicitação LGPD encontrada
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {getRequestTypeLabel(request.request_type)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Solicitante: {request.requested_by_email}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(request.status)}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateStatus(request.id, "PROCESSING")
                            }
                            disabled={request.status === "COMPLETED"}
                          >
                            Processar
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleUpdateStatus(request.id, "COMPLETED")
                            }
                            disabled={request.status === "COMPLETED"}
                          >
                            Concluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.justification && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Justificativa:</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.justification}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Criada em:</strong>{" "}
                        {new Date(request.created_at).toLocaleString("pt-BR")}
                      </div>
                      <div>
                        <strong>Expira em:</strong>{" "}
                        {new Date(request.expires_at).toLocaleString("pt-BR")}
                      </div>
                      {request.completed_at && (
                        <div>
                          <strong>Concluída em:</strong>{" "}
                          {new Date(request.completed_at).toLocaleString(
                            "pt-BR",
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Acesso a Dados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registro de acessos para auditoria LGPD
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accessLogs.slice(0, 20).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b"
                  >
                    <div>
                      <span className="font-medium">{log.accessed_table}</span>
                      <span className="mx-2 text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {log.access_type}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Portal do Titular:</strong> O portal público para
              solicitações LGPD está disponível em{" "}
              <a
                href="/portal-titular"
                className="text-primary underline"
                target="_blank"
              >
                /portal-titular
              </a>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Retenção de Dados</h4>
                <p className="text-sm text-muted-foreground">
                  Dados são retidos por 24 meses após o fim da necessidade
                  processual, conforme política de retenção configurada.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Anonimização Automática</h4>
                <p className="text-sm text-muted-foreground">
                  CPFs, nomes e dados sensíveis são mascarados automaticamente
                  em exports e relatórios por padrão.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Base Legal</h4>
                <p className="text-sm text-muted-foreground">
                  Art. 7º, VI da LGPD - Execução regular de direitos em processo
                  judicial
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
