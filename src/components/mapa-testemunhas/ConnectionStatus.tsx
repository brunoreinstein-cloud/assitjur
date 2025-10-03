import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, WifiOff, Loader2 } from "lucide-react";

interface ConnectionStatusProps {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  isConnected: boolean;
  dataCount: number;
  dataType: "processos" | "testemunhas";
}

export const ConnectionStatus = ({
  isLoading,
  hasError,
  errorMessage,
  isConnected,
  dataCount,
  dataType,
}: ConnectionStatusProps) => {
  if (isLoading) {
    return (
      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-800">
              Conectando com servidor...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError && !isConnected) {
    return (
      <Card className="mb-4 border-orange-200 bg-orange-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <span className="text-sm text-orange-800">
                Servidor indisponível - Exibindo dados simulados
              </span>
              {errorMessage && (
                <p className="text-xs text-orange-700 mt-1">{errorMessage}</p>
              )}
            </div>
            <Badge
              variant="outline"
              className="text-orange-700 border-orange-300"
            >
              Mock
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError && isConnected) {
    return (
      <Card className="mb-4 border-red-200 bg-red-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <span className="text-sm text-red-800">
                Erro de validação nos filtros
              </span>
              {errorMessage && (
                <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
              )}
            </div>
            <Badge variant="destructive" className="text-xs">
              Erro
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected && dataCount > 0) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">
              {dataCount} {dataType} carregados do servidor
            </span>
            <Badge
              variant="outline"
              className="text-green-700 border-green-300"
            >
              Online
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
