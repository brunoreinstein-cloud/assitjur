import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Upload, 
  FileCheck, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Download,
  RefreshCw,
  FileX,
  Zap,
  Info,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import ErrorReportGenerator from '@/components/admin/ErrorReportGenerator';
import ImportWizardSteps from '@/components/admin/ImportWizardSteps';

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
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Arquivo
            </div>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Precisa de ajuda?
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute z-10 mt-2 p-4 bg-background border rounded-lg shadow-lg max-w-md right-0">
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Template disponível!</strong> Use nosso arquivo de exemplo para upload.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/template-base-exemplo.csv';
                      link.download = 'template-base-exemplo.csv';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Template
                  </Button>
                  
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p><strong>Formatos:</strong> CSV, XLS, XLSX</p>
                    <p><strong>Tamanho máximo:</strong> 10MB</p>
                    <p><strong>Campos obrigatórios:</strong> CNJ, Reclamante, Réu</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type || 'Arquivo'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setUploadedFile(null);
                  setValidationResults(null);
                  setCurrentStep('upload');
                }}
              >
                <FileX className="h-4 w-4" />
              </Button>
            </div>
            
            {uploadedFile.size > 10 * 1024 * 1024 && (
              <Alert className="mt-2" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Arquivo muito grande!</strong> Tamanho máximo: 10MB. 
                  Considere dividir em arquivos menores.
                </AlertDescription>
              </Alert>
            )}
            
            {isProcessing && (
              <div className="mt-3">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Zap className="h-3 w-3 animate-pulse" />
                  {uploadProgress < 95 ? `Enviando arquivo... ${Math.round(uploadProgress)}%` : 'Processando e validando dados...'}
                </p>
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
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
            {/* Métricas de validação melhoradas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{validationResults.totalRows?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas analisadas</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validationResults.validRows?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas válidas</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {validationResults.totalRows > 0 ? `${Math.round((validationResults.validRows / validationResults.totalRows) * 100)}%` : '0%'}
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{validationResults.errors?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
                {validationResults.errors?.length > 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">Impedem publicação</div>
                )}
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{validationResults.warnings?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Avisos</div>
                {validationResults.warnings?.length > 0 && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Permitido publicar</div>
                )}
              </div>
            </div>

            {/* Alerta para problemas críticos */}
            {validationResults.errors?.length === 0 && validationResults.validRows > 0 && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ✅ Arquivo pronto para publicação! {validationResults.validRows} registros serão importados.
                </AlertDescription>
              </Alert>
            )}

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
                  disabled={validationResults.validRows === 0 || (validationResults.errors?.length || 0) > 0}
                  className={validationResults.errors?.length > 0 ? 'opacity-50' : ''}
                >
                  {validationResults.errors?.length > 0 ? 'Corrigir Erros Primeiro' : 'Continuar para Prévia'}
                </Button>
              </div>
            </div>

            {/* Link para template se houver erros */}
            {validationResults.errors?.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Dica:</strong> Use nosso template para evitar erros de formato.{' '}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/template-base-exemplo.csv';
                      link.download = 'template-base-exemplo.csv';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    Baixar aqui
                  </Button>
                </AlertDescription>
              </Alert>
            )}
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
          {/* Preview baseado nos dados reais */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{validationResults?.validRows?.toLocaleString() || '0'}</div>
              <div className="text-sm text-muted-foreground">Registros válidos</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {validationResults?.validRows ? Math.round((validationResults.validRows / validationResults.totalRows) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de sucesso</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {validationResults ? (validationResults.errors?.length || 0) + (validationResults.warnings?.length || 0) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Problemas detectados</div>
            </div>
          </div>

          {/* Sumário de importação */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Eye className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Prévia da Importação:</strong> {validationResults?.validRows || 0} registros serão processados e inseridos na base de dados.
              Os dados passarão por validação final e normalização antes da inserção.
            </AlertDescription>
          </Alert>

          {/* Sample data table - exemplo fictício por enquanto */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">CNJ</th>
                  <th className="p-3 text-left">Reclamante</th>
                  <th className="p-3 text-left">Réu</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 font-mono text-sm">****-**.2024.*.**.**</td>
                    <td className="p-3">Nome do Reclamante {i + 1}</td>
                    <td className="p-3">Nome da Empresa Ré</td>
                    <td className="p-3">
                      <Badge variant="secondary">Pronto para importar</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('validation')}>
              Voltar para Validação
            </Button>
            <Button 
              onClick={() => setCurrentStep('publish')}
              className="bg-green-600 hover:bg-green-700"
              disabled={(validationResults?.errors?.length || 0) > 0}
            >
              Publicar Nova Versão
            </Button>
          </div>
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
                    <strong>Linhas válidas:</strong> 
                    <span className="text-green-600 font-semibold ml-1">
                      {validationResults?.validRows?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div>
                    <strong>Problemas:</strong> 
                    <span className="text-orange-600 ml-1">
                      {(validationResults?.errors?.length || 0) + (validationResults?.warnings?.length || 0)} 
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({validationResults?.errors?.length || 0} erros, {validationResults?.warnings?.length || 0} avisos)
                    </span>
                  </div>
                </div>
                
                {/* Indicador de qualidade */}
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Qualidade dos Dados:</span>
                    <span className="text-sm font-bold text-green-600">
                      {validationResults?.totalRows > 0 
                        ? `${Math.round((validationResults.validRows / validationResults.totalRows) * 100)}% aprovado` 
                        : '0% aprovado'
                      }
                    </span>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Importar Base de Dados</h1>
        <p className="text-muted-foreground">
          Faça upload e publique uma nova versão da base de dados
        </p>
      </div>

      <ImportWizardSteps currentStep={currentStep} />

      <div className="w-full">
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'validation' && renderValidationStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'publish' && renderPublishStep()}
      </div>
    </div>
  );
};

export default ImportBase;