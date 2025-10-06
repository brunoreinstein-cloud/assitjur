import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Upload,
  AlertCircle,
  Zap,
  Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ImportSession, ValidationResult } from "@/lib/importer/types";

interface ConfirmStepProps {
  session: ImportSession;
  validationResult: ValidationResult;
  onComplete: () => void;
}

export function ConfirmStep({
  validationResult,
  onComplete,
}: ConfirmStepProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

  const canImport =
    validationResult.summary.valid > 0 && validationResult.summary.errors === 0;

  const handleImport = async () => {
    if (!canImport || !validationResult.normalizedData.processos) return;

    setIsImporting(true);
    setImportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Call import function with normalized data
      const { data, error } = await supabase.functions.invoke(
        "import-mapa-testemunhas",
        {
          body: {
            processos: validationResult.normalizedData.processos,
          },
        },
      );

      if (error) throw error;

      setImportProgress(100);
      setImportResult(data);

      toast({
        title: "Importação concluída!",
        description: `${data.upserts} registros importados com sucesso.`,
      });

      // Auto-complete after short delay
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      // Error notification is handled by ErrorHandler.handleAndNotify
    } finally {
      clearInterval(progressInterval);
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Confirmação e Importação
        </CardTitle>
        <CardDescription>
          Revise os dados e confirme a importação para o banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">
              {validationResult.summary.analyzed}
            </div>
            <div className="text-sm text-muted-foreground">Total analisado</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {validationResult.summary.valid}
            </div>
            <div className="text-sm text-muted-foreground">
              Serão importados
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {validationResult.summary.errors}
            </div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {validationResult.summary.warnings}
            </div>
            <div className="text-sm text-muted-foreground">Avisos</div>
          </div>
        </div>

        {/* Status Alerts */}
        {canImport ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Pronto para importar!</strong>{" "}
              {validationResult.summary.valid} registros válidos serão
              adicionados ao banco de dados.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Não é possível importar.</strong> Corrija os erros antes
              de prosseguir.
            </AlertDescription>
          </Alert>
        )}

        {/* Import Progress */}
        {isImporting && (
          <div className="space-y-3">
            <Progress value={importProgress} className="w-full" />
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="h-3 w-3 animate-pulse" />
              {importProgress < 85
                ? `Processando dados... ${Math.round(importProgress)}%`
                : "Salvando no banco de dados..."}
            </p>
          </div>
        )}

        {/* Import Result */}
        {importResult && !isImporting && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Importação concluída!</strong>
              <div className="mt-2 space-y-1">
                <div>• {importResult.upserts} registros processados</div>
                <div>
                  • {importResult.validRows} registros válidos de{" "}
                  {importResult.stagingRows} totais
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="text-red-600">
                    • {importResult.errors.length} erros encontrados
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-between">
          <Button variant="outline" onClick={onComplete} disabled={isImporting}>
            Voltar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport || isImporting}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importando..." : "Confirmar Importação"}
          </Button>
        </div>

        {/* Data Preview */}
        {validationResult.normalizedData.processos && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">
              Prévia dos Dados (primeiras 3 linhas)
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 font-medium text-sm">
                CNJ | Reclamante | Réu | Comarca
              </div>
              {validationResult.normalizedData.processos
                .slice(0, 3)
                .map((row, index) => (
                  <div key={index} className="p-2 text-sm border-t">
                    {row.cnj} | {row.reclamante_nome} | {row.reu_nome} |{" "}
                    {row.comarca || "N/A"}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
