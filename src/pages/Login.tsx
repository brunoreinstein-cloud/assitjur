import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Scale, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['OFFICE', 'ADMIN'], { required_error: 'Selecione um perfil' }),
  orgCode: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'É necessário aceitar os Termos para prosseguir.'
  })
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { signIn, loading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'OFFICE',
      orgCode: '',
      acceptTerms: false
    }
  });

  const watchRole = form.watch('role');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/app/chat');
    }
  }, [user, navigate]);

  const handleSignIn = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await signIn(
        data.email, 
        data.password, 
        data.role,
        data.role === 'ADMIN' ? data.orgCode : undefined
      );

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message
        });
        return;
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao Hubjuria!"
      });

      // Navigation will be handled by the auth state change
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: error.message || "Tente novamente em alguns instantes."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Recuperação de senha",
      description: "Entre em contato com o administrador do sistema."
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Scale className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">Hubjuria</span>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Política de Privacidade/LGPD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Política de Privacidade e LGPD</DialogTitle>
              <DialogDescription>
                Informações sobre tratamento de dados pessoais
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p>
                A Hubjuria está comprometida com a proteção da privacidade e dos dados pessoais 
                de seus usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>
              <h3 className="font-semibold">Dados Coletados</h3>
              <p>
                Coletamos apenas os dados necessários para o funcionamento da plataforma: 
                e-mail, informações de perfil profissional e logs de auditoria.
              </p>
              <h3 className="font-semibold">Finalidade</h3>
              <p>
                Os dados são utilizados exclusivamente para autenticação, controle de acesso 
                e auditoria de segurança da plataforma.
              </p>
              <h3 className="font-semibold">Segurança</h3>
              <p>
                Todos os dados são criptografados e armazenados em servidores seguros. 
                Implementamos medidas técnicas e organizacionais adequadas para proteger 
                suas informações.
              </p>
              <h3 className="font-semibold">Seus Direitos</h3>
              <p>
                Você tem direito ao acesso, correção, exclusão e portabilidade de seus dados. 
                Entre em contato conosco para exercer esses direitos.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md shadow-premium">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
            <CardDescription>
              Entre com suas credenciais para continuar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-6">
              {/* Profile Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de Acesso</Label>
                <RadioGroup
                  value={form.watch('role')}
                  onValueChange={(value) => form.setValue('role', value as 'OFFICE' | 'ADMIN')}
                  className="grid grid-cols-1 gap-3"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent transition-colors">
                    <RadioGroupItem value="OFFICE" id="office" />
                    <Label htmlFor="office" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Entrar como Escritório</div>
                        <div className="text-xs text-muted-foreground">Acesso para análise e consultas</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent transition-colors">
                    <RadioGroupItem value="ADMIN" id="admin" />
                    <Label htmlFor="admin" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Entrar como Administrador</div>
                        <div className="text-xs text-muted-foreground">Acesso completo e gestão de base</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {form.formState.errors.role && (
                  <Alert variant="destructive">
                    <AlertDescription>{form.formState.errors.role.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...form.register('email')}
                  className={form.formState.errors.email ? 'border-destructive' : ''}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...form.register('password')}
                    className={form.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Organization Code for Admin */}
              {watchRole === 'ADMIN' && (
                <div className="space-y-2">
                  <Label htmlFor="orgCode">Código da Organização</Label>
                  <Input
                    id="orgCode"
                    placeholder="org_XXXXX"
                    {...form.register('orgCode')}
                    className={form.formState.errors.orgCode ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.orgCode && (
                    <p className="text-sm text-destructive">{form.formState.errors.orgCode.message}</p>
                  )}
                </div>
              )}

              {/* Terms Acceptance */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={form.watch('acceptTerms')}
                  onCheckedChange={(checked) => form.setValue('acceptTerms', !!checked)}
                  className={form.formState.errors.acceptTerms ? 'border-destructive' : ''}
                />
                <Label htmlFor="acceptTerms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Aceito os Termos de Uso e a Política de Privacidade
                </Label>
              </div>
              {form.formState.errors.acceptTerms && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.acceptTerms.message}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                variant="professional"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleForgotPassword}
                  className="text-muted-foreground hover:text-primary"
                >
                  Esqueci minha senha
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Dados criptografados. Tentativas são registradas para auditoria.
        </p>
      </footer>
    </div>
  );
};

export default Login;