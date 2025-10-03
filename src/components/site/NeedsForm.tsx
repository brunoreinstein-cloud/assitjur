import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useBetaFormStore } from "@/stores/useBetaFormStore";
import { Loader2, ArrowRight } from "lucide-react";
import { track } from "@/lib/track";

interface NeedsFormProps {
  onSubmit?: (data: {
    email: string;
    needs: string[];
    otherNeed?: string;
  }) => void;
}

const needsOptions = [
  { id: "tempo", label: "Reduzir tempo em tarefas operacionais" },
  { id: "organizar", label: "Organizar e entender melhor a carteira" },
  { id: "provisoes", label: "Conectar provisões contábeis a dados reais" },
  { id: "testemunhas", label: "Mapear testemunhas e padrões de risco" },
];

export function NeedsForm({ onSubmit }: NeedsFormProps) {
  const {
    email,
    needs,
    otherNeed,
    loading,
    setEmail,
    setNeeds,
    setOtherNeed,
    submitBeta,
  } = useBetaFormStore();
  const [showOtherField, setShowOtherField] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; needs?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNeedChange = (needId: string, checked: boolean) => {
    const updatedNeeds = checked
      ? [...needs, needId]
      : needs.filter((n) => n !== needId);
    setNeeds(updatedNeeds);
  };

  const handleOtherChange = (checked: boolean) => {
    setShowOtherField(checked);
    if (!checked) {
      setOtherNeed("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    if (formData.get("website")) return;

    // Validations
    const newErrors: { email?: string; needs?: string } = {};

    if (!email || !validateEmail(email)) {
      newErrors.email = "Por favor, insira um e-mail válido";
    }

    if (needs.length === 0 && (!showOtherField || !otherNeed)) {
      newErrors.needs =
        "Por favor, selecione ao menos uma opção ou descreva sua necessidade";
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
        otherNeed: showOtherField ? otherNeed : undefined,
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-primary/20 shadow-glow bg-gradient-card animate-scale-in">
      <CardHeader className="text-center pb-6">
        <div className="w-12 h-12 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <span className="text-xl font-bold text-primary-foreground">?</span>
        </div>
        <CardTitle className="text-2xl text-foreground">
          Qual sua principal necessidade hoje?
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Ajude-nos a personalizar sua experiência no AssistJur.IA
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="website"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          {/* Necessidades */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {needsOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="group p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={option.id}
                      checked={needs.includes(option.id)}
                      onCheckedChange={(checked) =>
                        handleNeedChange(option.id, checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor={option.id}
                      className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                </div>
              ))}

              {/* Outro */}
              <div
                className="group p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${needsOptions.length * 0.1}s` }}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="outro"
                    checked={showOtherField}
                    onCheckedChange={handleOtherChange}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
                  />
                  <div className="flex-1 space-y-3">
                    <Label
                      htmlFor="outro"
                      className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors"
                    >
                      Outro (campo livre)
                    </Label>
                    {showOtherField && (
                      <div className="animate-fade-in">
                        <Textarea
                          value={otherNeed}
                          onChange={(e) => setOtherNeed(e.target.value)}
                          placeholder="Descreva sua necessidade específica..."
                          className="min-h-[80px] border-primary/30 focus:border-primary"
                          aria-describedby="outro-description"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {errors.needs && (
              <p
                className="text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
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
              <p
                id="email-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 py-2">
            <div
              className={`w-3 h-3 rounded-full transition-colors ${email && (needs.length > 0 || otherNeed) ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
            <div
              className={`w-8 h-1 rounded-full transition-colors ${email && (needs.length > 0 || otherNeed) ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
            <div
              className={`w-3 h-3 rounded-full transition-colors ${email && (needs.length > 0 || otherNeed) ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !email || (needs.length === 0 && !otherNeed)}
            onClick={() => track("cta_click", { id: "mid-entrar-beta" })}
            className="w-full bg-gradient-primary hover:bg-primary/90 hover:shadow-glow text-lg py-6 transition-all duration-300 group"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando inscrição...
              </>
            ) : (
              <>
                Entrar na lista Beta
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
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
