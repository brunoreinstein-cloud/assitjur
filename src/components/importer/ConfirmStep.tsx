import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Database, 
  Upload, 
  AlertCircle,
  RefreshCw,
  Eye,
  Users,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ImportSession, ValidationResult } from '@/lib/importer/types';

interface ConfirmStepProps {
  session: ImportSession;
  validationResult: ValidationResult;
  onComplete: () => void;
}

export function ConfirmStep({ session, validationResult, onComplete }: ConfirmStepProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simula progresso de importação
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      // Simula chamada para API de importação
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setImportProgress(100);

      toast({
        title: "Importação Concluída",
        description: `${validationResult.summary.valid} registros importados com sucesso.`,
      });

      // Pequeno delay para mostrar o sucesso
      setTimeout(() => {
        onComplete();
      }, 1000);

    } catch (error) {
      toast({
        title: "Erro na Importação",
        description: "Falha ao importar dados. Tente novamente.",
        variant: "destructive"
      });
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const { testemunhas = [], processos = [] } = validationResult.normalizedData;
  const totalRecords = testemunhas.length + processos.length;

  return (
    <div className="space-y-6">
      {/* Resumo da Importação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview dos Dados Normalizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">{testemunhas.length.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Testemunhas</div>
            </div>
            
            <div className="text-center p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold text-accent">{processos.length.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Processos</div>
            </div>
            
            <div className="text-center p-4 bg-success-light border border-success/20 rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold text-success">{totalRecords.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total de Registros</div>
            </div>
          </div>

          {/* Preview das Tabelas */}
          {testemunhas.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Preview - Dados de Testemunhas (primeiras 5 linhas)
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">CNJ</th>
                      <th className="p-2 text-left">Nome Testemunha</th>
                      <th className="p-2 text-left">Reclamante</th>
                      <th className="p-2 text-left">Réu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testemunhas.slice(0, 5).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-mono text-xs">{item.cnj_digits}</td>
                        <td className="p-2">{item.nome_testemunha}</td>
                        <td className="p-2">{item.reclamante_nome || '—'}</td>
                        <td className="p-2">{item.reu_nome || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {processos.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Preview - Dados de Processos (primeiras 5 linhas)
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">CNJ</th>
                      <th className="p-2 text-left">Reclamante</th>
                      <th className="p-2 text-left">Réu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processos.slice(0, 5).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-mono text-xs">{item.cnj_digits}</td>
                        <td className="p-2">{item.reclamante_nome}</td>
                        <td className="p-2">{item.reu_nome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status da Importação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Importação para Base de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isImporting ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta ação irá persistir os dados normalizados na base do HubJUR.IA. 
                  Os dados passarão por validação adicional no servidor.
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Resumo da Operação:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Arquivo:</strong> {session.fileName}</div>
                  <div><strong>Tamanho:</strong> {(session.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                  <div><strong>Registros válidos:</strong> {validationResult.summary.valid.toLocaleString()}</div>
                  <div><strong>Problemas:</strong> {validationResult.summary.warnings + validationResult.summary.errors} </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1">
                  Voltar à Validação
                </Button>
                <Button 
                  onClick={handleImport} 
                  className="flex-1"
                  disabled={totalRecords === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar Importação
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-medium">Importando Dados...</h3>
                <p className="text-muted-foreground">
                  Persistindo {totalRecords.toLocaleString()} registros na base de dados
                </p>
              </div>

              <Progress value={importProgress} className="w-full" />
              
              <p className="text-sm text-muted-foreground text-center">
                {importProgress < 30 ? 'Validando dados...' :
                 importProgress < 60 ? 'Persistindo testemunhas...' :
                 importProgress < 90 ? 'Persistindo processos...' :
                 'Finalizando importação...'}
              </p>

              {importProgress === 100 && (
                <Alert className="border-success/20 bg-success-light">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success-foreground">
                    Importação concluída com sucesso! Redirecionando...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}