import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewSummary {
  processos_avaliados: number;
  testemunhas_avaliadas: number;
  processos_atualizados: number;
  testemunhas_atualizadas: number;
  stubs_criados: number;
  triangulacoes: number;
  trocas_diretas: number;
  duplo_papel: number;
  provas_emprestadas: number;
}

interface ReviewResponse {
  orgId: string;
  dryRun: boolean;
  summary: ReviewSummary;
  warnings: string[];
  errors: string[];
  timestamp: string;
  duration_ms: number;
}

export function ReviewUpdateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [mode, setMode] = useState<'dry-run' | 'apply'>('dry-run');
  const { toast } = useToast();

  const handleReview = async (dryRun: boolean) => {
    setIsLoading(true);
    setMode(dryRun ? 'dry-run' : 'apply');
    
    try {
      // Get current user's org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Organização não encontrada');
      }

      const { data, error } = await supabase.functions.invoke('review-update-dados', {
        body: {
          orgId: profile.organization_id,
          dryRun
        }
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: dryRun ? "Revisão concluída" : "Atualização concluída",
        description: `Processados ${data.summary.processos_avaliados} processos e ${data.summary.testemunhas_avaliadas} testemunhas`,
      });

    } catch (error) {
      console.error('Erro no review:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao executar revisão",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-report-${result.timestamp.split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <RefreshCw className="w-4 h-4 mr-2" />
          Revisar & Atualizar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sistema de Revisão e Atualização</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!result && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Execute uma revisão completa dos dados, detectando padrões suspeitos e normalizando informações.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleReview(true)}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading && mode === 'dry-run' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Dry Run (Simulação)
                </Button>
                
                <Button
                  onClick={() => handleReview(false)}
                  disabled={isLoading}
                >
                  {isLoading && mode === 'apply' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Aplicar Mudanças
                </Button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executando {mode === 'dry-run' ? 'simulação' : 'atualização'}...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Relatório de {result.dryRun ? 'Simulação' : 'Atualização'}
                </h3>
                <Button onClick={downloadReport} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{result.summary.processos_avaliados}</div>
                  <div className="text-sm text-muted-foreground">Processos Avaliados</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{result.summary.testemunhas_avaliadas}</div>
                  <div className="text-sm text-muted-foreground">Testemunhas Avaliadas</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{result.summary.stubs_criados}</div>
                  <div className="text-sm text-muted-foreground">Stubs Criados</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{result.duration_ms}ms</div>
                  <div className="text-sm text-muted-foreground">Tempo Execução</div>
                </div>
              </div>

              {/* Pattern Detection Results */}
              <div>
                <h4 className="font-semibold mb-3">Padrões Detectados</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Badge variant={result.summary.triangulacoes > 0 ? 'destructive' : 'secondary'}>
                    Triangulação: {result.summary.triangulacoes}
                  </Badge>
                  <Badge variant={result.summary.trocas_diretas > 0 ? 'destructive' : 'secondary'}>
                    Troca Direta: {result.summary.trocas_diretas}
                  </Badge>
                  <Badge variant={result.summary.duplo_papel > 0 ? 'default' : 'secondary'}>
                    Duplo Papel: {result.summary.duplo_papel}
                  </Badge>
                  <Badge variant={result.summary.provas_emprestadas > 0 ? 'destructive' : 'secondary'}>
                    Prova Emprestada: {result.summary.provas_emprestadas}
                  </Badge>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Avisos ({result.warnings.length})
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="text-sm p-2 bg-yellow-50 border-l-4 border-yellow-400">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">Erros ({result.errors.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm p-2 bg-red-50 border-l-4 border-red-400">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button onClick={() => setResult(null)} variant="outline">
                  Nova Execução
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}