import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, RefreshCw, PartyPopper } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useImportStore } from '../../store/useImportStore';

export function PublishStep() {
  const { 
    session, 
    file, 
    validationResult, 
    resetWizard,
    isProcessing, 
    setIsProcessing, 
    uploadProgress, 
    setUploadProgress 
  } = useImportStore();
  
  const [isPublished, setIsPublished] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  const handlePublish = async () => {
    if (!file || !validationResult) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate publish progress for large files
      const progressInterval = setInterval(() => {
        setUploadProgress((prev: number) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 300);

      // Call the import function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'publish');
      formData.append('sessionData', JSON.stringify(session));

      const { data, error } = await supabase.functions.invoke('import-mapa-testemunhas', {
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      setPublishResult(data);
      setIsPublished(true);

      toast({
        title: "Importação concluída com sucesso!",
        description: `${data.summary?.valid_rows || validationResult.summary.valid} registros importados`,
      });

    } catch (error: any) {
      console.error('Publish error:', error);
      toast({
        title: "Erro na publicação",
        description: error.message || "Falha ao publicar dados",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    resetWizard();
    toast({
      title: "Nova importação iniciada",
      description: "Você pode fazer upload de um novo arquivo",
    });
  };

  if (!session || !file || !validationResult) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Dados da sessão não encontrados. Volte ao início do processo.
        </AlertDescription>
      </Alert>
    );
  }

  if (isPublished && publishResult) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-success">
            <PartyPopper className="h-6 w-6" />
            Importação Concluída!
          </CardTitle>
          <CardDescription>
            Os dados foram importados com sucesso na base de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-success bg-success/5">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              ✅ Importação realizada com sucesso! Os dados estão agora disponíveis para consulta.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="font-medium">Resumo da Importação:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Arquivo:</strong> {file.name}
              </div>
              <div>
                <strong>Tamanho:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <div>
                <strong>Registros importados:</strong>
                <span className="text-success font-semibold ml-1">
                  {publishResult.summary?.valid_rows || validationResult.summary.valid}
                </span>
              </div>
              <div>
                <strong>Taxa de sucesso:</strong>
                <span className="text-success ml-1">
                  {validationResult.summary.analyzed > 0 
                    ? `${Math.round((validationResult.summary.valid / validationResult.summary.analyzed) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>

            {publishResult.summary && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <div className="text-sm space-y-1">
                  <p><strong>Processos:</strong> {publishResult.summary.processos_count || 0}</p>
                  <p><strong>Testemunhas:</strong> {publishResult.summary.testemunhas_count || 0}</p>
                  <p><strong>Stubs criados:</strong> {publishResult.summary.stubs_created || 0}</p>
                  <p><strong>Flags detectadas:</strong> {publishResult.summary.flags_detected || 0}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleStartOver} className="flex-1">
              Nova Importação
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/base'}
              className="flex-1"
            >
              Ver Base de Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Publicar Nova Versão
        </CardTitle>
        <CardDescription>
          Confirme a publicação da nova versão da base de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {!isProcessing ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta ação irá importar os dados validados para a base ativa. 
                  Todas as consultas passarão a incluir os novos registros.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">Resumo da Importação:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Arquivo:</strong> {file.name}
                  </div>
                  <div>
                    <strong>Tamanho:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div>
                    <strong>Registros válidos:</strong>
                    <span className="text-success font-semibold ml-1">
                      {validationResult.summary.valid.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <strong>Problemas:</strong>
                    <span className="text-warning ml-1">
                      {validationResult.summary.errors + validationResult.summary.warnings}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({validationResult.summary.errors} erros, {validationResult.summary.warnings} avisos)
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Qualidade dos Dados:</span>
                    <span className="text-sm font-bold text-success">
                      {validationResult.summary.analyzed > 0
                        ? `${Math.round((validationResult.summary.valid / validationResult.summary.analyzed) * 100)}% aprovado`
                        : '0% aprovado'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handlePublish} 
                  disabled={validationResult.summary.errors > 0 || validationResult.summary.valid === 0}
                  className="bg-success hover:bg-success/90"
                >
                  Confirmar Publicação
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-medium">Publicando base de dados...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processando e importando todos os registros. Isso pode levar alguns minutos.
              </p>
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadProgress < 100 ? `Processando... ${Math.round(uploadProgress)}%` : 'Finalizando...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}