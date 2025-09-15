import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { getEnv } from "@/lib/getEnv";

const magicLinkSchema = z.object({
  email: z.string().email('Formato de email inválido')
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

interface MagicLinkFormProps {
  onBack: () => void;
}

export const MagicLinkForm = ({ onBack }: MagicLinkFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<number | null>(null);

  const form = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: ''
    }
  });

  // Debounce email validation to prevent excessive API calls
  const debouncedEmail = useDebounce(form.watch('email'), 500);

  const handleSendMagicLink = useCallback(async (data: MagicLinkFormData) => {
    // Rate limiting check on client side
    const now = Date.now();
    if (lastAttempt && now - lastAttempt < 60000) { // 1 minute cooldown
      toast.error("Aguarde um momento", {
        description: "Aguarde pelo menos 1 minuto entre tentativas."
      });
      return;
    }

    setIsLoading(true);
    setLastAttempt(now);
    
    try {
      if (!supabase) {
        // Mock magic link for development
        toast.success("Link enviado!", {
          description: "Verifique seu e-mail (modo demo - use o login normal)"
        });
        setEmailSent(true);
        return;
      }

      const { siteUrl } = getEnv();
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${siteUrl}/`
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        
        if (error.message.includes('rate') || error.message.includes('limit') || error?.status === 429) {
          toast.error('Limite de tentativas atingido', {
            description: 'Muitas tentativas de login. Tente novamente em alguns minutos.'
          });
        } else if (error.message.includes('email')) {
          toast.error('Email inválido', {
            description: 'Verifique se o email foi digitado corretamente.'
          });
        } else {
          toast.error("Erro ao enviar link", {
            description: "Não foi possível enviar o link de acesso. Tente novamente."
          });
        }
        return;
      }

      toast.success("Link de acesso enviado!", {
        description: "Verifique sua caixa de entrada e clique no link para entrar."
      });

      setEmailSent(true);

    } catch (error: any) {
      console.error('Unexpected magic link error:', error);
      if (error?.status === 429) {
        toast.error('Muitas tentativas', {
          description: 'Tente novamente mais tarde.'
        });
      } else {
        toast.error("Erro inesperado", {
          description: "Ocorreu um erro ao enviar o link. Tente novamente em alguns instantes."
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastAttempt]);

  const handleResend = () => {
    setEmailSent(false);
    form.handleSubmit(handleSendMagicLink)();
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-6" role="alert" aria-live="polite">
        <div className="mx-auto p-3 bg-success/10 rounded-full w-fit">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Link enviado!</h3>
          <p className="text-sm text-muted-foreground">
            Verifique sua caixa de entrada e clique no link para fazer login automaticamente.
          </p>
          <p className="text-xs text-muted-foreground">
            Enviado para: <strong>{form.getValues('email')}</strong>
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleResend}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reenviando...
              </>
            ) : (
              'Reenviar link'
            )}
          </Button>
          
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Acessar área segura com link</h3>
        <p className="text-sm text-muted-foreground">
          Enviaremos um link de acesso seguro para o seu e-mail
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSendMagicLink)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...form.register('email')}
            className={form.formState.errors.email ? 'border-destructive' : ''}
            autoFocus
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando link...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar link de acesso
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao login
          </Button>
        </div>
      </form>

      <div className="text-xs text-muted-foreground text-center">
        O link de acesso expira em 1 hora e só pode ser usado uma vez.
      </div>
    </div>
  );
};