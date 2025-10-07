import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Info,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useImportStore } from "@/features/importer/store/useImportStore";
import { CorrectionInterface } from "@/components/importer/CorrectionInterface";
import { IssuesDataTable } from "@/components/assistjur/IssuesDataTable";
import { getExcelAddress } from "@/lib/excel/cell-addressing";
import { validateCNJ } from "@/lib/validation/unified-cnj";
import { intelligentValidateAndCorrect } from "@/lib/importer/intelligent-corrector";
import { ReviewUpdateButton } from "@/components/admin/ReviewUpdateButton";
import { ValidationTestButton } from "@/components/importer/ValidationTestButton";
import { logger } from "@/lib/logger";
import { ErrorHandler } from "@/lib/error-handling";

export function ValidationStep() {
  const {
    session,
    file,
    validationResult,
    setValidationResult,
    setCurrentStep,
    isProcessing,
    setIsProcessing,
    setError,
  } = useImportStore();

  const [showCorrections, setShowCorrections] = useState(false);
  const [corrections, setCorrections] = useState<CorrectedRow[]>([]);

  const performValidation = useCallback(async () => {
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
        file,
      );

      // Store corrections for UI
      if (
        result.intelligentCorrections &&
        result.intelligentCorrections.length > 0
      ) {
        setCorrections(result.intelligentCorrections);
        const correctionsWithData = result.intelligentCorrections.filter(
          (c) => c.corrections.length > 0,
        );
        if (correctionsWithData.length > 0) {
          setShowCorrections(true);
        }
      }

      // Convert to ValidationResult format for store compatibility
      const validationWithUrls: ValidationResult = {
        summary: result.summary,
        issues: result.issues,
        normalizedData: result.normalizedData,
        downloadUrls: {
          fixedXlsx: "",
          reportCsv: "",
          reportJson: "",
        },
      };

      setValidationResult(validationWithUrls);

      toast({
        title: "Validação inteligente concluída",
        description: `${result.summary.analyzed} registros analisados, ${result.summary.valid} válidos, ${result.intelligentCorrections?.filter((c) => c.corrections.length > 0).length || 0} correções sugeridas`,
      });

      logger.info(
        "Final Validation Summary",
        {
          originalFile: file.name,
          fileSize: file.size,
          sheetsDetected: session.sheets.length,
          analyzed: result.summary.analyzed,
          valid: result.summary.valid,
          errors: result.summary.errors,
          warnings: result.summary.warnings,
          correctionsAvailable: result.intelligentCorrections?.length || 0,
          correctionsWithChanges:
            result.intelligentCorrections?.filter(
              (c) => c.corrections.length > 0,
            ).length || 0,
        },
        "ValidationStep",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro na validação";
      const handledError = ErrorHandler.handleAndNotify(
        error,
        "ValidationStep.performValidation",
      );
      setError(handledError.userMessage || errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [session, file, setIsProcessing, setValidationResult, setError]);

  useEffect(() => {
    if (session && file && !validationResult) {
      performValidation();
    }
  }, [session, file, validationResult, performValidation]);

  // Simple validation stats calculation
  useEffect(() => {
    if (validationResult) {
      const stats = {
        originalRows: validationResult.summary.analyzed,
        processedRows: validationResult.summary.valid,
        filteredRows:
          validationResult.summary.analyzed - validationResult.summary.valid,
        validRows: validationResult.summary.valid,
        correctedRows: corrections.length,
        errorRows: validationResult.summary.errors,
        warningRows: validationResult.summary.warnings,
      };
      logger.info("Detailed Validation Stats", stats, "ValidationStep");
    }
  }, [validationResult, corrections]);


  const handleApplyCorrections = useCallback(async (correctedData: RawRow[]) => {
    const correctionsApplied = corrections.filter(
      (c) => c.corrections.length > 0,
    ).length;

    try {
      // Import generateReports function
      const { generateReports } = await import("@/lib/importer/report");

      // Separate corrected data by type using unified CNJ validation
      const processos = correctedData.filter((d) => {
        const cnjValidation = validateCNJ(d.cnj, "correction");
        const hasEssentialFields = d.reclamante_nome || d.reu_nome;
        return cnjValidation.isValid || hasEssentialFields;
      });

      const testemunhas = correctedData.filter((d) => {
        const cnjValidation = validateCNJ(d.cnj, "correction");
        const hasTestemunhaData = d.nome_testemunha;
        return cnjValidation.isValid || hasTestemunhaData;
      });

      // Build corrections map using unified Excel addressing
      const correctionsMap = new Map<string, CorrectedCell>();

      corrections.forEach((row, rowIndex) => {
        row.corrections.forEach((correction) => {
          // Find field index in the data structure for correct column mapping
          const sampleData = correctedData[0] || {};
          const fieldNames = Object.keys(sampleData);
          const fieldIndex = fieldNames.indexOf(correction.field);

          if (fieldIndex >= 0) {
            // Use unified Excel addressing system
            const address = getExcelAddress(rowIndex + 1, fieldIndex); // +1 for header row

            correctionsMap.set(address, {
              address,
              original: correction.originalValue,
              corrected: correction.correctedValue,
              reason: `${correction.correctionType}: ${correction.reason || "Correção automática"}`,
            });
          }
        });
      });

      // Generate updated result with ALL corrected data preserved
      const updatedResult: ValidationResult = {
        ...validationResult!,
        normalizedData: {
          // Preserve both processos and testemunhas data
          processos: processos.length > 0 ? processos : undefined,
          testemunhas: testemunhas.length > 0 ? testemunhas : undefined,
        },
        summary: {
          ...validationResult!.summary,
          valid: processos.length + testemunhas.length,
          errors: Math.max(
            0,
            validationResult!.summary.errors - correctionsApplied,
          ),
        },
      };

      // Generate reports and download URLs with proper corrections map
      const downloadUrls = await generateReports(
        updatedResult,
        file?.name || "arquivo_corrigido",
        correctionsMap, // Pass real corrections map for visual formatting
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
      const handledError = ErrorHandler.handleAndNotify(
        error,
        "ValidationStep.handleApplyCorrections",
      );
      logger.error(
        "Erro ao aplicar correções",
        {
          error: handledError.message,
          correctionsCount: corrections.length,
        },
        "ValidationStep",
      );
    }
  }, [corrections, file, setValidationResult, validationResult]);

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
            <CheckCircle2 className="h-5 w-5" />
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
  const hasCorrections =
    corrections.length > 0 && corrections.some((c) => c.corrections.length > 0);
  const correctionsApplied = !showCorrections && hasCorrections;
  const canProceed = summary.valid > 0 && (!hasErrors || correctionsApplied);
  const hasDownloads =
    validationResult.downloadUrls &&
    (validationResult.downloadUrls.fixedXlsx ||
      validationResult.downloadUrls.reportCsv ||
      validationResult.downloadUrls.reportJson);

  return (
    <div className="space-y-6">
      {/* Validation Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold">
            {summary.analyzed.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Linhas analisadas</div>
        </Card>
        <Card className="text-center p-4 bg-success/5 border-success/20">
          <div className="text-2xl font-bold text-success">
            {summary.valid.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Linhas válidas</div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.analyzed > 0
              ? `${Math.round((summary.valid / summary.analyzed) * 100)}%`
              : "0%"}
          </div>
        </Card>
        <Card className="text-center p-4 bg-destructive/5 border-destructive/20">
          <div className="text-2xl font-bold text-destructive">
            {summary.errors}
          </div>
          <div className="text-sm text-muted-foreground">Erros</div>
          {summary.errors > 0 && (
            <div className="text-xs text-destructive mt-1">
              Impedem publicação
            </div>
          )}
        </Card>
        <Card className="text-center p-4 bg-warning/5 border-warning/20">
          <div className="text-2xl font-bold text-warning">
            {summary.warnings}
          </div>
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
                  <a
                    href={validationResult.downloadUrls.fixedXlsx}
                    download="arquivo_corrigido.xlsx"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Arquivo Corrigido
                  </a>
                </Button>
              )}
              {validationResult.downloadUrls?.reportCsv && (
                <Button asChild variant="outline" className="justify-start">
                  <a
                    href={validationResult.downloadUrls.reportCsv}
                    download="relatorio_erros.csv"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Relatório CSV
                  </a>
                </Button>
              )}
              {validationResult.downloadUrls?.reportJson && (
                <Button asChild variant="outline" className="justify-start">
                  <a
                    href={validationResult.downloadUrls.reportJson}
                    download="relatorio_completo.json"
                  >
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
            ✅ Arquivo pronto para publicação! {summary.valid} registros serão
            importados.
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
            ❌ Corrija os erros antes de prosseguir. {summary.errors} problemas
            impedem a importação.
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
            <IssuesDataTable
              issues={issues.map((issue) => ({
                ...issue,
                message: issue.message || issue.rule,
              }))}
            />
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
              <h3 className="font-semibold text-blue-700">
                Página de Teste Completa
              </h3>
              <p className="text-sm text-muted-foreground">
                Acesse a página dedicada para testes detalhados do Corretor
                Inteligente
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-blue-500/20 text-blue-700"
            >
              <a
                href="/admin/base-import/test"
                target="_blank"
                rel="noopener noreferrer"
              >
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
              Execute uma revisão completa para detectar padrões suspeitos e
              otimizar a base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewUpdateButton />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep("upload")}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={performValidation}
            disabled={isProcessing}
          >
            {isProcessing && (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            )}
            Revalidar
          </Button>
          <Button
            onClick={() => setCurrentStep("preview")}
            disabled={!canProceed}
          >
            {hasErrors && !correctionsApplied
              ? "Corrigir Erros Primeiro"
              : "Continuar para Prévia"}
          </Button>
        </div>
      </div>
    </div>
  );
}
