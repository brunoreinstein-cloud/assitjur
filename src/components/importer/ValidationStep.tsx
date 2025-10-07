import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  RefreshCw,
  FileX,
  Shield,
} from "lucide-react";
import { normalizeAndValidate as enhancedValidate } from "@/lib/importer/validate-enhanced";
import { generateReports } from "@/lib/importer/report";
import type { ImportSession, ValidationResult } from "@/lib/importer/types";

interface ValidationStepProps {
  session: ImportSession;
  file: File; // Adicionar arquivo para processamento real
  onComplete: (result: ValidationResult) => void;
}

export function ValidationStep({
  session,
  file,
  onComplete,
}: ValidationStepProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [autoCorrections, setAutoCorrections] = useState({
    explodeLists: true,
    standardizeCNJ: true,
    applyDefaultReu: true,
    intelligentCorrections: true,
  });
  const [appliedCorrections, setAppliedCorrections] = useState<
    Map<string, any>
  >(new Map());

  useEffect(() => {
    processValidation();
  }, [session]);

  const processValidation = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Simula progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Normalização e validação COM DADOS REAIS
      const validationResult = await enhancedValidate(
        session,
        autoCorrections,
        file,
      );

      // Armazenar correções aplicadas
      if (validationResult.corrections) {
        setAppliedCorrections(validationResult.corrections);
      }

      // Geração de relatórios
      const reports = await generateReports(
        validationResult,
        session.fileName,
        validationResult.corrections,
      );

      clearInterval(progressInterval);
      setProgress(100);

      const finalResult: ValidationResult = {
        ...validationResult,
        downloadUrls: reports,
      };

      setResult(finalResult);
    } catch (error) {
      console.error("Erro na validação:", error);
      // Continua com resultado vazio para não quebrar a UI
      setResult({
        summary: { analyzed: 0, valid: 0, errors: 1, warnings: 0, infos: 0 },
        issues: [
          {
            sheet: "Erro",
            row: 0,
            column: "Sistema",
            severity: "error",
            rule: "Falha no processamento",
            value: error instanceof Error ? error.message : "Erro desconhecido",
          },
        ],
        normalizedData: {},
        downloadUrls: { fixedXlsx: "", reportCsv: "", reportJson: "" },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case "info":
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            Erro
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-warning/10 text-warning-foreground border-warning/20">
            Aviso
          </Badge>
        );
      case "info":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Info
          </Badge>
        );
      default:
        return <Badge variant="secondary">OK</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status de Processamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isProcessing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Validando & Normalizando Dados
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                Validação Concluída
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {progress < 30
                  ? "Carregando dados..."
                  : progress < 60
                    ? "Normalizando estrutura..."
                    : progress < 85
                      ? "Validando regras de negócio..."
                      : "Gerando relatórios..."}
              </p>
            </div>
          ) : (
            result && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {result.summary.analyzed.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Analisadas
                  </div>
                </div>
                <div className="text-center p-4 bg-success-light rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {result.summary.valid.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Válidas</div>
                </div>
                <div className="text-center p-4 bg-destructive-light rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {result.summary.errors}
                  </div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
                <div className="text-center p-4 bg-warning-light rounded-lg">
                  <div className="text-2xl font-bold text-warning-foreground">
                    {result.summary.warnings}
                  </div>
                  <div className="text-sm text-muted-foreground">Avisos</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {result.summary.infos}
                  </div>
                  <div className="text-sm text-muted-foreground">Infos</div>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Auto-correções */}
      {!isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurações de Auto-correção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Explodir listas de CNJs</Label>
                <p className="text-sm text-muted-foreground">
                  Converte CNJs_Como_Testemunha em linhas individuais
                </p>
              </div>
              <Switch
                checked={autoCorrections.explodeLists}
                onCheckedChange={(checked) =>
                  setAutoCorrections((prev) => ({
                    ...prev,
                    explodeLists: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Padronizar CNJ</Label>
                <p className="text-sm text-muted-foreground">
                  Remove máscaras e valida 20 dígitos
                </p>
              </div>
              <Switch
                checked={autoCorrections.standardizeCNJ}
                onCheckedChange={(checked) =>
                  setAutoCorrections((prev) => ({
                    ...prev,
                    standardizeCNJ: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Aplicar Réu padrão</Label>
                <p className="text-sm text-muted-foreground">
                  Preenche automaticamente o nome do réu quando vazio
                </p>
              </div>
              <Switch
                checked={autoCorrections.applyDefaultReu}
                onCheckedChange={(checked) =>
                  setAutoCorrections((prev) => ({
                    ...prev,
                    applyDefaultReu: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Correções Inteligentes</Label>
                <p className="text-sm text-muted-foreground">
                  Corrige CNJs, datas, nomes e preenche campos automaticamente
                </p>
              </div>
              <Switch
                checked={autoCorrections.intelligentCorrections}
                onCheckedChange={(checked) =>
                  setAutoCorrections((prev) => ({
                    ...prev,
                    intelligentCorrections: checked,
                  }))
                }
              />
            </div>

            <Button onClick={processValidation} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reprocessar com Novas Configurações
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {result && !isProcessing && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="corrections">
              Correções ({appliedCorrections.size})
            </TabsTrigger>
            <TabsTrigger value="issues">
              Issues ({result.issues.length})
            </TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Validação</CardTitle>
              </CardHeader>
              <CardContent>
                {result.summary.errors === 0 ? (
                  <Alert className="border-success/20 bg-success-light">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <AlertDescription className="text-success-foreground">
                      Arquivo processado com sucesso! Nenhum erro crítico
                      encontrado.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {result.summary.errors} erro(s) crítico(s) encontrado(s).
                      Revise os problemas antes de continuar.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corrections">
            <Card>
              <CardHeader>
                <CardTitle>Correções Aplicadas Automaticamente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {appliedCorrections.size === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma correção automática foi aplicada
                    </p>
                  ) : (
                    Array.from(appliedCorrections.entries()).map(
                      ([key, correction], index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <Badge variant="outline" className="text-xs">
                              {key.split("!")[0]} - {key.split("_")[1]}
                            </Badge>
                            <Badge className="bg-success/10 text-success border-success/20">
                              {correction.type}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">
                            {correction.reason}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>
                              <strong>Original:</strong>{" "}
                              {String(correction.original) || "vazio"}
                            </div>
                            <div>
                              <strong>Corrigido:</strong>{" "}
                              {String(correction.corrected)}
                            </div>
                            <div>
                              <strong>Confiança:</strong>{" "}
                              {Math.round(correction.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>Problemas Detectados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.issues.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum problema encontrado! 🎉
                    </p>
                  ) : (
                    result.issues.slice(0, 50).map((issue, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 space-y-1"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(issue.severity)}
                            {getSeverityBadge(issue.severity)}
                            <Badge variant="outline" className="text-xs">
                              {issue.sheet} - Linha {issue.row}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm">
                          <strong>{issue.column}:</strong> {issue.rule}
                        </p>
                        {issue.value !== null && issue.value !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Valor: {String(issue.value).substring(0, 100)}
                          </p>
                        )}
                        {issue.autofilled && (
                          <Badge className="bg-primary/10 text-primary text-xs">
                            Auto-preenchido
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                  {result.issues.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... e mais {result.issues.length - 50} problemas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle>Downloads Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.downloadUrls?.fixedXlsx && (
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <a
                        href={result.downloadUrls?.fixedXlsx}
                        download={`${session.fileName.replace(/\.[^/.]+$/, "")}_corrigido.xlsx`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Arquivo Corrigido (XLSX)
                      </a>
                    </Button>
                    {appliedCorrections.size > 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ✨ Este arquivo contém {appliedCorrections.size}{" "}
                        correção(ões) automática(s)
                      </p>
                    )}
                  </div>
                )}

                {result.downloadUrls?.reportCsv && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={result.downloadUrls?.reportCsv} download>
                      <FileX className="h-4 w-4 mr-2" />
                      Baixar Relatório (CSV)
                    </a>
                  </Button>
                )}

                {result.downloadUrls?.reportJson && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={result.downloadUrls?.reportJson} download>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Relatório (JSON)
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Botão de Continue */}
      {result && !isProcessing && (
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1">
            Voltar ao Upload
          </Button>
          <Button
            onClick={() => onComplete(result)}
            className="flex-1"
            disabled={result.summary.errors > 0}
          >
            {result.summary.errors > 0
              ? "Corrija os Erros Primeiro"
              : "Continuar para Confirmação"}
          </Button>
        </div>
      )}
    </div>
  );
}
