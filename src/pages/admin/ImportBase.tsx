import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileCheck, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Download,
  RefreshCw
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TemplateDownload from '@/components/TemplateDownload';
import ErrorReportGenerator from '@/components/admin/ErrorReportGenerator';

const ImportBase = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'validation' | 'preview' | 'publish'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      simulateUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const simulateUpload = (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95; // Stop at 95% until server responds
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    // Call the actual Supabase function
    processFileUpload(file, 'validate');
  };

  const processFileUpload = async (file: File, action: 'validate' | 'publish') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', action);

    try {
      const { data, error } = await supabase.functions.invoke('process-base-upload', {
        body: formData,
      });

      if (error) throw error;

      if (action === 'validate') {
        setValidationResults(data.validation);
        setCurrentStep('validation');
      } else if (action === 'publish') {
        toast({
          title: "Base publicada com sucesso",
          description: `Versão v${data.version.hash} está agora ativa com ${data.version.rowsImported} registros`,
        });
        setCurrentStep('upload');
        setUploadedFile(null);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no processamento",
        description: error.message || "Falha ao processar arquivo",
        variant: "destructive"
      });
      setCurrentStep('upload');
      setValidationResults(null);
    } finally {
      setIsProcessing(false);
      setUploadProgress(100);
    }
  };

  const handlePublish = () => {
    if (uploadedFile) {
      setIsProcessing(true);
      setUploadProgress(0);
      
      // Simulate publish progress for large files
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Stop at 90% until server responds
          }
          return prev + Math.random() * 10;
        });
      }, 300);
      
      processFileUpload(uploadedFile, 'publish');
    }
  };

  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Arquivo
        </CardTitle>
        <CardDescription>
          Faça upload do arquivo CSV ou XLSX com os dados da base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg">Solte o arquivo aqui...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">Arraste e solte o arquivo aqui</p>
              <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
              <Button variant="outline">Selecionar Arquivo</Button>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">{uploadedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {uploadedFile.size > 10 * 1024 * 1024 && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Arquivo muito grande. Tamanho máximo: 10MB
                </AlertDescription>
              </Alert>
            )}
            {isProcessing && (
              <div className="mt-3">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadProgress < 95 ? `Enviando... ${Math.round(uploadProgress)}%` : 'Validando dados...'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderValidationStep = () => (
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
        {!validationResults ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Validando arquivo...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processando amostra dos dados para validação
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{validationResults.totalRows?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas analisadas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validationResults.validRows?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas válidas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{validationResults.errors?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{validationResults.warnings?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Avisos</div>
              </div>
            </div>

            {validationResults.errors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Erros Encontrados:</h4>
                {validationResults.errors.slice(0, 5).map((error: any, index: number) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Linha {error.row}:</strong> {error.message} ({error.column})
                    </AlertDescription>
                  </Alert>
                ))}
                {validationResults.errors.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    ... e mais {validationResults.errors.length - 5} erros
                  </p>
                )}
              </div>
            )}

            {validationResults.warnings?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Avisos:</h4>
                {validationResults.warnings.slice(0, 3).map((warning: any, index: number) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Linha {warning.row}:</strong> {warning.message} ({warning.column})
                    </AlertDescription>
                  </Alert>
                ))}
                {validationResults.warnings.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    ... e mais {validationResults.warnings.length - 3} avisos
                  </p>
                )}
              </div>
            )}

            {/* Error Report Generator */}
            {(validationResults.errors?.length > 0 || validationResults.warnings?.length > 0) && (
              <ErrorReportGenerator 
                validationResults={validationResults}
                fileName={uploadedFile?.name || 'arquivo'}
              />
            )}

            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => {
                setCurrentStep('upload');
                setUploadedFile(null);
                setValidationResults(null);
              }}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setCurrentStep('preview')}
                  disabled={validationResults.validRows === 0}
                >
                  Continuar para Prévia
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPreviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Prévia dos Dados
        </CardTitle>
        <CardDescription>
          Amostra dos dados processados e normalizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">15,420</div>
              <div className="text-sm text-muted-foreground">Processos</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">8,542</div>
              <div className="text-sm text-muted-foreground">Pessoas distintas</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">85%</div>
              <div className="text-sm text-muted-foreground">Com indicadores</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">CNJ</th>
                  <th className="p-3 text-left">Comarca</th>
                  <th className="p-3 text-left">Reclamante</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 font-mono text-sm">5001234-12.2024.5.01.{String(i).padStart(4, '0')}</td>
                    <td className="p-3">São Paulo</td>
                    <td className="p-3">João Silva</td>
                    <td className="p-3">
                      <Badge variant="secondary">Em andamento</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={() => setCurrentStep('publish')} className="w-full">
            Publicar Versão
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPublishStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Publicar Nova Versão
        </CardTitle>
        <CardDescription>
          Confirme a publicação da nova versão da base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isProcessing ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta ação irá substituir a base ativa atual. Todas as consultas passarão a usar a nova versão.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resumo da Importação:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Arquivo:</strong> {uploadedFile?.name}
                  </div>
                  <div>
                    <strong>Tamanho:</strong> {uploadedFile ? (uploadedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                  </div>
                  <div>
                    <strong>Linhas válidas:</strong> {validationResults?.validRows?.toLocaleString() || 0}
                  </div>
                  <div>
                    <strong>Erros:</strong> {validationResults?.errors?.length || 0}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                  Cancelar
                </Button>
                <Button onClick={handlePublish} disabled={!uploadedFile}>
                  Confirmar Publicação
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="font-medium">Publicando base de dados...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processando e importando todos os registros. Isso pode levar alguns minutos.
              </p>
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadProgress < 100 ? 'Processando...' : 'Finalizando...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar & Publicar Base</h1>
        <p className="text-muted-foreground">
          Gerencie o upload, validação e publicação de novas versões da base de dados
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Importar Dados</TabsTrigger>
          <TabsTrigger value="template">Template de Exemplo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="template" className="mt-6">
          <div className="flex justify-center">
            <TemplateDownload />
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="mt-6">
          <div className="flex items-center gap-4 mb-6">
            {(['upload', 'validation', 'preview', 'publish'] as const).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step ? 'bg-primary text-primary-foreground' :
                  index < (['upload', 'validation', 'preview', 'publish'] as const).indexOf(currentStep) ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <div className="w-8 h-0.5 bg-muted mx-2" />}
              </div>
            ))}
          </div>

          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'validation' && renderValidationStep()}
          {currentStep === 'preview' && renderPreviewStep()}
          {currentStep === 'publish' && renderPublishStep()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportBase;