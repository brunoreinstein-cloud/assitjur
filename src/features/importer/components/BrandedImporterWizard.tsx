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
import { UploadStep } from './steps/UploadStep';
import { ValidationStep } from './steps/ValidationStep';
import { PreviewStep } from './steps/PreviewStep';
import { PublishStep } from './steps/PublishStep';
import { useImportStore } from '../store/useImportStore';
import { BrandHeader } from '@/components/brand/BrandHeader';
import { LGPDFooter } from '@/components/brand/LGPDFooter';
import { strings, getString } from '@/i18n/pt-BR';

const STEPS = [
  { id: 'upload', label: getString('import.steps.upload'), icon: Upload },
  { id: 'validation', label: getString('import.steps.validation'), icon: FileCheck },
  { id: 'preview', label: getString('import.steps.preview'), icon: Eye },
  { id: 'publish', label: getString('import.steps.publish'), icon: CheckCircle },
] as const;

export function BrandedImporterWizard() {
  const { 
    currentStep,
    setCurrentStep,
    session,
    file,
    validationResult,
    isProcessing,
    resetWizard,
    versionNumber
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
      {/* Branded Header */}
      <div className="text-center space-y-4">
        <BrandHeader 
          size="lg" 
          showVersion={true} 
          version={versionNumber?.toString()}
          className="justify-center"
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-ink">
            {getString('common.systemName')} - Importação de Dados
          </h1>
          <p className="text-muted-foreground mt-2">
            Pipeline completo de análise de testemunhas e processos com detecção de padrões
          </p>
        </div>
      </div>

      {/* Progress Stepper */}
      <Card className="border-brand-primary/20 bg-brand-bg">
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
                        ? 'bg-status-success border-status-success text-white' 
                        : status === 'current'
                        ? 'bg-brand-primary border-brand-primary text-white'
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
                        status === 'current' ? 'text-brand-primary' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-px mx-4 ${
                      status === 'completed' ? 'bg-status-success' : 'bg-border'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {renderStepContent()}
        </div>
        
        {/* Branded Sidebar - Compliance & Info */}
        <div className="space-y-4">
          <Card className="border-status-warning/30 bg-status-warning/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-status-warning">
                <HelpCircle className="h-4 w-4" />
                {getString('import.compliance.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-status-warning space-y-2">
              <p>🔒 <strong>{getString('import.compliance.maskedData').split(':')[0]}:</strong> {getString('import.compliance.maskedData').split(':')[1]}</p>
              <p>⚠️ <strong>{getString('import.compliance.mandatoryValidation').split(':')[0]}:</strong> {getString('import.compliance.mandatoryValidation').split(':')[1]}</p>
            </CardContent>
          </Card>

          <Card className="border-brand-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-brand-primary">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-brand-primary/30 text-brand-primary hover:bg-brand-primary hover:text-white"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/template-base-exemplo.csv';
                  link.download = 'template-assistjur-exemplo.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {getString('actions.download')} Template
              </Button>
            </CardContent>
          </Card>

          {/* Version Badge */}
          {versionNumber && (
            <Card>
              <CardContent className="p-4 text-center">
                <Badge 
                  variant="secondary" 
                  className="bg-brand-primary/10 text-brand-primary border-brand-primary/30"
                >
                  {getString('common.version')} {versionNumber}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* LGPD Footer */}
      <LGPDFooter showVersion={true} />
    </div>
  );
}