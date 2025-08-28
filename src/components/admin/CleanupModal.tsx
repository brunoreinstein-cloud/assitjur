import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CleanupProgress } from "./CleanupProgress";

interface CleanupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CleanupPreview {
  invalid_cnjs: number;
  empty_reclamante: number;
  empty_reu: number;
  duplicates: number;
  soft_deleted: number;
  total_issues: number;
}

interface CleanupOperation {
  id: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
}

const cleanupOperations: CleanupOperation[] = [
  {
    id: 'invalid_cnjs',
    label: 'CNJs Inválidos',
    description: 'Remove processos com CNJs que não têm 20 dígitos numéricos',
    severity: 'medium',
    enabled: true
  },
  {
    id: 'empty_fields',
    label: 'Campos Obrigatórios Vazios',
    description: 'Remove processos sem nome do reclamante ou réu',
    severity: 'medium',
    enabled: true
  },
  {
    id: 'duplicates',
    label: 'Duplicatas',
    description: 'Remove processos duplicados (mantém o mais recente)',
    severity: 'high',
    enabled: false
  },
  {
    id: 'normalize_cnjs',
    label: 'Normalizar CNJs',
    description: 'Remove pontuação e padroniza formato dos CNJs válidos',
    severity: 'low',
    enabled: true
  },
  {
    id: 'hard_delete_old',
    label: 'Exclusão Permanente',
    description: 'Remove permanentemente processos excluídos há mais de 30 dias',
    severity: 'high',
    enabled: false
  }
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export function CleanupModal({ open, onOpenChange }: CleanupModalProps) {
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [operations, setOperations] = useState(cleanupOperations);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState<'preview' | 'confirm' | 'running'>('preview');
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && profile?.organization_id) {
      loadPreview();
    }
  }, [open, profile]);

  const loadPreview = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('database-cleanup', {
        body: {
          orgId: profile.organization_id,
          preview: true
        }
      });

      if (error) throw error;
      setPreview(data.preview);
    } catch (error) {
      console.error('Erro ao carregar preview:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar preview da limpeza",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOperationToggle = (operationId: string, checked: boolean) => {
    setOperations(prev => prev.map(op => 
      op.id === operationId ? { ...op, enabled: checked } : op
    ));
  };

  const getOperationCount = (operationId: string): number => {
    if (!preview) return 0;
    
    switch (operationId) {
      case 'invalid_cnjs': return preview.invalid_cnjs;
      case 'empty_fields': return preview.empty_reclamante + preview.empty_reu;
      case 'duplicates': return preview.duplicates;
      case 'normalize_cnjs': return preview.invalid_cnjs; // CNJs que precisam normalização
      case 'hard_delete_old': return preview.soft_deleted;
      default: return 0;
    }
  };

  const handleExecuteCleanup = async () => {
    if (!profile?.organization_id) return;

    const selectedOperations = operations.filter(op => op.enabled).map(op => op.id);
    
    if (selectedOperations.length === 0) {
      toast({
        title: "Nenhuma operação selecionada",
        description: "Selecione pelo menos uma operação para continuar",
        variant: "destructive"
      });
      return;
    }

    setStep('running');
    setIsRunning(true);

    try {
      const { data, error } = await supabase.functions.invoke('database-cleanup', {
        body: {
          orgId: profile.organization_id,
          operations: selectedOperations
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Limpeza concluída",
          description: `${data.totalProcessed} registros processados`,
          variant: "default"
        });
        onOpenChange(false);
        // Recarregar a página para atualizar os dados
        window.location.reload();
      } else {
        throw new Error(data.error || 'Erro na limpeza');
      }
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast({
        title: "Erro na limpeza",
        description: error.message || "Falha ao executar limpeza da base",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setStep('preview');
    }
  };

  const handleClose = () => {
    if (!isRunning) {
      onOpenChange(false);
      setStep('preview');
      setPreview(null);
    }
  };

  const renderPreviewStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpeza da Base de Dados
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando preview...</span>
          </div>
        ) : preview ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Resumo da Base
                </CardTitle>
                <CardDescription>
                  Problemas detectados na base de dados da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">{preview.total_issues}</div>
                  <div className="text-sm text-muted-foreground">problemas detectados</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Operações Disponíveis</h3>
              {operations.map((operation) => {
                const count = getOperationCount(operation.id);
                return (
                  <Card key={operation.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={operation.id}
                          checked={operation.enabled}
                          onCheckedChange={(checked) => 
                            handleOperationToggle(operation.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <label 
                              htmlFor={operation.id}
                              className="font-medium cursor-pointer"
                            >
                              {operation.label}
                            </label>
                            <Badge className={getSeverityColor(operation.severity)}>
                              {operation.severity}
                            </Badge>
                            {count > 0 && (
                              <Badge variant="outline">
                                {count} registros
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {operation.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPreview}>
            Atualizar
          </Button>
          <Button 
            onClick={() => setStep('confirm')}
            disabled={!operations.some(op => op.enabled) || loading}
          >
            Continuar
          </Button>
        </div>
      </div>
    </>
  );

  const renderConfirmStep = () => {
    const selectedOps = operations.filter(op => op.enabled);
    const totalToProcess = selectedOps.reduce((sum, op) => sum + getOperationCount(op.id), 0);

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Confirmação de Limpeza
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="font-semibold text-destructive mb-2">⚠️ Atenção!</p>
            <p className="text-sm">
              Esta operação irá processar <strong>{totalToProcess} registros</strong> e 
              pode ser irreversível. Certifique-se de que tem um backup da base de dados.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Operações selecionadas:</h4>
            {selectedOps.map((op) => (
              <div key={op.id} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                {op.label} - {getOperationCount(op.id)} registros
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep('preview')}>
            Voltar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleExecuteCleanup}
          >
            Confirmar Limpeza
          </Button>
        </div>
      </>
    );
  };

  const renderRunningStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Executando Limpeza
        </DialogTitle>
      </DialogHeader>

      <CleanupProgress isRunning={isRunning} />

      <div className="text-center text-sm text-muted-foreground">
        Por favor, aguarde. A limpeza está em andamento...
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'preview' && renderPreviewStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'running' && renderRunningStep()}
      </DialogContent>
    </Dialog>
  );
}