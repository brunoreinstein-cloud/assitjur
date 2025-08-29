import { Shield, CheckCircle, Lock, Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LGPDSealProps {
  variant?: 'compact' | 'full' | 'badge';
  showDetails?: boolean;
  className?: string;
}

export function LGPDSeal({ variant = 'compact', showDetails = false, className = '' }: LGPDSealProps) {
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={`bg-success/10 text-success border-success/20 ${className}`}>
              <Shield className="h-3 w-3 mr-1" />
              LGPD Ready
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Documento em conformidade com a LGPD</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg ${className}`}>
        <Shield className="h-4 w-4 text-success" />
        <span className="text-sm font-medium text-success">LGPD Compliant</span>
        <CheckCircle className="h-3 w-3 text-success" />
      </div>
    );
  }

  return (
    <div className={`border border-success/20 rounded-lg p-4 bg-success/5 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 bg-success/10 rounded-full">
          <Shield className="h-5 w-5 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-success">Documento LGPD-Ready</h3>
          <p className="text-xs text-muted-foreground">Conforme Lei 13.709/2018</p>
        </div>
        <CheckCircle className="h-5 w-5 text-success ml-auto" />
      </div>

      {showDetails && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Dados criptografados em trânsito e repouso</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>Informações sensíveis anonimizadas por padrão</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Base legal: Execução regular de direitos (Art. 7º, VI)</span>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-success/20">
        <p className="text-xs text-muted-foreground">
          <strong>Aviso:</strong> Este documento contém análise assistida por IA. 
          Validação jurídica humana é obrigatória antes do uso processual.
        </p>
      </div>
    </div>
  );
}

// Componente para footer de exports (PDF, CSV, etc.)
export function LGPDFooter({ className = '' }: { className?: string }) {
  return (
    <div className={`border-t border-border pt-4 mt-6 text-center ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-success" />
        <span className="text-sm font-medium text-success">AssistJur.IA - LGPD Compliant</span>
      </div>
      <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
        Documento produzido em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). 
        Dados pessoais tratados com base na execução regular de direitos em processo judicial. 
        Para exercer seus direitos como titular: portal.assistjur.ia/lgpd
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Gerado em {new Date().toLocaleString('pt-BR')} • Suporte: contato@assistjur.ia
      </p>
    </div>
  );
}