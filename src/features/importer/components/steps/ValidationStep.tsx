import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileCheck, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { normalizeAndValidate } from '../../validators/validateEnhanced';
import { IssuesDataTable } from '@/components/assistjur/IssuesDataTable';
import { ReviewUpdateButton } from '@/components/admin/ReviewUpdateButton';
import { useImportStore } from '../../store/useImportStore';
import type { ValidationIssue } from '@/lib/importer/types';

export function ValidationStep() {
  const { 
    session, 
    file, 
    validationResult, 
    setValidationResult, 
    setCurrentStep, 
    isProcessing, 
    setIsProcessing,
    setError
  } = useImportStore();

  useEffect(() => {
    if (session && file && !validationResult) {
      performValidation();
    }
  }, [session, file, validationResult]);

  const performValidation = async () => {
    if (!session || !file) return;

    setIsProcessing(true);
    try {
      const result = await normalizeAndValidate(
        session,
        {
          explodeLists: true,
          standardizeCNJ: true,
          applyDefaultReu: true,
          intelligentCorrections: true,
        },
        file
      );

      // Add download URLs (mock for now)
      const validationWithUrls = {
        ...result,
        downloadUrls: {
          fixedXlsx: '',
          reportCsv: '',
          reportJson: ''
        }
      };

      setValidationResult(validationWithUrls);
      
      toast({
        title: "Validação concluída",
        description: `${result.summary.analyzed} registros analisados, ${result.summary.valid} válidos`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na validação';
      setError(errorMessage);
      toast({
        title: "Erro na validação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!session || !file) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Sessão ou arquivo não encontrado. Volte ao passo anterior.
        </AlertDescription>
      </Alert>
    );
  }

  if (isProcessing || !validationResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Validação e Normalização
          </CardTitle>
          <CardDescription>
            Verificando a qualidade e consistência dos dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">Validando arquivo...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Processando dados reais para validação completa
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, issues } = validationResult;
  const hasErrors = summary.errors > 0;
  const canProceed = summary.valid > 0 && !hasErrors;

  return (
    <div className="space-y-6">
      {/* Validation Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">{summary.analyzed.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Linhas analisadas</div>
        </Card>
        <Card className="text-center p-4 bg-success/5 border-success/20">
          <div className="text-2xl font-bold text-success">{summary.valid.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Linhas válidas</div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.analyzed > 0 ? `${Math.round((summary.valid / summary.analyzed) * 100)}%` : '0%'}
          </div>
        </Card>
        <Card className="text-center p-4 bg-destructive/5 border-destructive/20">
          <div className="text-2xl font-bold text-destructive">{summary.errors}</div>
          <div className="text-sm text-muted-foreground">Erros</div>
          {summary.errors > 0 && (
            <div className="text-xs text-destructive mt-1">Impedem publicação</div>
          )}
        </Card>
        <Card className="text-center p-4 bg-warning/5 border-warning/20">
          <div className="text-2xl font-bold text-warning">{summary.warnings}</div>
          <div className="text-sm text-muted-foreground">Avisos</div>
          {summary.warnings > 0 && (
            <div className="text-xs text-warning mt-1">Permitido publicar</div>
          )}
        </Card>
      </div>

      {/* Status Alert */}
      {canProceed && (
        <Alert className="border-success bg-success/5">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            ✅ Arquivo pronto para publicação! {summary.valid} registros serão importados.
          </AlertDescription>
        </Alert>
      )}

      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ❌ Corrija os erros antes de prosseguir. {summary.errors} problemas impedem a importação.
          </AlertDescription>
        </Alert>
      )}

      {/* Issues Table */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Problemas Detectados</CardTitle>
            <CardDescription>
              Revise e corrija os problemas antes de prosseguir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IssuesDataTable issues={issues.map(issue => ({
              ...issue,
              message: issue.message || issue.rule
            }))} />
          </CardContent>
        </Card>
      )}

      {/* Review & Update Section */}
      {canProceed && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Otimização Opcional
            </CardTitle>
            <CardDescription>
              Execute uma revisão completa para detectar padrões suspeitos e otimizar a base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewUpdateButton />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('upload')}
        >
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={performValidation}
            disabled={isProcessing}
          >
            {isProcessing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Revalidar
          </Button>
          <Button 
            onClick={() => setCurrentStep('preview')}
            disabled={!canProceed}
          >
            {hasErrors ? 'Corrigir Erros Primeiro' : 'Continuar para Prévia'}
          </Button>
        </div>
      </div>
    </div>
  );
}