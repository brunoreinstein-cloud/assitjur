import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { EdgeFunctionTester } from '@/components/admin/EdgeFunctionTester';
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

  const handlePublish = async (retryCount = 0) => {
    if (!file || !validationResult || !session) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      console.log('🔍 Testing Edge Function connectivity...');
      
      // Test direct connectivity to create-version
      try {
        const testResponse = await fetch(`https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/create-version`, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization, content-type, apikey, x-retry-count'
          }
        });
        console.log('✅ Direct CORS preflight test:', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          origin: testResponse.headers.get('access-control-allow-origin'),
          methods: testResponse.headers.get('access-control-allow-methods'),
          headers: testResponse.headers.get('access-control-allow-headers')
        });
      } catch (testError) {
        console.error('❌ Direct CORS preflight failed:', testError);
      }

      // Step 1: Create new version with improved error handling
      setUploadProgress(10);
      console.log('📞 Calling create-version Edge Function...');
      
      const { data: versionData, error: versionError } = await supabase.functions.invoke('create-version', {
        headers: { 'x-retry-count': retryCount.toString() }
      });
      
      console.log('🔍 create-version response:', { versionData, versionError });
      
      if (versionError) {
        console.error('❌ Version creation failed:', {
          message: versionError.message,
          status: versionError.status,
          details: versionError.details || 'No additional details'
        });
        throw new Error('Falha ao criar nova versão: ' + versionError.message);
      }

      if (!versionData || !versionData.versionId) {
        throw new Error('Resposta inválida da criação de versão: ' + JSON.stringify(versionData));
      }

      // Step 2: Extract and validate data from validation result
      console.log('🔍 Debug - Full validationResult:', {
        hasNormalizedData: !!validationResult.normalizedData,
        normalizedDataKeys: validationResult.normalizedData ? Object.keys(validationResult.normalizedData) : [],
        processosLength: validationResult.normalizedData?.processos?.length || 0,
        testemunhasLength: validationResult.normalizedData?.testemunhas?.length || 0,
        summaryValid: validationResult.summary?.valid || 0,
        summaryAnalyzed: validationResult.summary?.analyzed || 0
      });

      const processos = validationResult.normalizedData?.processos || [];
      const testemunhas = validationResult.normalizedData?.testemunhas || [];
      
      // Validate data before sending
      if (processos.length === 0 && testemunhas.length === 0) {
        throw new Error(`Nenhum dado válido encontrado para importação. Verifique se o arquivo contém dados no formato correto.`);
      }
      
      // Log sample data for debugging
      if (processos.length > 0) {
        console.log('📋 Sample processo data:', {
          firstProcesso: processos[0],
          hasRequiredFields: {
            cnj_digits: !!processos[0]?.cnj_digits,
            cnj: !!processos[0]?.cnj,
            reclamante_nome: !!processos[0]?.reclamante_nome
          }
        });
      }
      
      // Step 3: Import data with enhanced diagnostics and retry logic
      console.log('📤 Enviando dados para importação:', { 
        processosCount: processos.length, 
        testemunhasCount: testemunhas.length,
        versionId: versionData.versionId,
        totalValidRecords: validationResult.summary?.valid || 0
      });

      // Diagnostic: Test function availability first
      console.log('🔍 Testing Edge Function connectivity...');
      try {
        const testResponse = await fetch(`https://fgjypmlszuzkgvhuszxn.supabase.co/functions/v1/import-into-version`, {
          method: 'OPTIONS',
          headers: {
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization, content-type, apikey'
          }
        });
        console.log('✅ CORS preflight test:', testResponse.status, testResponse.headers.get('access-control-allow-origin'));
      } catch (testError) {
        console.error('❌ CORS preflight failed:', testError);
      }

      // Step 3: Import data with timeout handling
      setUploadProgress(30);
      
      const importPromise = supabase.functions.invoke('import-into-version', {
        body: {
          versionId: versionData.versionId,
          processos,
          testemunhas,
          fileChecksum: session.sessionId,
          filename: file.name
        }
      });

      // Timeout handling (8 minutos para grandes arquivos)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout na importação - arquivo muito grande ou conexão lenta')), 480000)
      );

      const { data: importData, error: importError } = await Promise.race([
        importPromise,
        timeoutPromise
      ]) as any;

      if (importError) {
        // Check if it's a timeout or network error that might benefit from retry
        if ((importError.message?.includes('timeout') || 
             importError.message?.includes('network') || 
             importError.message?.includes('504') ||
             importError.message?.includes('502')) && retryCount < 2) {
          
          console.log(`🔄 Retrying import (attempt ${retryCount + 1}/3)...`);
          toast({
            title: "Conectividade instável",
            description: `Tentativa ${retryCount + 1}/3 - Tentando novamente...`,
          });
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          return handlePublish(retryCount + 1);
        }
        
        throw new Error('Falha na importação: ' + importError.message);
      }

      if (!importData || !importData.summary) {
        throw new Error('Resposta inválida da importação');
      }

      // Step 4: Publish the version
      setUploadProgress(80);
      const { data: publishData, error: publishError } = await supabase.functions.invoke('publish-version', {
        body: { versionId: versionData.versionId }
      });

      if (publishError) {
        throw new Error('Falha ao publicar versão: ' + publishError.message);
      }

      setUploadProgress(100);

      // Set results with version info
      setPublishResult({
        ...importData,
        version: {
          id: versionData.versionId,
          number: versionData.number,
          publishedAt: publishData.publishedAt
        }
      });
      setIsPublished(true);

      toast({
        title: "Versão publicada com sucesso!",
        description: `Versão v${versionData.number} com ${importData.summary?.imported || 0} registros`,
      });

      // Signal that import is complete to refresh other views
      localStorage.setItem('import_completed', Date.now().toString());
      window.dispatchEvent(new Event('storage'));

    } catch (error: any) {
      console.error('Publish error:', error);
      
      // More specific error messages
      let errorMessage = error.message || "Falha ao publicar dados";
      let errorTitle = "Erro na publicação";
      
      if (error.message?.includes('timeout')) {
        errorTitle = "Timeout na operação";
        errorMessage = "A operação demorou muito para completar. Tente novamente com um arquivo menor ou verifique sua conexão.";
      } else if (error.message?.includes('504')) {
        errorTitle = "Servidor sobrecarregado";
        errorMessage = "O servidor está processando muitos dados. Aguarde um momento e tente novamente.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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

            {publishResult.version && (
              <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="text-sm space-y-1">
                  <p><strong>Versão:</strong> v{publishResult.version.number}</p>
                  <p><strong>ID da versão:</strong> {publishResult.version.id}</p>
                  <p><strong>Publicada em:</strong> {new Date(publishResult.version.publishedAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}

            {publishResult.summary && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <div className="text-sm space-y-1">
                  <p><strong>Processos:</strong> {publishResult.summary.processos_count || publishResult.imported || 0}</p>
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
                onClick={() => window.location.href = '/admin/versoes'}
                className="flex-1"
              >
                Ver Versões
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
                  onClick={() => handlePublish()} 
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