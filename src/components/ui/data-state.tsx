import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export type DataStatus = "empty" | "loading" | "success" | "error" | "offline";

interface DataStateProps {
  status: DataStatus;
  onRetry?: () => void;
  children?: ReactNode;
}

export function DataState({ status, onRetry, children }: DataStateProps) {
  if (status === "loading") {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Erro ao carregar</span>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Sem conexão</span>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Nenhum dado encontrado
      </div>
    );
  }

  return <>{children}</>;
}
