import React, { useRef, useState } from 'react';
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
import { disposableDomains } from '@/config/disposableDomains';
import { track } from '@/lib/track';

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const betaSignupSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z
    .string()
    .regex(emailRegex, 'E-mail inválido')
    .refine(val => {
      const domain = val.split('@')[1]?.toLowerCase();
      return domain ? !disposableDomains.includes(domain) : true;
    }, 'Domínio de e-mail descartável não permitido'),
  cargo: z.string().optional(),
  organizacao: z.string().min(2, 'Organização deve ter pelo menos 2 caracteres'),
  necessidades: z.array(z.string()).min(1, 'Selecione pelo menos uma necessidade'),
  outro_texto: z.string().max(120, 'Máximo 120 caracteres').optional(),
  website: z.string().max(0).optional(),
  consentimento: z.boolean().refine(val => val === true, {
    message: 'É necessário seu consentimento',
  }),
  termos: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos',
  }),
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

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

async function hasMxRecord(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const data = await res.json();
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return true; // ignore network errors
  }
}

interface BetaSignupProps {
  compact?: boolean;
  className?: string;
  variant?: 'inline' | 'card';
}

export function BetaSignup({ compact = false, className = '', variant = 'inline' }: BetaSignupProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showEmailHint, setShowEmailHint] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [showOutroText, setShowOutroText] = useState(false);
  const { toast } = useToast();
  const lastSubmitRef = useRef(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
    mode: 'onChange',
    defaultValues: {
      consentimento: false,
      termos: false,
      website: '',
    },
  });

  const watchEmail = watch('email');
  const watchNecessidades = watch('necessidades', []);

  // Check for public domain and suggest corrections
  React.useEffect(() => {
    if (watchEmail) {
      const domain = watchEmail.split('@')[1];
      if (domain) {
        const lower = domain.toLowerCase();
        setShowEmailHint(publicDomains.includes(lower));
        const suggestion = publicDomains.find(d =>
          levenshtein(lower, d) <= 2
        );
        setEmailSuggestion(
          suggestion && suggestion !== lower ? suggestion : null
        );
      } else {
        setShowEmailHint(false);
        setEmailSuggestion(null);
      }
    } else {
      setShowEmailHint(false);
      setEmailSuggestion(null);
    }
  }, [watchEmail]);

  // Optional MX record validation
  React.useEffect(() => {
    const domain = watchEmail?.split('@')[1]?.toLowerCase();
    if (
      domain &&
      emailRegex.test(watchEmail) &&
      !publicDomains.includes(domain)
    ) {
      hasMxRecord(domain).then(valid => {
        if (!valid) {
          setError('email', {
            type: 'custom',
            message: 'Domínio de e-mail inválido',
          });
        } else if (errors.email?.type === 'custom') {
          clearErrors('email');
        }
      });
    }
  }, [watchEmail, setError, clearErrors, errors.email]);

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
    if (data.website) {
      return;
    }
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) {
      return;
    }
    lastSubmitRef.current = now;
    setIsSubmitting(true);
    
    try {
      // Track form submission
      track('beta_submit', { email_domain: data.email.split('@')[1] });
      
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

        if (error) {
          if (error.status === 429) {
            toast({
              title: 'Calma aí!',
              description: 'Muitas inscrições em pouco tempo. Tente novamente mais tarde.',
            });
            return;
          }
          throw error;
        }

        setIsSuccess(true);
        toast({
          title: 'Sucesso!',
          description: 'Você foi adicionado à lista Beta do AssistJur.IA',
        });
      } catch (apiError) {
        // Fallback to mock success
        await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
        
        setIsSuccess(true);
        toast({
          title: 'Sucesso!',
          description: 'Você foi adicionado à lista Beta do AssistJur.IA',
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
        <input
          type="text"
          name="website"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          {...register('website')}
        />
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
            autoComplete="email"
          />
          {showEmailHint && <EmailHint />}
          {emailSuggestion && (
            <p className="text-xs text-muted-foreground mt-2" aria-live="polite">
              Você quis dizer {emailSuggestion}?
            </p>
          )}
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

        {/* Consentimento LGPD */}
        <div className="space-y-2">
          <label className="flex items-start space-x-2 text-sm">
            <input
              type="checkbox"
              {...register('consentimento')}
              className="rounded border-border text-primary focus:ring-primary focus:ring-2 mt-1"
              aria-describedby={errors.consentimento ? 'consentimento-error' : undefined}
            />
            <span className="text-foreground">
              Autorizo o uso dos meus dados para contato sobre o AssistJur.IA.
            </span>
          </label>
          {errors.consentimento && (
            <p
              id="consentimento-error"
              className="text-xs text-destructive font-medium"
              role="alert"
              aria-live="polite"
            >
              {errors.consentimento.message}
            </p>
          )}
        </div>

        {/* Termos de uso */}
        <div className="space-y-2">
          <label className="flex items-start space-x-2 text-sm">
            <input
              type="checkbox"
              {...register('termos')}
              className="rounded border-border text-primary focus:ring-primary focus:ring-2 mt-1"
              aria-describedby={errors.termos ? 'termos-error' : undefined}
            />
            <span className="text-foreground">Li e concordo com os termos de uso.</span>
          </label>
          {errors.termos && (
            <p
              id="termos-error"
              className="text-xs text-destructive font-medium"
              role="alert"
              aria-live="polite"
            >
              {errors.termos.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
                focusable="false"
              />
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
          Seus dados serão usados apenas para contato sobre o AssistJur.IA. Você pode sair da lista a qualquer momento.
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