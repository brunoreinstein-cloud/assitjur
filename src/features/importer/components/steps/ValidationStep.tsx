import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileCheck, RefreshCw, CheckCircle, AlertCircle, Wand2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { intelligentValidateAndCorrect } from '@/lib/importer/intelligent-corrector';
import { IssuesDataTable } from '@/components/assistjur/IssuesDataTable';
import { ReviewUpdateButton } from '@/components/admin/ReviewUpdateButton';
import { CorrectionInterface } from '@/components/importer/CorrectionInterface';
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

  const [showCorrections, setShowCorrections] = useState(false);
  const [corrections, setCorrections] = useState<any[]>([]);

  useEffect(() => {
    if (session && file && !validationResult) {
      performValidation();
    }
  }, [session, file, validationResult]);

  const performValidation = async () => {
    if (!session || !file) return;

    setIsProcessing(true);
    try {
      const result = await intelligentValidateAndCorrect(
        session,
        {
          explodeLists: true,
          standardizeCNJ: true,
          applyDefaultReu: true,
          intelligentCorrections: true,
        },
        file
      );

      // Store corrections for UI
      if (result.intelligentCorrections && result.intelligentCorrections.length > 0) {
        setCorrections(result.intelligentCorrections);
        const correctionsWithData = result.intelligentCorrections.filter(c => c.corrections.length > 0);
        if (correctionsWithData.length > 0) {
          setShowCorrections(true);
        }
      }

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
        title: "Validação inteligente concluída",
        description: `${result.summary.analyzed} registros analisados, ${result.summary.valid} válidos, ${result.intelligentCorrections?.filter(c => c.corrections.length > 0).length || 0} correções sugeridas`,
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

  const handleApplyCorrections = (correctedData: any[]) => {
    // Apply corrections and update validation result
    const updatedResult = {
      ...validationResult!,
      normalizedData: {
        ...validationResult!.normalizedData,
        processos: correctedData.filter(d => d.cnj && d.reclamante_nome && d.reu_nome)
      },
      summary: {
        ...validationResult!.summary,
        valid: correctedData.filter(d => d.cnj && d.reclamante_nome && d.reu_nome).length,
        errors: Math.max(0, validationResult!.summary.errors - corrections.filter(c => c.corrections.length > 0).length)
      }
    };
    
    setValidationResult(updatedResult);
    setShowCorrections(false);
    
    toast({
      title: "Correções aplicadas",
      description: `${corrections.filter(c => c.corrections.length > 0).length} correções foram aplicadas com sucesso`,
    });
  };

  const handleRejectCorrections = () => {
    setShowCorrections(false);
    toast({
      title: "Correções rejeitadas",
      description: "Continuando com os dados originais",
    });
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
  const hasCorrections = corrections.length > 0 && corrections.some(c => c.corrections.length > 0);

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

        {/* Intelligent Corrections */}
        {showCorrections && hasCorrections && (
          <CorrectionInterface
            corrections={corrections}
            onApplyCorrections={handleApplyCorrections}
            onReject={handleRejectCorrections}
          />
        )}

        {/* Status Alert */}
        {canProceed && !showCorrections && (
          <Alert className="border-success bg-success/5">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              ✅ Arquivo pronto para publicação! {summary.valid} registros serão importados.
              {hasCorrections && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-2 p-0 h-auto text-success"
                  onClick={() => setShowCorrections(true)}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Ver correções sugeridas
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {hasErrors && !showCorrections && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ Corrija os erros antes de prosseguir. {summary.errors} problemas impedem a importação.
              {hasCorrections && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-2 p-0 h-auto text-destructive"
                  onClick={() => setShowCorrections(true)}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Ver correções automáticas
                </Button>
              )}
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