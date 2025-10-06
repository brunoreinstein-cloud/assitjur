import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "@/hooks/use-toast";
import { detectFileStructure } from "@/features/importer/etl/detect";
import { generateSessionId } from "@/features/importer/etl/utils";
import { MappingDialog } from "@/features/importer/components/MappingDialog";
import { useImportStore } from "@/features/importer/store/useImportStore";
import type { ImportSession, DetectedSheet } from "@/lib/importer/types";
import { useState } from "react";

export function UploadStep() {
  const {
    setSession,
    setFile,
    setCurrentStep,
    isProcessing,
    setIsProcessing,
    uploadProgress,
    setUploadProgress,
    error,
    setError,
  } = useImportStore();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [detectedSheets, setDetectedSheets] = useState<DetectedSheet[]>([]);
  const [showMapping, setShowMapping] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // File size validation (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        setError("Arquivo muito grande. Tamanho máximo: 20MB");
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 20MB",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      setError(null);
      setIsProcessing(true);
      setUploadProgress(0);

      // Add debouncing to prevent rate limiting
      const debounceTimeout = setTimeout(async () => {
        try {
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress((prev: number) => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + Math.random() * 15; // Slower progress to reduce pressure
            });
          }, 150); // Slower interval

          console.log("Starting file structure detection for:", file.name);

          // Detect file structure with retry logic
          let sheets: any[] = [];
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              sheets = await detectFileStructure(file);
              break;
            } catch (err) {
              retryCount++;
              if (retryCount === maxRetries) {
                throw err;
              }

              console.log(
                `Retry ${retryCount}/${maxRetries} for file detection`,
              );
              // Exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount),
              );
            }
          }

          clearInterval(progressInterval);
          setUploadProgress(100);
          setDetectedSheets(sheets);

          console.log(
            "Detected sheets:",
            sheets.map((s) => ({ name: s.name, model: s.model })),
          );

          // Check if manual mapping is needed
          const hasAmbiguous = sheets.some((s) => s.model === "ambiguous");

          if (hasAmbiguous) {
            console.log("Ambiguous sheets detected, showing mapping dialog");
            setShowMapping(true);
          } else {
            handleContinue(sheets, file);
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Erro ao processar arquivo";
          console.error("File processing error:", errorMessage);

          setError(errorMessage);
          toast({
            title: "Erro no processamento",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      }, 300); // 300ms debounce

      // Cleanup timeout if component unmounts
      return () => clearTimeout(debounceTimeout);
    },
    [setError, setIsProcessing, setUploadProgress],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const handleContinue = (sheets: DetectedSheet[], file: File) => {
    // Validate at least one valid sheet
    const hasValidSheet = sheets.some(
      (s) => s.model === "processo" || s.model === "testemunha",
    );

    if (!hasValidSheet) {
      setError("Arquivo deve conter pelo menos uma aba válida");
      toast({
        title: "Estrutura inválida",
        description: "É necessário ter pelo menos uma aba com estrutura válida",
        variant: "destructive",
      });
      return;
    }

    const session: ImportSession = {
      fileName: file.name,
      fileSize: file.size,
      sheets,
      uploadedAt: new Date(),
      sessionId: generateSessionId(),
    };

    setSession(session);
    setFile(file);
    setCurrentStep("validation");
  };

  const handleMappingComplete = (updatedSheets: DetectedSheet[]) => {
    setShowMapping(false);
    if (uploadedFile) {
      handleContinue(updatedSheets, uploadedFile);
    }
  };

  const getModelBadge = (model: string) => {
    switch (model) {
      case "testemunha":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Por Testemunha
          </Badge>
        );
      case "processo":
        return (
          <Badge className="bg-accent/10 text-accent border-accent/20">
            Por Processo
          </Badge>
        );
      case "ambiguous":
        return (
          <Badge className="bg-warning/10 text-warning-foreground border-warning/20">
            Requer mapeamento
          </Badge>
        );
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivo
          </CardTitle>
          <CardDescription>
            Faça upload do arquivo CSV ou XLSX com os dados das testemunhas e
            processos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dropzone */}
          {!uploadedFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg font-medium">Solte o arquivo aqui...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Arraste o arquivo ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: Excel (.xlsx, .xls) e CSV • Máximo 20MB
                  </p>
                  <div className="mt-4">
                    <Button variant="outline">Selecionar Arquivo</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected file */}
          {uploadedFile && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isProcessing && detectedSheets.length > 0 && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </div>

                {isProcessing && (
                  <div className="mt-4 space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {uploadProgress < 50
                        ? "Carregando arquivo..."
                        : uploadProgress < 90
                          ? "Analisando estrutura..."
                          : "Finalizando detecção..."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Detected sheets */}
          {detectedSheets.length > 0 && !isProcessing && !showMapping && (
            <div className="space-y-4">
              <h3 className="font-medium">Abas Detectadas:</h3>
              <div className="grid gap-3">
                {detectedSheets.map((sheet, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sheet.name}</span>
                          {getModelBadge(sheet.model)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sheet.rows.toLocaleString()} linhas •{" "}
                          {sheet.headers.length} colunas
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() =>
                  uploadedFile && handleContinue(detectedSheets, uploadedFile)
                }
                className="w-full"
                disabled={!uploadedFile}
              >
                Continuar para Validação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapping Dialog */}
      <MappingDialog
        open={showMapping}
        sheets={detectedSheets}
        onComplete={handleMappingComplete}
        onCancel={() => setShowMapping(false)}
      />
    </>
  );
}
