import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyTOTP } from "@/utils/totp";

const twoFactorSchema = z.object({
  code: z.string()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d{6}$/, 'Código deve conter apenas números')
});

type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

interface TwoFactorFormProps {
  onBack: () => void;
  onSuccess: () => void;
  userEmail?: string;
  secret: string;
  backupCode?: string;
}

export const TwoFactorForm = ({ onBack, onSuccess, userEmail, secret, backupCode }: TwoFactorFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const form = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: ''
    }
  });

  const handleVerifyCode = async (data: TwoFactorFormData) => {
    setIsLoading(true);
    
    try {
      const isValid = (await verifyTOTP(data.code, secret)) || (backupCode && data.code === backupCode);
      if (isValid) {
        toast.success("Verificação concluída!", {
          description: "Acesso autorizado com sucesso."
        });
        onSuccess();
      } else {
        setAttempts(prev => prev + 1);
        
        if (attempts >= 2) {
          toast.error("Muitas tentativas", {
            description: "Conta temporariamente bloqueada. Tente novamente em 15 minutos."
          });
          onBack();
        } else {
          toast.error("Código inválido", {
            description: `Código incorreto. Tentativas restantes: ${3 - attempts - 1}`
          });
          form.reset();
        }
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error("Erro na verificação", {
        description: "Não foi possível verificar o código. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCodeInput = (value: string) => {
    // Auto-format as user types: 123 456
    const numbers = value.replace(/\D/g, '').slice(0, 6);
    if (numbers.length <= 3) return numbers;
    return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Verificação em duas etapas</h3>
        <p className="text-sm text-muted-foreground">
          Digite o código de 6 dígitos do seu aplicativo autenticador
        </p>
        {userEmail && (
          <p className="text-xs text-muted-foreground">
            Entrando como: <strong>{userEmail}</strong>
          </p>
        )}
      </div>

      <form onSubmit={form.handleSubmit(handleVerifyCode)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código de verificação</Label>
          <Input
            id="code"
            placeholder="000 000"
            {...form.register('code')}
            onChange={(e) => {
              const formatted = formatCodeInput(e.target.value);
              form.setValue('code', formatted.replace(' ', ''));
              e.target.value = formatted;
            }}
            className={`text-center text-2xl font-mono tracking-widest ${
              form.formState.errors.code ? 'border-destructive' : ''
            }`}
            maxLength={7} // 6 digits + 1 space
            autoFocus
            autoComplete="one-time-code"
          />
          {form.formState.errors.code && (
            <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || form.watch('code').length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verificar código
              </>
            )}
          </Button>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={isLoading}
              className="text-xs"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Voltar
            </Button>
          </div>
        </div>
      </form>

      {/* Help text */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Não consegue acessar seu autenticador? Utilize o código de backup fornecido ao habilitar o 2FA.</p>
      </div>
    </div>
  );
};