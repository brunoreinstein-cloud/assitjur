import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle, Clock, RotateCcw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DeletionImpact {
  total_processos: number;
  active_processos: number;
  soft_deleted_processos: number;
  total_pessoas: number;
  estimated_deletion_time_minutes: number;
}

interface DeletionResult {
  success: boolean;
  deleted_count: number;
  operation_type?: string;
  message: string;
}

interface BulkDeleteManagerProps {
  type: 'processos' | 'testemunhas';
  onSuccess?: () => void;
  className?: string;
}

export function BulkDeleteManager({ type, onSuccess, className }: BulkDeleteManagerProps) {
  const { profile, isAdmin, user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmations, setConfirmations] = useState({
    understand: false,
    irreversible: false,
    backup: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'preview' | 'confirm' | 'executing'>('preview');
  const [operationType, setOperationType] = useState<'soft' | 'hard'>('soft');
  const [cooldownSeconds, setCooldownSeconds] = useState(10);

  // Only log on mount or permission changes
  useEffect(() => {
    console.log('🔍 BulkDeleteManager Permission Check:', {
      user: !!user,
      profile: !!profile,
      isAdmin,
      organization_id: profile?.organization_id,
      role: profile?.role
    });
  }, [isAdmin, profile?.organization_id]); // Only log when permissions change

  const requiredConfirmationText = profile?.organization_id || '';
  const isConfirmationValid = confirmationText === requiredConfirmationText;
  const allConfirmationsChecked = Object.values(confirmations).every(Boolean);
  const canProceed = isConfirmationValid && allConfirmationsChecked && cooldownSeconds === 0;

  // Check if user has permission to use this functionality
  const hasPermission = !!(isAdmin && profile?.organization_id);

  // Cooldown timer
  useEffect(() => {
    if (step === 'confirm' && cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, cooldownSeconds]);

  // Load deletion impact when opening modal
  useEffect(() => {
    if (isOpen && !impact && hasPermission) {
      console.log('🔍 Loading deletion impact for modal...');
      loadDeletionImpact();
    }
  }, [isOpen, hasPermission]);

  const loadDeletionImpact = async () => {
    if (!hasPermission) {
      toast({
        title: "Acesso negado",
        description: "Você precisa ser um administrador para executar esta operação",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingImpact(true);
    
    try {
      console.log('🔍 Loading deletion impact for org:', profile?.organization_id);
      console.log('🔍 User permissions:', { isAdmin, role: profile?.role });
      
      const { data, error } = await supabase.rpc('rpc_get_deletion_impact', {
        p_org_id: profile!.organization_id
      });

      if (error) {
        console.error('❌ RPC Error:', error);
        console.error('❌ RPC Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Deletion impact loaded:', data);
      setImpact(data as unknown as DeletionImpact);
    } catch (error) {
      console.error('❌ Error loading deletion impact:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Não foi possível carregar o impacto da exclusão",
        variant: "destructive"
      });
    } finally {
      setIsLoadingImpact(false);
    }
  };

  const executeProcessosDeletion = async () => {
    if (!profile?.organization_id) return;

    setIsLoading(true);
    setStep('executing');
    setProgress(0);

    try {
      setProgress(25);
      console.log('🗑️ Starting processos deletion:', { 
        organization_id: profile.organization_id, 
        hard_delete: operationType === 'hard' 
      });
      
      // Try new edge function first, fallback to RPC
      let result: DeletionResult | null = null;
      
      try {
        const { data, error } = await supabase.functions.invoke('processes-delete-all', {
          body: {
            confirm: profile.organization_id,
            hard_delete: operationType === 'hard'
          }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.message || data.error);
        
        result = {
          success: data.success,
          deleted_count: data.deleted_count,
          operation_type: data.operation_type,
          message: data.message
        };
        console.log('✅ Edge function deletion successful:', result);
        
      } catch (edgeFunctionError) {
        console.warn('⚠️ Edge function failed, falling back to RPC:', edgeFunctionError);
        
        // Fallback to existing RPC method
        const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_delete_all_processos', {
          p_org_id: profile.organization_id,
          p_hard_delete: operationType === 'hard'
        });

        if (rpcError) throw rpcError;
        result = rpcData as unknown as DeletionResult;
        console.log('✅ RPC deletion successful:', result);
      }

      setProgress(75);

      // Cleanup derived data if requested
      if (type === 'processos' && result) {
        const { error: cleanupError } = await supabase.rpc('rpc_cleanup_derived_data', {
          p_org_id: profile.organization_id
        });

        if (cleanupError) {
          console.warn('Warning during cleanup:', cleanupError);
        }
      }

      setProgress(100);

      if (result) {
        toast({
          title: "Exclusão concluída",
          description: `${result.deleted_count} registros foram ${operationType === 'hard' ? 'permanentemente excluídos' : 'marcados para exclusão'}`,
        });

        onSuccess?.();
        setIsOpen(false);
        resetState();
      }

    } catch (error) {
      console.error('Error during deletion:', error);
      toast({
        title: "Erro na exclusão",
        description: error instanceof Error ? error.message : "Erro desconhecido durante a exclusão",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeTestemunhasCleanup = async () => {
    if (!profile?.organization_id) return;

    setIsLoading(true);
    setStep('executing');
    setProgress(0);

    try {
      setProgress(50);
      const { data, error } = await supabase.rpc('rpc_cleanup_derived_data', {
        p_org_id: profile.organization_id
      });

      if (error) throw error;
      
      const result = data as unknown as DeletionResult;
      setProgress(100);

      toast({
        title: "Limpeza concluída",
        description: `${result.deleted_count} registros de testemunhas órfãs foram removidos`,
      });

      onSuccess?.();
      setIsOpen(false);
      resetState();

    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: "Erro na limpeza",
        description: error instanceof Error ? error.message : "Erro desconhecido durante a limpeza",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep('preview');
    setConfirmationText('');
    setConfirmations({
      understand: false,
      irreversible: false,
      backup: false,
    });
    setProgress(0);
    setCooldownSeconds(10);
    setImpact(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false);
      resetState();
    }
  };

  const getButtonText = () => {
    switch (type) {
      case 'processos': return 'Excluir Todos os Processos';
      case 'testemunhas': return 'Limpar Dados de Testemunhas';
      default: return 'Excluir Dados';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'processos': return 'Exclusão em Massa - Processos';
      case 'testemunhas': return 'Limpeza de Dados - Testemunhas';
      default: return 'Exclusão em Massa';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'processos': return 'Esta operação irá excluir todos os processos da organização';
      case 'testemunhas': return 'Esta operação irá limpar dados de testemunhas órfãs (sem processos associados)';
      default: return 'Esta operação irá excluir dados da organização';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className={className}
          onClick={() => setIsOpen(true)}
          disabled={!hasPermission}
          title={!hasPermission ? "Acesso negado - apenas administradores" : ""}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {getButtonText()}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {getTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Loading Impact */}
          {step === 'preview' && isLoadingImpact && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando dados...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permission Error */}
          {step === 'preview' && !hasPermission && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8 text-destructive">
                  <AlertTriangle className="h-8 w-8 mr-2" />
                  <div>
                    <div className="font-semibold">Acesso Negado</div>
                    <div className="text-sm">Apenas administradores podem executar esta operação</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impact Preview */}
          {step === 'preview' && impact && hasPermission && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Impacto da Operação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Processos Ativos</Label>
                    <div className="text-lg font-semibold">{impact.active_processos}</div>
                  </div>
                  <div>
                    <Label>Processos Já Excluídos</Label>
                    <div className="text-lg font-semibold text-muted-foreground">{impact.soft_deleted_processos}</div>
                  </div>
                  <div>
                    <Label>Registros de Pessoas</Label>
                    <div className="text-lg font-semibold">{impact.total_pessoas}</div>
                  </div>
                  <div>
                    <Label>Tempo Estimado</Label>
                    <div className="text-lg font-semibold">{impact.estimated_deletion_time_minutes} min</div>
                  </div>
                </div>

                {type === 'processos' && (
                  <div className="mt-4">
                    <Label>Tipo de Exclusão</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={operationType === 'soft' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOperationType('soft')}
                      >
                        Exclusão Reversível (Recomendado)
                      </Button>
                      <Button
                        variant={operationType === 'hard' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setOperationType('hard')}
                      >
                        Exclusão Permanente
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {operationType === 'soft' 
                        ? 'Os dados serão marcados como excluídos mas podem ser restaurados'
                        : 'Os dados serão permanentemente removidos do banco de dados'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">ATENÇÃO: Operação Crítica</span>
                </div>
                <p className="text-sm text-destructive/80">
                  Esta é uma operação irreversível que afetará {impact?.active_processos} processos ativos.
                  {operationType === 'hard' && ' A exclusão será PERMANENTE.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="confirmation">
                    Para confirmar, digite o ID da organização: <code>{requiredConfirmationText}</code>
                  </Label>
                  <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Digite o ID da organização"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="understand"
                      checked={confirmations.understand}
                      onCheckedChange={(checked) => 
                        setConfirmations(prev => ({ ...prev, understand: checked as boolean }))
                      }
                    />
                    <Label htmlFor="understand" className="text-sm">
                      Eu entendo que esta operação não pode ser desfeita
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="irreversible"
                      checked={confirmations.irreversible}
                      onCheckedChange={(checked) => 
                        setConfirmations(prev => ({ ...prev, irreversible: checked as boolean }))
                      }
                    />
                    <Label htmlFor="irreversible" className="text-sm">
                      Eu confirmo que tenho autorização para executar esta operação
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backup"
                      checked={confirmations.backup}
                      onCheckedChange={(checked) => 
                        setConfirmations(prev => ({ ...prev, backup: checked as boolean }))
                      }
                    />
                    <Label htmlFor="backup" className="text-sm">
                      Eu confirmo que foi feito backup dos dados (se necessário)
                    </Label>
                  </div>
                </div>

                {cooldownSeconds > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Aguarde {cooldownSeconds}s antes de prosseguir
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Execution Step */}
          {step === 'executing' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-2">Executando operação...</div>
                <Progress value={progress} className="w-full" />
                <div className="text-xs text-muted-foreground mt-1">{progress}% concluído</div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          
          {step === 'preview' && hasPermission && impact && (
            <AlertDialogAction
              onClick={() => setStep('confirm')}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continuar
            </AlertDialogAction>
          )}
          
          {step === 'confirm' && (
            <AlertDialogAction
              onClick={type === 'processos' ? executeProcessosDeletion : executeTestemunhasCleanup}
              disabled={!canProceed || isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s` : 'Executar Exclusão'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}