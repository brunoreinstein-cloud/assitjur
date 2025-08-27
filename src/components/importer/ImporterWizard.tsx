import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { UploadStep } from './UploadStep';
import { ValidationStep } from './ValidationStep';
import { ConfirmStep } from './ConfirmStep';
import { TrustNote } from './TrustNote';
import type { ImportSession, ValidationResult } from '@/lib/importer/types';

type WizardStep = 'upload' | 'validation' | 'confirm';

export function ImporterWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [session, setSession] = useState<ImportSession | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const steps = [
    { id: 'upload', label: 'Upload & Detecção', icon: Circle },
    { id: 'validation', label: 'Validação & Correções', icon: Circle },
    { id: 'confirm', label: 'Confirmação & Importação', icon: Circle },
  ] as const;

  const handleUploadComplete = (newSession: ImportSession) => {
    setSession(newSession);
    setCurrentStep('validation');
  };

  const handleValidationComplete = (result: ValidationResult) => {
    setValidationResult(result);
    setCurrentStep('confirm');
  };

  const handleConfirmComplete = () => {
    // Reset wizard
    setSession(null);
    setValidationResult(null);
    setCurrentStep('upload');
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
        
        {currentStep === 'validation' && session && (
          <ValidationStep 
            session={session} 
            onComplete={handleValidationComplete}
          />
        )}
        
        {currentStep === 'confirm' && session && validationResult && (
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