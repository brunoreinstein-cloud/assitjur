import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useAssistJurImport } from "@/hooks/useAssistJurImport";
import { ValidationModal } from "@/components/assistjur/ValidationModal";
import { AssistJurImportResult } from "@/types/assistjur";
import { asString } from "@/types/safe";

export const AssistJurUploadWizard = () => {
  const [validationResult, setValidationResult] =
    useState<AssistJurImportResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const { uploadFile, isUploading } = useAssistJurImport();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Apenas arquivos Excel (.xlsx, .xls) são suportados");
      return;
    }

    try {
      const result = await uploadFile(file);
      setValidationResult(result);
      setShowValidation(true);
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  return (
    <>
      <div className="space-y-6">
        {/* Cabeçalho com instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Template AssistJur.IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">
                Abas obrigatórias:
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  • <strong>Por Processo:</strong> cnj, uf, comarca,
                  advogados_ativo, todas_testemunhas
                </li>
                <li>
                  • <strong>Por Testemunha:</strong> nome_testemunha,
                  qtd_depoimentos, cnjs_como_testemunha
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <strong>Sinônimos aceitos:</strong> "Advogados (Polo Ativo)",
                "testemunhas_todas", "CNJs_Como_Testemunha" e outras variações
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área de upload */}
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <Upload
                  className={`h-12 w-12 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {isDragActive
                      ? "Solte o arquivo aqui..."
                      : "Envie sua planilha Excel"}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Arraste e solte ou clique para selecionar um arquivo .xlsx
                    ou .xls (máx. 50MB)
                  </p>
                </div>
                {!isDragActive && (
                  <Button variant="outline" disabled={isUploading}>
                    {isUploading ? "Processando..." : "Selecionar Arquivo"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado da validação (preview) */}
        {validationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Processamento Concluído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-accent p-3 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {validationResult.report?.summary.total_rows ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {validationResult.report?.summary.valid_rows ?? 0}
                  </div>
                  <div className="text-sm text-green-600">Válidas</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {validationResult.report?.summary.error_count ?? 0}
                  </div>
                  <div className="text-sm text-red-600">Erros</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">
                    {validationResult.report?.summary.warning_count ?? 0}
                  </div>
                  <div className="text-sm text-amber-600">Avisos</div>
                </div>
              </div>

              <Button
                onClick={() => setShowValidation(true)}
                className="w-full"
              >
                Ver Relatório Detalhado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de validação */}
      {showValidation && validationResult && (
        <ValidationModal
          open={showValidation}
          onClose={() => setShowValidation(false)}
          report={
            validationResult.report ?? {
              issues: [],
              summary: {
                total_rows: 0,
                valid_rows: 0,
                error_count: 0,
                warning_count: 0,
                total_sheets: 0,
                success_rate: 0,
              },
              samples: { processos: [], testemunhas: [] },
              compliance: { lgpd_compliant: true, warning_message: "" },
            }
          }
          uploadId={asString(validationResult.upload_id)}
        />
      )}
    </>
  );
};
