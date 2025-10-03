import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, Database } from "lucide-react";

interface ImportProgressMonitorProps {
  progress: number;
  stage:
    | "validating"
    | "creating-version"
    | "importing"
    | "publishing"
    | "completed";
  stats?: {
    total?: number;
    processed?: number;
    errors?: number;
    warnings?: number;
  };
}

export function ImportProgressMonitor({
  progress,
  stage,
  stats = {},
}: ImportProgressMonitorProps) {
  const getStageInfo = () => {
    switch (stage) {
      case "validating":
        return {
          title: "Validando dados",
          description: "Verificando estrutura e qualidade dos dados",
          icon: <AlertCircle className="h-4 w-4 text-warning" />,
        };
      case "creating-version":
        return {
          title: "Criando nova versão",
          description: "Preparando ambiente para importação",
          icon: <Database className="h-4 w-4 text-primary" />,
        };
      case "importing":
        return {
          title: "Importando dados",
          description: "Processando e salvando registros na base de dados",
          icon: <Clock className="h-4 w-4 text-primary animate-spin" />,
        };
      case "publishing":
        return {
          title: "Publicando versão",
          description: "Ativando nova versão da base de dados",
          icon: <CheckCircle className="h-4 w-4 text-success" />,
        };
      case "completed":
        return {
          title: "Importação concluída",
          description: "Todos os dados foram processados com sucesso",
          icon: <CheckCircle className="h-4 w-4 text-success" />,
        };
      default:
        return {
          title: "Processando...",
          description: "Aguarde",
          icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {stageInfo.icon}
        <div className="flex-1">
          <h4 className="font-medium">{stageInfo.title}</h4>
          <p className="text-sm text-muted-foreground">
            {stageInfo.description}
          </p>
        </div>
        <Badge variant={progress === 100 ? "default" : "secondary"}>
          {Math.round(progress)}%
        </Badge>
      </div>

      <Progress value={progress} className="w-full" />

      {(stats.total || stats.processed || stats.errors) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {stats.total && (
            <div className="bg-muted/50 p-2 rounded text-center">
              <div className="font-medium">{stats.total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          )}
          {stats.processed && (
            <div className="bg-success/10 p-2 rounded text-center border border-success/20">
              <div className="font-medium text-success">
                {stats.processed.toLocaleString()}
              </div>
              <div className="text-xs text-success/80">Processados</div>
            </div>
          )}
          {stats.errors !== undefined && (
            <div className="bg-destructive/10 p-2 rounded text-center border border-destructive/20">
              <div className="font-medium text-destructive">
                {stats.errors.toLocaleString()}
              </div>
              <div className="text-xs text-destructive/80">Erros</div>
            </div>
          )}
          {stats.warnings !== undefined && (
            <div className="bg-warning/10 p-2 rounded text-center border border-warning/20">
              <div className="font-medium text-warning">
                {stats.warnings.toLocaleString()}
              </div>
              <div className="text-xs text-warning/80">Avisos</div>
            </div>
          )}
        </div>
      )}

      {stage === "importing" && stats.processed && stats.total && (
        <div className="text-xs text-muted-foreground text-center">
          Processando registros... ({stats.processed.toLocaleString()} de{" "}
          {stats.total.toLocaleString()})
        </div>
      )}
    </div>
  );
}
