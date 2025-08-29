import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Play,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewUpdateButtonProps {
  orgId?: string;
  onSuccess?: () => void;
}

interface ReviewReport {
  stubs_created: number;
  flags_updated: number;
  warnings: Array<{
    type: string;
    message: string;
    cnj?: string;
  }>;
  errors: Array<{
    type: string;
    message: string;
  }>;
  statistics: {
    total_processos: number;
    total_testemunhas: number;
    triangulacoes_detected: number;
    trocas_detected: number;
    duplo_papel_detected: number;
    prova_emprestada_detected: number;
  };
  execution_time_ms: number;
}

export function ReviewUpdateButton({ orgId, onSuccess }: ReviewUpdateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const { toast } = useToast();

  const executeReview = async (dryRun: boolean) => {
    if (!orgId) {
      toast({
        title: "Erro",
        description: "ID da organização não encontrado",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    
    try {
      // Simulação de chamada para Edge Function review-update-dados
      const response = await fetch('/api/review-update-dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, dryRun })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data: ReviewReport = await response.json();
      setReport(data);
      setIsDryRun(dryRun);

      if (!dryRun) {
        toast({
          title: "Revisão concluída",
          description: `${data.flags_updated} registros atualizados, ${data.stubs_created} stubs criados`,
        });
        onSuccess?.();
      }

    } catch (error) {
      console.error('Erro na revisão:', error);
      toast({
        title: "Erro na revisão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      dry_run: isDryRun,
      ...report
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assistjur-review-${isDryRun ? 'preview' : 'applied'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={isRunning}
        className="gap-2"
      >
        {isRunning ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Processando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Revisar & Atualizar
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Revisão & Atualização de Dados - AssistJur.IA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!report ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Execute uma revisão para recomputar flags analíticas, reconciliar CNJs e validar dados.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => executeReview(true)}
                    disabled={isRunning}
                    variant="outline"
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Dry Run (Preview)
                  </Button>
                  <Button
                    onClick={() => executeReview(false)}
                    disabled={isRunning}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Aplicar Mudanças
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Status Alert */}
                {report.errors.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {report.errors.length} erro(s) encontrado(s) durante a execução.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Revisão {isDryRun ? 'simulada' : 'aplicada'} com sucesso! 
                      Tempo de execução: {report.execution_time_ms}ms
                    </AlertDescription>
                  </Alert>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Stubs Criados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        {report.stubs_created}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Flags Atualizadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-success">
                        {report.flags_updated}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Triangulações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-warning">
                        {report.statistics.triangulacoes_detected}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Prova Emprestada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">
                        {report.statistics.prova_emprestada_detected}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detecções Analíticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <span>Trocas Diretas:</span>
                        <Badge variant="outline">
                          {report.statistics.trocas_detected}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Duplo Papel:</span>
                        <Badge variant="outline">
                          {report.statistics.duplo_papel_detected}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Processos:</span>
                        <Badge variant="secondary">
                          {report.statistics.total_processos}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Testemunhas:</span>
                        <Badge variant="secondary">
                          {report.statistics.total_testemunhas}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {report.warnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-warning">
                        Avisos ({report.warnings.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {report.warnings.map((warning, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 rounded border">
                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {warning.type}
                                </Badge>
                                {warning.cnj && (
                                  <span className="text-xs text-muted-foreground">
                                    CNJ: {warning.cnj}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-1">{warning.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Errors */}
                {report.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-destructive">
                        Erros ({report.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {report.errors.map((error, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 rounded border border-destructive/20">
                            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                            <div className="flex-1">
                              <Badge variant="destructive" className="text-xs mb-1">
                                {error.type}
                              </Badge>
                              <p className="text-sm">{error.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              {report && (
                <Button variant="outline" onClick={downloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Fechar
              </Button>
            </div>

            {report && isDryRun && (
              <Button 
                onClick={() => executeReview(false)}
                disabled={isRunning || report.errors.length > 0}
                className="ml-auto"
              >
                <Play className="h-4 w-4 mr-2" />
                Aplicar Mudanças
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}