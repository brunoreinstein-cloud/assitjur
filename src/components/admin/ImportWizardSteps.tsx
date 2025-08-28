import React from 'react';
import { 
  Upload, 
  FileCheck, 
  Eye, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImportWizardStepsProps {
  currentStep: 'upload' | 'validation' | 'preview' | 'publish';
  validationResults?: any;
  isProcessing?: boolean;
}

const ImportWizardSteps: React.FC<ImportWizardStepsProps> = ({
  currentStep,
  validationResults,
  isProcessing
}) => {
  const steps = [
    {
      id: 'upload',
      title: 'Upload do Arquivo',
      icon: Upload,
      description: 'Selecione o arquivo CSV ou XLSX'
    },
    {
      id: 'validation',
      title: 'Validação',
      icon: FileCheck,
      description: 'Verificação da qualidade dos dados'
    },
    {
      id: 'preview',
      title: 'Prévia',
      icon: Eye,
      description: 'Visualização antes da publicação'
    },
    {
      id: 'publish',
      title: 'Publicação',
      icon: CheckCircle,
      description: 'Ativação da nova versão'
    }
  ];

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (isProcessing && stepId === currentStep) {
      return 'processing';
    }
    
    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      // Verifica se há bloqueadores na validação
      if (stepId === 'validation' && validationResults?.errors?.length > 0) {
        return 'error';
      }
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (step: any, status: string) => {
    const IconComponent = step.icon;
    
    if (status === 'processing') {
      return <Clock className="h-5 w-5 animate-pulse" />;
    } else if (status === 'completed') {
      return <CheckCircle className="h-5 w-5" />;
    } else if (status === 'error') {
      return <AlertCircle className="h-5 w-5" />;
    } else {
      return <IconComponent className="h-5 w-5" />;
    }
  };

  const getStepBadge = (stepId: string, status: string) => {
    if (stepId === 'validation' && validationResults) {
      if (validationResults.errors?.length > 0) {
        return <Badge variant="destructive" className="ml-2 text-xs">{validationResults.errors.length} erros</Badge>;
      } else if (validationResults.validRows > 0) {
        return <Badge variant="secondary" className="ml-2 text-xs">{validationResults.validRows} válidos</Badge>;
      }
    }
    return null;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isActive = status === 'current' || status === 'processing';
          const isCompleted = status === 'completed';
          const hasError = status === 'error';
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 
                  ${isCompleted ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-300' : ''}
                  ${isActive && !hasError ? 'bg-primary/10 border-primary text-primary' : ''}
                  ${hasError ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-950 dark:border-red-400 dark:text-red-300' : ''}
                  ${status === 'pending' ? 'bg-muted border-muted-foreground/25 text-muted-foreground' : ''}
                  transition-all duration-200
                `}>
                  {getStepIcon(step, status)}
                </div>
                <div className="mt-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-foreground' : 
                      isCompleted ? 'text-green-700 dark:text-green-300' : 
                      hasError ? 'text-red-700 dark:text-red-300' :
                      'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {getStepBadge(step.id, status)}
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-4 
                  ${index < steps.findIndex(s => s.id === currentStep) ? 'bg-green-500' : 'bg-muted-foreground/25'}
                  transition-colors duration-200
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImportWizardSteps;