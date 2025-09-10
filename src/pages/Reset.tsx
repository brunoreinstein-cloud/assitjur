import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Scale, ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthCard } from '@/components/auth/AuthCard';
import { AlertBox } from '@/components/auth/AlertBox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const resetSchema = z.object({
  email: z.string().email('E-mail inválido')
});

type ResetFormData = z.infer<typeof resetSchema>;

const Reset = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: ''
    }
  });

  const handleResetPassword = async (data: ResetFormData) => {
    setIsLoading(true);
    
    try {
      if (!supabase) {
        // Mock reset for development
        toast.success("E-mail enviado!", {
          description: "Instruções de redefinição foram enviadas (modo demo)."
        });
        setSentEmail(data.email);
        setEmailSent(true);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset/confirm`
      });

      if (error) {
        throw error;
      }

      toast.success("E-mail enviado!", {
        description: "Verifique sua caixa de entrada para redefinir sua senha."
      });

      setSentEmail(data.email);
      setEmailSent(true);

    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Don't reveal if email exists - generic message
      toast.error("Erro no envio", {
        description: "Se o e-mail estiver cadastrado, você receberá as instruções."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    form.handleSubmit(handleResetPassword)();
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <img
                src="/lovable-uploads/857f118f-dfc5-4d37-a64d-5f5caf7565f8.png"
                alt="AssistJur.IA"
                className="w-10 h-10 object-contain"
                loading="lazy"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">AssistJur.IA</h1>
                <p className="text-sm text-muted-foreground">Assistente de Testemunhas</p>
              </div>
            </div>
          </div>

          <AuthCard
            title="E-mail enviado"
            description="Verifique sua caixa de entrada"
          >
            <div className="text-center space-y-6">
              <div className="mx-auto p-3 bg-success/10 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enviamos as instruções de redefinição de senha para:
                </p>
                <p className="font-medium break-all">{sentEmail}</p>
              </div>

              <AlertBox variant="info">
                <div className="space-y-2 text-sm">
                  <p>Não encontrou o e-mail?</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>Verifique a pasta de spam/lixo eletrônico</li>
                    <li>O e-mail pode levar alguns minutos para chegar</li>
                    <li>Certifique-se de que o endereço está correto</li>
                  </ul>
                </div>
              </AlertBox>

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
                    'Reenviar e-mail'
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>
            </div>
          </AuthCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <img
              src="/lovable-uploads/857f118f-dfc5-4d37-a64d-5f5caf7565f8.png"
              alt="AssistJur.IA"
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">AssistJur.IA</h1>
              <p className="text-sm text-muted-foreground">Assistente de Testemunhas</p>
            </div>
          </div>
        </div>

        <AuthCard
          title="Redefinir senha"
          description="Digite seu e-mail para receber as instruções"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enviaremos um link seguro para redefinir sua senha
              </p>
            </div>

            <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
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
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
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
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar instruções
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>
            </form>

            <div className="text-xs text-muted-foreground text-center">
              Por segurança, não informamos se o e-mail está cadastrado em nossa base.
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default Reset;