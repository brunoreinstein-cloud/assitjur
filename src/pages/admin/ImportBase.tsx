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
import { ImporterWizard } from '@/features/importer/components/ImporterWizard';

const ImportBase = () => {

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

  return <ImporterWizard />;
};

export default ImportBase;