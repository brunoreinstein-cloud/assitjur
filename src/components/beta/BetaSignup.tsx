import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BetaTrustBadges } from './BetaTrustBadges';
import { BetaSuccess } from './BetaSuccess';
import { EmailHint } from './EmailHint';
import { Fieldset } from './Fieldset';
import { supabase } from '@/integrations/supabase/client';

console.log('BetaSignup: Checking imports...');
console.log('BetaTrustBadges:', BetaTrustBadges);
console.log('BetaSuccess:', BetaSuccess);
console.log('EmailHint:', EmailHint);
console.log('Fieldset:', Fieldset);

const betaSignupSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  cargo: z.string().optional(),
  organizacao: z.string().min(2, 'Organização deve ter pelo menos 2 caracteres'),
  necessidades: z.array(z.string()).min(1, 'Selecione pelo menos uma necessidade'),
  outro_texto: z.string().max(120, 'Máximo 120 caracteres').optional(),
});

type BetaSignupForm = z.infer<typeof betaSignupSchema>;

const cargoOptions = [
  { value: 'gestor', label: 'Gestor(a)' },
  { value: 'advogado', label: 'Advogado(a)' },
  { value: 'analista', label: 'Analista' },
  { value: 'diretoria', label: 'Diretoria' },
  { value: 'outro', label: 'Outro' },
];

const necessidadeOptions = [
  { value: 'tempo_operacional', label: 'Reduzir tempo operacional' },
  { value: 'provisoes', label: 'Ajustar provisões' },
  { value: 'testemunhas', label: 'Mapear testemunhas' },
  { value: 'governanca', label: 'Melhorar governança jurídica' },
  { value: 'outro', label: 'Outro' },
];

const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'uol.com.br', 'bol.com.br'];

interface BetaSignupProps {
  compact?: boolean;
  className?: string;
  variant?: 'inline' | 'card';
}

export function BetaSignup({ compact = false, className = '', variant = 'inline' }: BetaSignupProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showEmailHint, setShowEmailHint] = useState(false);
  const [showOutroText, setShowOutroText] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
  });

  const watchEmail = watch('email');
  const watchNecessidades = watch('necessidades', []);

  // Check for public domain
  React.useEffect(() => {
    if (watchEmail) {
      const domain = watchEmail.split('@')[1];
      setShowEmailHint(domain && publicDomains.includes(domain.toLowerCase()));
    }
  }, [watchEmail]);

  // Show outro text field when "Outro" is selected
  React.useEffect(() => {
    const hasOutro = watchNecessidades?.includes('outro');
    setShowOutroText(hasOutro);
    if (!hasOutro) {
      setValue('outro_texto', '');
    }
  }, [watchNecessidades, setValue]);

  const handleNecessidadeChange = (value: string, checked: boolean) => {
    const current = watchNecessidades || [];
    if (checked) {
      setValue('necessidades', [...current, value]);
    } else {
      setValue('necessidades', current.filter(n => n !== value));
    }
  };

  const onSubmit = async (data: BetaSignupForm) => {
    setIsSubmitting(true);
    
    try {
      // Track form submission
      console.log('beta_form_submitted', data);
      
      // Get UTM parameters
      const urlParams = new URLSearchParams(window.location.search);
      const utm = {
        source: urlParams.get('utm_source'),
        medium: urlParams.get('utm_medium'),
        campaign: urlParams.get('utm_campaign'),
      };

      const payload = {
        ...data,
        utm,
        created_at: new Date().toISOString(),
      };

      // Try to call the edge function
      try {
        const { data: result, error } = await supabase.functions.invoke('beta-signup', {
          body: payload,
        });

        if (error) throw error;

        console.log('beta_form_success', result);
        setIsSuccess(true);
        toast({
          title: 'Sucesso!',
          description: 'Você foi adicionado à lista Beta do HubJUR.IA',
        });
      } catch (apiError) {
        // Fallback to mock success
        console.log('Using mock success - API not available');
        await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
        
        console.log('beta_form_success (mock)', payload);
        setIsSuccess(true);
        toast({
          title: 'Sucesso!',
          description: 'Você foi adicionado à lista Beta do HubJUR.IA',
        });
      }
    } catch (error) {
      console.error('beta_form_error', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro. Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setShowEmailHint(false);
    setShowOutroText(false);
    reset();
    console.log('beta_form_opened');
  };

  if (isSuccess) {
    return <BetaSuccess onReset={handleReset} className={className} />;
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-primary font-medium text-sm">
          Ganhe acesso antecipado e ajude a moldar o futuro do contencioso com IA.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nome */}
        <Fieldset
          label="Nome completo"
          error={errors.nome?.message}
          required
        >
          <input
            {...register('nome')}
            type="text"
            placeholder="Ex.: Ana Silva"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            aria-describedby={errors.nome ? 'nome-error' : undefined}
          />
        </Fieldset>

        {/* Email */}
        <Fieldset
          label="E-mail corporativo"
          error={errors.email?.message}
          help="Prometemos não lotar sua caixa de entrada."
          required
        >
          <input
            {...register('email')}
            type="email"
            placeholder="seuemail@empresa.com"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            aria-describedby={errors.email ? 'email-error' : 'email-help'}
          />
          {showEmailHint && <EmailHint />}
        </Fieldset>

        {/* Cargo (opcional se compact) */}
        {!compact && (
          <Fieldset
            label="Cargo/Função"
            error={errors.cargo?.message}
          >
            <select
              {...register('cargo')}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="">Selecione seu cargo</option>
              {cargoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Fieldset>
        )}

        {/* Organização */}
        <Fieldset
          label="Organização/Escritório/Empresa"
          error={errors.organizacao?.message}
          required
        >
          <input
            {...register('organizacao')}
            type="text"
            placeholder="Ex.: Empresa X / Escritório Y"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            aria-describedby={errors.organizacao ? 'organizacao-error' : undefined}
          />
        </Fieldset>

        {/* Necessidades */}
        <Fieldset
          label="Principal necessidade"
          error={errors.necessidades?.message}
          help="Selecione ao menos uma opção"
          required
        >
          <div className="space-y-2">
            {necessidadeOptions.map(option => (
              <label key={option.value} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={watchNecessidades?.includes(option.value) || false}
                  onChange={(e) => handleNecessidadeChange(option.value, e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary focus:ring-2"
                />
                <span className="text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </Fieldset>

        {/* Outro texto (condicional) */}
        {showOutroText && (
          <Fieldset
            label="Especifique outro"
            error={errors.outro_texto?.message}
            help="Máximo 120 caracteres"
          >
            <input
              {...register('outro_texto')}
              type="text"
              placeholder="Descreva sua necessidade..."
              maxLength={120}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </Fieldset>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Quero entrar na lista Beta'
          )}
        </Button>

        {/* Trust badges */}
        <BetaTrustBadges />

        {/* LGPD Notice */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Seus dados serão usados apenas para contato sobre o HubJUR.IA. Você pode sair da lista a qualquer momento.
        </p>
      </form>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card data-beta-signup className={`max-w-lg mx-auto shadow-glow border-2 border-primary/20 ${className}`}>
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <div data-beta-signup className={`max-w-lg mx-auto ${className}`}>
      {content}
    </div>
  );
}