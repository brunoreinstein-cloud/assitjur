import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { detectFileStructure } from '@/lib/importer/detect';
import { generateSessionId } from '@/lib/importer/utils';
import { MappingDialog } from '@/components/importer/MappingDialog';
import type { ImportSession, DetectedSheet } from '@/lib/importer/types';

interface UploadStepProps {
  onComplete: (session: ImportSession, file: File) => void; // Incluir arquivo no callback
}

export function UploadStep({ onComplete }: UploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedSheets, setDetectedSheets] = useState<DetectedSheet[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Simula progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 100);

      // Detecta estrutura
      const sheets = await detectFileStructure(uploadedFile);
      
      clearInterval(progressInterval);
      setProgress(100);
      setDetectedSheets(sheets);

      // Verifica se precisa de mapeamento manual
      const hasAmbiguous = sheets.some(s => s.model === 'ambiguous');
      
      if (hasAmbiguous) {
        setShowMapping(true);
      } else {
        // Continua automaticamente
        handleContinue(sheets);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleContinue = (sheets: DetectedSheet[]) => {
    if (!file) return;

    const session: ImportSession = {
      fileName: file.name,
      fileSize: file.size,
      sheets,
      uploadedAt: new Date(),
      sessionId: generateSessionId()
    };

    onComplete(session, file); // Passar arquivo junto com session
  };

  const handleMappingComplete = (updatedSheets: DetectedSheet[]) => {
    setShowMapping(false);
    handleContinue(updatedSheets);
  };

  const getModelBadge = (model: string) => {
    switch (model) {
      case 'testemunha':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Por Testemunha</Badge>;
      case 'processo':
        return <Badge className="bg-accent/10 text-accent border-accent/20">Por Processo</Badge>;
      case 'ambiguous':
        return <Badge className="bg-warning/10 text-warning-foreground border-warning/20">Ambíguo</Badge>;
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
            Upload & Detecção de Estrutura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dropzone */}
          {!file && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg font-medium">Solte o arquivo aqui...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">Arraste o arquivo ou clique para selecionar</p>
                  <p className="text-sm text-muted-foreground">
                    Suporta: Excel (.xlsx, .xls) e CSV
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamanho máximo: 50MB
                  </p>
                  <div className="mt-4">
                    <Link 
                      to="/import/template"
                      className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar template
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Arquivo selecionado */}
          {file && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </div>

                {isProcessing && (
                  <div className="mt-4 space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {progress < 50 ? 'Carregando arquivo...' : 
                       progress < 90 ? 'Analisando estrutura...' : 
                       'Finalizando detecção...'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sheets detectadas */}
          {detectedSheets.length > 0 && !isProcessing && (
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
                          {sheet.rows.toLocaleString()} linhas • {sheet.headers.length} colunas
                        </p>
                        {sheet.hasListColumn && (
                          <p className="text-xs text-primary">
                            ✓ Lista de CNJs detectada - será expandida
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {!showMapping && (
                <div className="space-y-4">
                  <Button onClick={() => handleContinue(detectedSheets)} className="w-full">
                    Continuar para Validação
                  </Button>
                  
                  <div className="text-center">
                    <Link 
                      to="/import/template"
                      className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar template
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Mapeamento */}
      <MappingDialog
        open={showMapping}
        sheets={detectedSheets}
        onComplete={handleMappingComplete}
        onCancel={() => setShowMapping(false)}
      />
    </>
  );
}