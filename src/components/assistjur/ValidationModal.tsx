import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Download, Upload } from 'lucide-react';
import { ValidationReport, ValidationIssue } from '@/types/assistjur';
import { IssuesDataTable } from './IssuesDataTable';

interface ValidationModalProps {
  open: boolean;
  onClose: () => void;
  report: ValidationReport;
  uploadId: string;
  onPublish?: () => void;
  onDownloadReport?: () => void;
  onExportData?: () => void;
  isPublishing?: boolean;
}

export function ValidationModal({
  open,
  onClose,
  report,
  uploadId,
  onPublish,
  onDownloadReport,
  onExportData,
  isPublishing = false
}: ValidationModalProps) {
  
  const getSeverityIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-info" />;
    }
  };

  const getSeverityColor = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
    }
  };

  const canPublish = report.summary.error_count === 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Relatório de Validação - AssistJur.IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPIs Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total de Linhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {report.summary.total_rows.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Linhas Válidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {report.summary.valid_rows.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Erros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {report.summary.error_count}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.summary.success_rate}%
                </div>
                <Progress 
                  value={report.summary.success_rate} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Status Alert */}
          {report.summary.error_count > 0 ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Encontrados {report.summary.error_count} erros que impedem a publicação dos dados.
                Corrija os erros e faça um novo upload.
              </AlertDescription>
            </Alert>
          ) : report.summary.warning_count > 0 ? (
            <Alert variant="default" className="border-yellow-500">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Dados válidos com {report.summary.warning_count} avisos. 
                Revise os avisos antes de publicar.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Todos os dados foram validados com sucesso! Pronto para publicação.
              </AlertDescription>
            </Alert>
          )}

          {/* Issues Table - Use new DataTable component */}
          {report.issues.length > 0 && (
            <IssuesDataTable issues={report.issues} />
          )}

          {/* Samples Preview */}
          {(report.samples.processos.length > 0 || report.samples.testemunhas.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Amostra dos Dados Normalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.samples.processos.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Por Processo ({report.samples.processos.length} amostras)</h4>
                      <div className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <pre>{JSON.stringify(report.samples.processos.slice(0, 3), null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  {report.samples.testemunhas.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Por Testemunha ({report.samples.testemunhas.length} amostras)</h4>
                      <div className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <pre>{JSON.stringify(report.samples.testemunhas.slice(0, 3), null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* LGPD Compliance */}
          {report.compliance && (
            <Alert>
              <AlertDescription className="text-sm">
                {report.compliance.warning_message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-wrap gap-2">
            {onDownloadReport && (
              <Button variant="outline" onClick={onDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório
              </Button>
            )}
            
            {onExportData && (
              <Button variant="outline" onClick={onExportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>

          {canPublish && onPublish && (
            <Button 
              onClick={onPublish}
              disabled={isPublishing}
              className="ml-auto"
            >
              {isPublishing ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publicar Dados
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}