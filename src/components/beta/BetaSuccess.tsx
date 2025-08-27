import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Linkedin, Download, RotateCcw } from 'lucide-react';

interface BetaSuccessProps {
  onReset: () => void;
  className?: string;
}

export function BetaSuccess({ onReset, className = '' }: BetaSuccessProps) {
  return (
    <div className={`text-center space-y-6 py-8 ${className}`} aria-live="polite">
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
          Parabéns! Você agora tem acesso prioritário ao HubJUR.IA. Em breve entraremos em contato com detalhes exclusivos sobre a plataforma.
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
          variant="outline"
          onClick={() => window.open('https://linkedin.com/company/hubjuria', '_blank')}
          className="gap-2 border-primary/30 hover:bg-primary/5"
        >
          <Linkedin className="h-4 w-4" />
          Seguir no LinkedIn
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.open('/whitepaper-hubjuria.pdf', '_blank')}
          className="gap-2 border-primary/30 hover:bg-primary/5"
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