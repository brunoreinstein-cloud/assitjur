import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, EyeOff, Shield, ChevronDown } from "lucide-react";
import { applyPIIMask } from "@/utils/pii-mask";

interface AnonymizeButtonProps {
  onToggle: (isAnonymized: boolean) => void;
  isAnonymized: boolean;
  variant?: "default" | "minimal";
  className?: string;
}

export function AnonymizeButton({
  onToggle,
  isAnonymized,
  variant = "default",
  className = "",
}: AnonymizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simular processamento
      onToggle(!isAnonymized);
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "minimal") {
    return (
      <Button
        variant={isAnonymized ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={className}
      >
        {isAnonymized ? (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Dados Anonimizados
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Dados Completos
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Shield className="h-4 w-4 mr-2" />
          Privacidade
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleToggle} disabled={isLoading}>
          {isAnonymized ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">Mostrar Dados Completos</div>
                <div className="text-xs text-muted-foreground">
                  Revelar CPFs e nomes reais
                </div>
              </div>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">Anonimizar Dados</div>
                <div className="text-xs text-muted-foreground">
                  Mascarar informações sensíveis
                </div>
              </div>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="border-t mt-1 pt-2">
          <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            Conforme Art. 6º, VII da LGPD
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook para facilitar o uso do AnonymizeButton
export function useAnonymization(initialState = false) {
  const [isAnonymized, setIsAnonymized] = useState(initialState);

  const anonymizeText = (text: string) => {
    return isAnonymized ? applyPIIMask(text, isAnonymized) : text;
  };

  const anonymizeObject = (obj: any) => {
    if (!isAnonymized) return obj;
    return applyPIIMask(obj, isAnonymized);
  };

  return {
    isAnonymized,
    setIsAnonymized,
    anonymizeText,
    anonymizeObject,
    toggle: () => setIsAnonymized(!isAnonymized),
  };
}
