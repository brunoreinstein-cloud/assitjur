import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Upload, 
  CheckCircle2, 
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
import { UploadStep } from '@/features/importer/components/steps/UploadStep';
import { ValidationStep } from '@/features/importer/components/steps/ValidationStep';
import { PreviewStep } from '@/features/importer/components/steps/PreviewStep';
import { PublishStep } from '@/features/importer/components/steps/PublishStep';
import { ImportProgressMonitor } from '@/features/importer/components/ImportProgressMonitor';
import { useImportStore } from '@/features/importer/store/useImportStore';

const STEPS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'validation', label: 'Validação', icon: CheckCircle2 },
  { id: 'preview', label: 'Prévia', icon: Eye },
  { id: 'publish', label: 'Publicação', icon: CheckCircle },
] as const;

export function ImporterWizard() {
  const { 
    currentStep,
    setCurrentStep,
    session,
    file,
    validationResult,
    isProcessing,
    uploadProgress,
    resetWizard
  } = useImportStore();

  const getStepStatus = useCallback((stepId: string) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }, [currentStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return <UploadStep />;
      case 'validation':
        return session && file ? <ValidationStep /> : null;
      case 'preview':
        return session && validationResult ? <PreviewStep /> : null;
      case 'publish':
        return session && validationResult ? <PublishStep /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Importação de Dados</h1>
        <p className="text-muted-foreground">
          Pipeline completo de análise de testemunhas e processos com detecção de padrões
        </p>
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const isLast = index === STEPS.length - 1;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      status === 'completed' 
                        ? 'bg-success border-success text-success-foreground' 
                        : status === 'current'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <step.icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={`text-sm font-medium ${
                        status === 'current' ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-px mx-4 ${
                      status === 'completed' ? 'bg-success' : 'bg-border'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {renderStepContent()}
        </div>
        
        {/* Sidebar - Compliance & Info */}
        <div className="space-y-4">
          {/* Progress Monitor - Show during processing */}
          {isProcessing && currentStep === 'publish' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Progresso da Importação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImportProgressMonitor 
                  progress={uploadProgress} 
                  stage={uploadProgress < 30 ? 'importing' : uploadProgress < 80 ? 'creating-version' : 'publishing'}
                  stats={{
                    total: validationResult?.summary?.analyzed || 0,
                    processed: Math.floor((uploadProgress / 100) * (validationResult?.summary?.valid || 0)),
                    errors: validationResult?.summary?.errors || 0,
                    warnings: validationResult?.summary?.warnings || 0
                  }}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <HelpCircle className="h-4 w-4" />
                Compliance LGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-amber-700 dark:text-amber-300 space-y-2">
              <p>🔒 <strong>Dados mascarados:</strong> CPFs e informações sensíveis são automaticamente mascarados para proteção.</p>
              <p>⚠️ <strong>Validação obrigatória:</strong> Confirmação nos autos é obrigatória antes de decisões.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/template-base-exemplo.csv';
                  link.download = 'template-base-exemplo.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}