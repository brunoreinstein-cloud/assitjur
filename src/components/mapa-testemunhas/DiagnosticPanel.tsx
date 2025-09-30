/**
 * Painel de Diagnóstico para Edge Functions (apenas em DEV)
 * Mostra status de conectividade e configuração
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { runMapaDiagnostics, logSupabaseConfig, type EdgeFunctionDiagnostics } from '@/lib/edge-function-diagnostics';

export function DiagnosticPanel() {
  const [diagnostics, setDiagnostics] = useState<Record<string, EdgeFunctionDiagnostics> | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    logSupabaseConfig();
    const results = await runMapaDiagnostics();
    setDiagnostics(results);
    setIsRunning(false);
  };

  return (
    <Card className="border-dashed border-yellow-500/50 bg-yellow-50/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-yellow-600" />
            <CardTitle className="text-sm">Diagnóstico de Edge Functions</CardTitle>
          </div>
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            DEV ONLY
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Teste a conectividade e configuração das Edge Functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleRunDiagnostics}
          disabled={isRunning}
          size="sm"
          variant="outline"
          className="w-full"
        >
          {isRunning && <RefreshCw className="mr-2 h-3 w-3 animate-spin" />}
          {isRunning ? 'Executando diagnóstico...' : 'Executar Diagnóstico'}
        </Button>

        {diagnostics && (
          <div className="space-y-2">
            {Object.entries(diagnostics).map(([name, diag]) => (
              <div
                key={name}
                className="flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-card/50 p-2 text-xs"
              >
                <div className="flex-1 space-y-1">
                  <div className="font-mono font-medium">{name}</div>
                  <div className="flex flex-wrap gap-1">
                    {diag.hasAuth ? (
                      <Badge variant="outline" className="text-green-600 border-green-600 text-[10px]">
                        <CheckCircle2 className="mr-1 h-2 w-2" />
                        Autenticado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600 text-[10px]">
                        <XCircle className="mr-1 h-2 w-2" />
                        Sem Auth
                      </Badge>
                    )}
                    {diag.isReachable ? (
                      <Badge variant="outline" className="text-green-600 border-green-600 text-[10px]">
                        <CheckCircle2 className="mr-1 h-2 w-2" />
                        Alcançável
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600 text-[10px]">
                        <XCircle className="mr-1 h-2 w-2" />
                        Não Alcançável
                      </Badge>
                    )}
                  </div>
                  {(diag.authError || diag.errorDetails) && (
                    <div className="text-[10px] text-destructive/80">
                      {diag.authError || diag.errorDetails?.message || 'Erro desconhecido'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
