import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CNJCitationProps {
  cnj: string;
  variant?: 'default' | 'outline' | 'secondary';
  showCopyButton?: boolean;
  showExternalLink?: boolean;
  onClick?: (cnj: string) => void;
  className?: string;
}

export function CNJCitation({ 
  cnj, 
  variant = 'outline',
  showCopyButton = true,
  showExternalLink = false,
  onClick,
  className 
}: CNJCitationProps) {
  const { toast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cnj);
    toast({
      title: "CNJ copiado",
      description: `${cnj} foi copiado para a área de transferência`,
    });
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Em um cenário real, abriria o processo no sistema do tribunal
    toast({
      title: "Processo",
      description: `Abrindo processo ${cnj} no sistema externo...`,
    });
  };

  const handleClick = () => {
    if (onClick) {
      onClick(cnj);
    }
  };

  return (
    <div className={cn("flex items-center gap-1 print:gap-0", className)}>
      <Badge 
        variant={variant}
        className={cn(
          "font-mono cursor-pointer hover:bg-accent print:border-0 print:bg-transparent print:p-0",
          onClick && "hover:bg-primary/10"
        )}
        onClick={handleClick}
      >
        {cnj}
      </Badge>
      
      <div className="flex items-center print:hidden">
        {showCopyButton && (
          <Button
            variant="ghost"
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={handleCopy}
            title="Copiar CNJ"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        
        {showExternalLink && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleExternalLink}
            title="Abrir no sistema externo"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}