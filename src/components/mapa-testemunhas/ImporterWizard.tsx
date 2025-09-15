import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useImportStore } from '@/features/importer/store/useImportStore';
import { UploadStep } from '../importer/UploadStep';
import { ValidationStep } from '../importer/ValidationStep';  
import { ConfirmStep } from '../importer/ConfirmStep';
import { TrustNote } from '../importer/TrustNote';

export function ImporterWizard() {
  const { 
    currentStep,
    session,
    file,
    validationResult,
    versionNumber,
    createNewVersion,
    setCurrentStep,
    setSession,
    setFile,
    setValidationResult
  } = useImportStore();

  // Criar nova versão quando o wizard inicia
  useEffect(() => {
    createNewVersion().catch(() => {
      // Silently handle version creation errors
    });
  }, [createNewVersion]);

  const steps = [
    { id: 'upload', label: 'Upload & Detecção', icon: Circle },
    { id: 'validation', label: 'Validação & Correções', icon: Circle },
    { id: 'preview', label: 'Prévia & Revisão', icon: Circle },
    { id: 'publish', label: 'Confirmação & Publicação', icon: Circle },
  ] as const;

  const handleUploadComplete = (newSession: any, uploadedFile: File) => {
    setSession(newSession);
    setFile(uploadedFile);
    setCurrentStep('validation');
  };

  const handleValidationComplete = (result: any) => {
    setValidationResult(result);
    setCurrentStep('preview');
  };

  const handleConfirmComplete = () => {
    // Wizard completo - será redirecionado
  };

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      status === 'completed' 
                        ? 'bg-success border-success text-success-foreground' 
                        : status === 'current'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${
                        status === 'current' ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                        {step.id === 'upload' && versionNumber && (
                          <span className="ml-2 text-xs opacity-70">v{versionNumber}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isLast && (
                    <ArrowRight className="mx-4 h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="space-y-6">
        {currentStep === 'upload' && (
          <UploadStep onComplete={handleUploadComplete} />
        )}
        
        {currentStep === 'validation' && session && file && (
          <ValidationStep 
            session={session} 
            file={file}
            onComplete={handleValidationComplete}
          />
        )}
        
        {currentStep === 'preview' && session && validationResult && (
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Prévia dos Dados</h3>
            <p className="text-muted-foreground mb-4">
              {validationResult.summary.valid} registros válidos prontos para publicação
            </p>
            <Badge variant="secondary">v{versionNumber} (draft)</Badge>
          </div>
        )}
        
        {currentStep === 'publish' && session && validationResult && (
          <ConfirmStep 
            session={session}
            validationResult={validationResult}
            onComplete={handleConfirmComplete}
          />
        )}
      </div>

      {/* Trust Notice */}
      <TrustNote />
    </div>
  );
}