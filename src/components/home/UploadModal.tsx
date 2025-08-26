import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download
} from "lucide-react";
import { useHomeStore } from "@/lib/store/home";
import { toast } from "sonner";

interface UploadResult {
  rowsProcesso: number;
  rowsTestemunha: number;
  warnings: string[];
}

export const UploadModal = () => {
  const { isUploadOpen, setUploadOpen } = useHomeStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiredHeaders = {
    "Por Processo": [
      "CNJ", "Status", "UF", "Comarca", "Fase", "Reclamante_Limpo",
      "Testemunhas_Ativo_Limpo", "Testemunhas_Passivo_Limpo", 
      "Classificação_Final"
    ],
    "Por Testemunha": [
      "Nome_Testemunha", "Qtd_Depoimentos", "Em_Ambos_Polos", 
      "Já_Foi_Reclamante", "Classificação_Estratégica"
    ]
  };

  const mockUpload = async (file: File): Promise<UploadResult> => {
    // Simulate API call with progress
    for (let i = 0; i <= 100; i += 20) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Mock validation
    if (!file.name.toLowerCase().includes('processo') && !file.name.toLowerCase().includes('testemunha')) {
      throw new Error('Arquivo deve conter dados de processo ou testemunha no nome');
    }

    return {
      rowsProcesso: 156,
      rowsTestemunha: 89,
      warnings: [
        "3 linhas com CNJ inválido foram ignoradas",
        "Encontrados 2 registros duplicados (removidos automaticamente)"
      ]
    };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const uploadResult = await mockUpload(file);
      setResult(uploadResult);
      
      toast.success("Upload concluído!", {
        description: `Processados ${uploadResult.rowsProcesso + uploadResult.rowsTestemunha} registros`
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido no upload';
      setError(errorMsg);
      toast.error("Erro no upload", { description: errorMsg });
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleClose = () => {
    if (!uploading) {
      setUploadOpen(false);
      setResult(null);
      setError(null);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    toast.info("Download iniciado", {
      description: "Arquivo de template será baixado em breve"
    });
  };

  return (
    <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Planilha
          </DialogTitle>
          <DialogDescription>
            Envie uma planilha Excel (.xlsx) ou CSV com as abas "Por Processo" e "Por Testemunha"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${uploading ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              </div>
              
              {isDragActive ? (
                <p className="text-primary font-medium">Solte o arquivo aqui...</p>
              ) : (
                <div>
                  <p className="font-medium mb-1">
                    Arraste um arquivo ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Suporte para .xlsx e .csv (máx. 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4 p-4 bg-success-light/50 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-medium text-success">Upload concluído com sucesso!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Por Processo:</span> {result.rowsProcesso} registros
                </div>
                <div>
                  <span className="font-medium">Por Testemunha:</span> {result.rowsTestemunha} registros
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-warning-foreground">Avisos:</span>
                  {result.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-warning-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-warning-foreground">{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-destructive-light/50 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <span className="font-medium text-destructive">Erro no processamento</span>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Required Headers */}
          <div className="space-y-4">
            <h4 className="font-medium">Cabeçalhos obrigatórios:</h4>
            
            {Object.entries(requiredHeaders).map(([sheet, headers]) => (
              <div key={sheet} className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">{sheet}:</h5>
                <div className="flex flex-wrap gap-1">
                  {headers.map((header) => (
                    <Badge key={header} variant="outline" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar Modelo
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                {result ? 'Fechar' : 'Cancelar'}
              </Button>
              
              {result && (
                <Button onClick={() => window.location.href = '/dados/mapa'}>
                  Ver Resultados
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};