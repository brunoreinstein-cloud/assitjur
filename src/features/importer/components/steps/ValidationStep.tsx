import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileCheck, RefreshCw, CheckCircle, AlertCircle, Wand2, Info, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { intelligentValidateAndCorrect } from '@/lib/importer/intelligent-corrector';
import { IssuesDataTable } from '@/components/assistjur/IssuesDataTable';
import { ReviewUpdateButton } from '@/components/admin/ReviewUpdateButton';
import { CorrectionInterface } from '@/components/importer/CorrectionInterface';
import { ValidationTestButton } from '@/components/importer/ValidationTestButton';
import { useImportStore } from '../../store/useImportStore';
import { calculateValidationStats, generateValidationReport } from '@/lib/importer/validation-stats';
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

  // Add detailed validation stats logging and reporting
  useEffect(() => {
    if (validationResult) {
      const stats = calculateValidationStats(validationResult);
      console.log('📊 Detailed Validation Stats:', {
        originalRows: stats.originalRows,
        processedRows: stats.processedRows, 
        filteredRows: stats.filteredRows,
        validRows: stats.validRows,
        correctedRows: stats.correctedRows,
        errorRows: stats.errorRows,
        warningRows: stats.warningRows,
        report: generateValidationReport(stats)
      });
    }
  }, [validationResult]);

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

      // Convert to ValidationResult format for store compatibility
      const validationWithUrls: any = {
        summary: result.summary,
        issues: result.issues,
        normalizedData: result.normalizedData,
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
      
      console.log('🔍 Final Validation Summary:', {
        originalFile: file.name,
        fileSize: file.size,
        sheetsDetected: session.sheets.length,
        analyzed: result.summary.analyzed,
        valid: result.summary.valid,
        errors: result.summary.errors,
        warnings: result.summary.warnings,
        correctionsAvailable: result.intelligentCorrections?.length || 0,
        correctionsWithChanges: result.intelligentCorrections?.filter(c => c.corrections.length > 0).length || 0
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

  const handleApplyCorrections = async (correctedData: any[]) => {
    const correctionsApplied = corrections.filter(c => c.corrections.length > 0).length;
    
    try {
      // Import generateReports function
      const { generateReports } = await import('@/lib/importer/report');
      
      // Separate corrected data by type, using permissive criteria to preserve data
      const processos = correctedData.filter(d => {
        const cnjDigits = String(d.cnj || '').replace(/[^\d]/g, '');
        const hasEssentialFields = d.reclamante_nome || d.reu_nome;
        return cnjDigits.length >= 15 || hasEssentialFields;
      });

      const testemunhas = correctedData.filter(d => {
        const cnjDigits = String(d.cnj || '').replace(/[^\d]/g, '');
        return cnjDigits.length >= 15 || d.nome_testemunha;
      });

      // Build corrections map for visual formatting in Excel
      const correctionsMap = new Map<string, any>();
      
      // Helper function to convert column index to Excel column (A, B, C...)
      const getExcelColumn = (index: number): string => {
        let column = '';
        while (index >= 0) {
          column = String.fromCharCode(65 + (index % 26)) + column;
          index = Math.floor(index / 26) - 1;
        }
        return column;
      };

      corrections.forEach((row, rowIndex) => {
        row.corrections.forEach((correction, correctionIndex) => {
          // Find field index in the data structure for correct column mapping
          const sampleData = correctedData[0] || {};
          const fieldNames = Object.keys(sampleData);
          const fieldIndex = fieldNames.indexOf(correction.field);
          
          if (fieldIndex >= 0) {
            const excelColumn = getExcelColumn(fieldIndex);
            const excelRow = rowIndex + 2; // +2 because row 1 is header, start from row 2
            const address = `${excelColumn}${excelRow}`;
            
            correctionsMap.set(address, {
              address,
              original: correction.originalValue,
              corrected: correction.correctedValue,
              reason: correction.reason
            });
          }
        });
      });
      
      // Generate updated result with ALL corrected data preserved
      const updatedResult: any = {
        ...validationResult!,
        normalizedData: {
          // Preserve both processos and testemunhas data
          processos: processos.length > 0 ? processos : undefined,
          testemunhas: testemunhas.length > 0 ? testemunhas : undefined
        },
        summary: {
          ...validationResult!.summary,
          valid: processos.length + testemunhas.length,
          errors: Math.max(0, validationResult!.summary.errors - correctionsApplied)
        }
      };
      
      // Generate reports and download URLs with proper corrections map
      const downloadUrls = await generateReports(
        updatedResult,
        file?.name || 'arquivo_corrigido',
        undefined, // originalData not needed for corrected version
        correctionsMap // Pass real corrections map for visual formatting
      );
      
      // Update result with download URLs
      updatedResult.downloadUrls = downloadUrls;
      
      setValidationResult(updatedResult);
      setShowCorrections(false);
      
      const totalCorrectedRows = processos.length + testemunhas.length;
      
      toast({
        title: "Correções aplicadas com sucesso",
        description: `${correctionsApplied} correções aplicadas. ${totalCorrectedRows} registros válidos prontos para importação. Downloads disponíveis.`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao aplicar correções:', error);
      toast({
        title: "Erro ao aplicar correções",
        description: `Falha no processamento: ${errorMessage}`,
        variant: "destructive"
      });
    }
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
  const hasCorrections = corrections.length > 0 && corrections.some(c => c.corrections.length > 0);
  const correctionsApplied = !showCorrections && hasCorrections;
  const canProceed = summary.valid > 0 && (!hasErrors || correctionsApplied);
  const hasDownloads = validationResult.downloadUrls && (
    validationResult.downloadUrls.fixedXlsx || 
    validationResult.downloadUrls.reportCsv || 
    validationResult.downloadUrls.reportJson
  );

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

        {/* Downloads Section */}
        {hasDownloads && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Downloads Disponíveis
              </CardTitle>
              <CardDescription>
                Baixe os arquivos processados e relatórios de correção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {validationResult.downloadUrls?.fixedXlsx && (
                  <Button asChild variant="outline" className="justify-start">
                    <a href={validationResult.downloadUrls.fixedXlsx} download="arquivo_corrigido.xlsx">
                      <FileCheck className="h-4 w-4 mr-2" />
                      Arquivo Corrigido
                    </a>
                  </Button>
                )}
                {validationResult.downloadUrls?.reportCsv && (
                  <Button asChild variant="outline" className="justify-start">
                    <a href={validationResult.downloadUrls.reportCsv} download="relatorio_erros.csv">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Relatório CSV
                    </a>
                  </Button>
                )}
                {validationResult.downloadUrls?.reportJson && (
                  <Button asChild variant="outline" className="justify-start">
                    <a href={validationResult.downloadUrls.reportJson} download="relatorio_completo.json">
                      <Info className="h-4 w-4 mr-2" />
                      Relatório JSON
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Alert */}
        {canProceed && !showCorrections && (
          <Alert className="border-success bg-success/5">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              ✅ Arquivo pronto para publicação! {summary.valid} registros serão importados.
              {hasCorrections && correctionsApplied && (
                <div className="mt-1 text-sm">
                  Correções automáticas aplicadas com sucesso.
                </div>
              )}
              {hasCorrections && !correctionsApplied && (
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

        {hasErrors && showCorrections && (
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

        {hasErrors && !showCorrections && !correctionsApplied && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ {summary.errors} problemas impedem a importação.
              {hasCorrections && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-2 p-0 h-auto text-destructive"
                  onClick={() => setShowCorrections(true)}
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Aplicar correções automáticas
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

        {/* Validation Test */}
        <ValidationTestButton />

        {/* Test Page Link */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-blue-700">Página de Teste Completa</h3>
                <p className="text-sm text-muted-foreground">
                  Acesse a página dedicada para testes detalhados do Corretor Inteligente
                </p>
              </div>
              <Button asChild variant="outline" className="border-blue-500/20 text-blue-700">
                <a href="/admin/base-import/test" target="_blank" rel="noopener noreferrer">
                  Abrir Teste
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

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
            {hasErrors && !correctionsApplied ? 'Corrigir Erros Primeiro' : 'Continuar para Prévia'}
          </Button>
        </div>
      </div>
    </div>
  );
}