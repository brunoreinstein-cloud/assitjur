import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Eye, CheckCircle2 } from "lucide-react";

export function TrustNote() {
  return (
    <div className="space-y-4">
      <Alert className="border-primary/20 bg-primary/5">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong className="text-primary">Conformidade LGPD:</strong> Todos os
          dados são processados de acordo com a Lei Geral de Proteção de Dados.
          Os arquivos são analisados localmente e descartados após o
          processamento.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium">Dados Seguros</h4>
            <p className="text-muted-foreground">
              Processamento local sem envio de dados sensíveis
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium">Transparente</h4>
            <p className="text-muted-foreground">
              Relatórios detalhados de todas as transformações
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-medium">Validação Obrigatória</h4>
            <p className="text-muted-foreground">
              Verificação manual nos autos é sempre necessária
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
