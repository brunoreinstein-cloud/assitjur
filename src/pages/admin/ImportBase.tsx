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
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setCurrentStep('validation');
          simulateValidation();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const simulateValidation = () => {
    setTimeout(() => {
      setValidationResults({
        status: 'success',
        totalRows: 15420,
        validRows: 15380,
        errors: 40,
        warnings: 125,
        issues: [
          { type: 'error', count: 25, description: 'CNJ malformado' },
          { type: 'error', count: 15, description: 'Data inválida' },
          { type: 'warning', count: 80, description: 'CPF não normalizado' },
          { type: 'warning', count: 45, description: 'Campos vazios opcionais' }
        ]
      });
      setCurrentStep('preview');
    }, 2000);
  };

  const handlePublish = () => {
    toast({
      title: "Base publicada com sucesso",
      description: "Versão v1.2.4 está agora ativa",
    });
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
            {isProcessing && (
              <div className="mt-3">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">
                  Enviando... {uploadProgress}%
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
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{validationResults.totalRows.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total de linhas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validationResults.validRows.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Linhas válidas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{validationResults.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{validationResults.warnings}</div>
                <div className="text-sm text-muted-foreground">Avisos</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Problemas Encontrados:</h4>
              {validationResults.issues.map((issue: any, index: number) => (
                <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{issue.count}</strong> registros: {issue.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Baixar Relatório
              </Button>
              <Button onClick={() => setCurrentStep('preview')}>
                Continuar para Prévia
              </Button>
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta ação irá substituir a base ativa atual. Todas as consultas passarão a usar a nova versão.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
              Cancelar
            </Button>
            <Button onClick={handlePublish}>
              Confirmar Publicação
            </Button>
          </div>
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
    </div>
  );
};

export default ImportBase;