import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, Download, Trash2, Edit, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LGPDRequest {
  id: string;
  request_type: "ACCESS" | "RECTIFICATION" | "DELETION" | "PORTABILITY";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  created_at: string;
  completed_at?: string;
  justification?: string;
}

export default function PortalTitular() {
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<string>("");
  const [justification, setJustification] = useState("");
  const [requests, setRequests] = useState<LGPDRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const requestTypes = [
    {
      value: "ACCESS",
      label: "Acesso aos Dados",
      description: "Visualizar quais dados pessoais temos sobre você",
    },
    {
      value: "RECTIFICATION",
      label: "Retificação",
      description: "Corrigir dados pessoais incorretos",
    },
    {
      value: "DELETION",
      label: "Exclusão",
      description: "Solicitar remoção dos seus dados pessoais",
    },
    {
      value: "PORTABILITY",
      label: "Portabilidade",
      description: "Receber seus dados em formato estruturado",
    },
  ];

  const handleSubmitRequest = async () => {
    if (!email || !requestType) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lgpd-requests", {
        body: {
          email,
          requestType,
          justification,
        },
      });

      if (error) {
        console.error("Error submitting request:", error);
        toast.error(
          error.message || "Erro ao enviar solicitação. Tente novamente.",
        );
        return;
      }

      toast.success(
        "Solicitação enviada com sucesso! Você receberá uma resposta em até 15 dias úteis.",
      );
      setEmail("");
      setRequestType("");
      setJustification("");

      // Show additional info if available
      if (data?.processingInfo) {
        setTimeout(() => {
          toast.info(data.processingInfo);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pendente</Badge>;
      case "PROCESSING":
        return <Badge variant="default">Em Processamento</Badge>;
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-success">
            Concluída
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case "ACCESS":
        return <Eye className="h-4 w-4" />;
      case "RECTIFICATION":
        return <Edit className="h-4 w-4" />;
      case "DELETION":
        return <Trash2 className="h-4 w-4" />;
      case "PORTABILITY":
        return <Download className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Portal do Titular - LGPD</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Exercite seus direitos sobre dados pessoais conforme a Lei Geral de
            Proteção de Dados
          </p>
        </div>

        {/* Nova Solicitação */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Nova Solicitação LGPD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">E-mail *</label>
              <Input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use o mesmo e-mail cadastrado nos serviços do AssistJur.IA
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Solicitação *
              </label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de solicitação" />
                </SelectTrigger>
                <SelectContent>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {getRequestIcon(type.value)}
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Justificativa (Opcional)
              </label>
              <Textarea
                placeholder="Descreva o motivo da sua solicitação..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Compromisso de Transparência:</strong> Todas as
                solicitações são processadas em até 15 dias úteis. Você receberá
                uma resposta detalhada no e-mail informado, incluindo os dados
                solicitados em formato estruturado quando aplicável.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSubmitRequest}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </CardContent>
        </Card>

        {/* Informações sobre a LGPD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seus Direitos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Eye className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <strong>Acesso:</strong> Saber quais dados pessoais tratamos
                    sobre você
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Edit className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <strong>Retificação:</strong> Corrigir dados incompletos,
                    inexatos ou desatualizados
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Trash2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <strong>Exclusão:</strong> Solicitar a eliminação dos seus
                    dados pessoais
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Download className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <strong>Portabilidade:</strong> Receber seus dados em
                    formato estruturado
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base Legal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Execução de Direitos:</strong> Tratamos seus dados com
                  base no exercício regular de direitos em processo judicial
                  (Art. 7º, VI da LGPD).
                </p>
                <p>
                  <strong>Minimização:</strong> Coletamos apenas dados
                  estritamente necessários para a finalidade específica.
                </p>
                <p>
                  <strong>Segurança:</strong> Seus dados são protegidos por
                  criptografia e controles de acesso rigorosos.
                </p>
                <p>
                  <strong>Retenção:</strong> Dados são mantidos pelo período
                  necessário para cumprimento da finalidade ou obrigação legal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            AssistJur.IA - Compliance LGPD • Para dúvidas: contato@assistjur.ia
          </p>
        </div>
      </div>
    </div>
  );
}
