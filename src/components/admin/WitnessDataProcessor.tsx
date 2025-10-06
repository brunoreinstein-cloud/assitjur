import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const WitnessDataProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    processedCount: number;
    totalProcessos: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessWitnessData = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "process-witness-data",
      );

      if (functionError) {
        throw functionError;
      }

      setResult(data);
      toast.success("Dados de testemunhas processados com sucesso!");
    } catch (err: any) {
      const errorMessage =
        err.message || "Erro ao processar dados de testemunhas";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Processamento de Dados de Testemunhas
        </CardTitle>
        <CardDescription>
          Processa os dados importados para extrair e popular informações de
          testemunhas nos processos. Esta ação deve ser executada após uma
          importação para garantir que os dados apareçam no mapa de testemunhas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>{result.message}</strong>
                </p>
                <p>
                  Processos processados: {result.processedCount} de{" "}
                  {result.totalProcessos}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleProcessWitnessData}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando dados...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Processar Dados de Testemunhas
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            Este processo pode levar alguns minutos dependendo da quantidade de
            dados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
