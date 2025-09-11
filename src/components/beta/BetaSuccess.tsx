import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Linkedin, Download, RotateCcw } from 'lucide-react';

interface BetaSuccessProps {
  onReset: () => void;
  className?: string;
}

export function BetaSuccess({ onReset, className = '' }: BetaSuccessProps) {
  return (
    <div className={`text-center space-y-6 py-8 ${className}`} role="alert" aria-live="polite">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-foreground">
          Você está na lista!
        </h3>
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          Parabéns! Você agora tem acesso prioritário ao AssistJur.IA. Em breve entraremos em contato com detalhes exclusivos sobre a plataforma.
        </p>
      </div>

      {/* Benefit Highlights */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
        <h4 className="font-semibold text-foreground mb-2">O que vem por aí:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
          <li>• Demonstração personalizada</li>
          <li>• Acesso antecipado à plataforma</li>
          <li>• Consultoria de implementação</li>
          <li>• Material exclusivo sobre IA no Direito</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          className="flex items-center space-x-2 text-white hover:text-primary bg-primary hover:bg-white transition-colors"
          onClick={() => {
            try {
              window.open('https://www.linkedin.com/company/assistjuria', '_blank', 'noopener,noreferrer');
            } catch (error) {
              console.error('Erro ao abrir LinkedIn:', error);
            }
          }}
        >
          <Linkedin className="w-4 h-4" />
          <span>Seguir no LinkedIn</span>
        </Button>
        
        <Button
          variant="outline" 
          className="gap-2 border-primary/30 hover:bg-primary/5"
          onClick={() => {
            try {
              const link = document.createElement('a');
              link.href = '/whitepaper-assistjur.pdf';
              link.download = 'assistjur-whitepaper.pdf';
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (error) {
              console.error('Erro ao baixar whitepaper:', error);
              // Fallback para abrir em nova aba
              window.open('/whitepaper-assistjur.pdf', '_blank', 'noopener,noreferrer');
            }
          }}
        >
          <Download className="h-4 w-4" />
          Baixar material
        </Button>
      </div>

      {/* Reset Option */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={onReset}
          className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 flex items-center gap-1 mx-auto"
        >
          <RotateCcw className="h-3 w-3" />
          Preencher para outra pessoa
        </button>
      </div>
    </div>
  );
}