import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useBetaFormStore } from '@/stores/useBetaFormStore';
import { Loader2 } from 'lucide-react';

interface NeedsFormProps {
  onSubmit?: (data: { email: string; needs: string[]; otherNeed?: string }) => void;
}

const needsOptions = [
  { id: 'tempo', label: 'Reduzir tempo em tarefas operacionais' },
  { id: 'organizar', label: 'Organizar e entender melhor a carteira' },
  { id: 'provisoes', label: 'Conectar provisões contábeis a dados reais' },
  { id: 'testemunhas', label: 'Mapear testemunhas e padrões de risco' },
];

export function NeedsForm({ onSubmit }: NeedsFormProps) {
  const { email, needs, otherNeed, loading, setEmail, setNeeds, setOtherNeed, submitBeta } = useBetaFormStore();
  const [showOtherField, setShowOtherField] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; needs?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNeedChange = (needId: string, checked: boolean) => {
    const updatedNeeds = checked 
      ? [...needs, needId]
      : needs.filter(n => n !== needId);
    setNeeds(updatedNeeds);
  };

  const handleOtherChange = (checked: boolean) => {
    setShowOtherField(checked);
    if (!checked) {
      setOtherNeed('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    const newErrors: { email?: string; needs?: string } = {};
    
    if (!email || !validateEmail(email)) {
      newErrors.email = 'Por favor, insira um e-mail válido';
    }
    
    if (needs.length === 0 && (!showOtherField || !otherNeed)) {
      newErrors.needs = 'Por favor, selecione ao menos uma opção ou descreva sua necessidade';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Submit
    const success = await submitBeta();
    
    if (success && onSubmit) {
      onSubmit({
        email,
        needs,
        otherNeed: showOtherField ? otherNeed : undefined
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Qual sua principal necessidade hoje?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Necessidades */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {needsOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.id}
                    checked={needs.includes(option.id)}
                    onCheckedChange={(checked) => handleNeedChange(option.id, checked as boolean)}
                  />
                  <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
              
              {/* Outro */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="outro"
                  checked={showOtherField}
                  onCheckedChange={handleOtherChange}
                />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="outro" className="text-sm font-normal cursor-pointer">
                    Outro (campo livre)
                  </Label>
                  {showOtherField && (
                    <Textarea
                      value={otherNeed}
                      onChange={(e) => setOtherNeed(e.target.value)}
                      placeholder="Descreva sua necessidade específica..."
                      className="min-h-[80px]"
                      aria-describedby="outro-description"
                    />
                  )}
                </div>
              </div>
            </div>
            
            {errors.needs && (
              <p className="text-sm text-destructive" role="alert">
                {errors.needs}
              </p>
            )}
          </div>

          {/* E-mail */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail corporativo *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com"
              required
              aria-describedby={errors.email ? "email-error" : undefined}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-primary hover:shadow-glow"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Entrar na lista Beta'
            )}
          </Button>

          {/* LGPD */}
          <p className="text-xs text-muted-foreground text-center">
            Seus dados serão usados apenas para contato sobre o Beta.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}