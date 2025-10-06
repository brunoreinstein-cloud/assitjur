import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Download, FileText } from "lucide-react";
import { intelligentValidateAndCorrect } from "@/lib/importer/intelligent-corrector";
import { detectFileStructure } from "@/features/importer/etl/detect";

export function ValidationTestButton() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runValidationTest = async () => {
    setIsLoading(true);
    try {
      // Download and test the updated template
      const templateUrl = "/template-test-exemplo.csv";
      const response = await fetch(templateUrl);
      const blob = await response.blob();
      const testFile = new File([blob], "template-test-exemplo.csv", {
        type: "text/csv",
      });

      // Detect file structure
      const sheets = await detectFileStructure(testFile);

      // Create session
      const session = {
        sessionId: crypto.randomUUID(),
        fileName: testFile.name,
        fileSize: testFile.size,
        sheets: sheets,
        uploadedAt: new Date(),
      };

      // Run intelligent validation
      const result = await intelligentValidateAndCorrect(
        session,
        {
          explodeLists: true,
          standardizeCNJ: true,
          applyDefaultReu: true,
          intelligentCorrections: true,
        },
        testFile,
      );

      setTestResult({
        success: true,
        sheets: sheets.length,
        analyzed: result.summary.analyzed,
        valid: result.summary.valid,
        errors: result.summary.errors,
        warnings: result.summary.warnings,
        corrections: result.intelligentCorrections?.length || 0,
        correctionsApplied:
          result.intelligentCorrections?.filter((c) => c.corrections.length > 0)
            .length || 0,
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Teste do Corretor Inteligente
        </CardTitle>
        <CardDescription>
          Valide se o template atualizado funciona corretamente com o novo
          sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runValidationTest}
          disabled={isLoading}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading ? "Testando Template..." : "Testar Template Corrigido"}
        </Button>

        {testResult && (
          <div className="space-y-4">
            {testResult.success ? (
              <Alert className="border-success bg-success/5">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  <strong>✅ Teste Aprovado!</strong> Template funciona
                  perfeitamente com o Corretor Inteligente
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>❌ Teste Falhou:</strong> {testResult.error}
                </AlertDescription>
              </Alert>
            )}

            {testResult.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-3 text-center">
                  <div className="text-lg font-bold">{testResult.sheets}</div>
                  <div className="text-xs text-muted-foreground">
                    Abas detectadas
                  </div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-lg font-bold">{testResult.analyzed}</div>
                  <div className="text-xs text-muted-foreground">
                    Linhas analisadas
                  </div>
                </Card>
                <Card className="p-3 text-center bg-success/10 border-success/20">
                  <div className="text-lg font-bold text-success">
                    {testResult.valid}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Linhas válidas
                  </div>
                </Card>
                <Card className="p-3 text-center bg-blue-500/10 border-blue-500/20">
                  <div className="text-lg font-bold text-blue-600">
                    {testResult.correctionsApplied}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Correções aplicadas
                  </div>
                </Card>
              </div>
            )}

            {testResult.success && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  {testResult.errors} Erros
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-warning/10 text-warning border-warning/20"
                >
                  {testResult.warnings} Avisos
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-600 border-blue-500/20"
                >
                  {testResult.corrections} Correções Detectadas
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
