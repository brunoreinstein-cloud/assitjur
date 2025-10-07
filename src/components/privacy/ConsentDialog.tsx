"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useConsent } from "@/hooks/useConsent";

export function ConsentDialog() {
  // ✅ SSR safety: consent is client-only
  if (typeof window === "undefined") {
    return null;
  }

  const { open, setOpen, preferences, save } = useConsent();
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    if (preferences) {
      setAnalytics(preferences.analytics);
      setAds(preferences.ads);
    } else {
      setAnalytics(false);
      setAds(false);
    }
  }, [preferences, open]);

  const handleSave = (prefs: { analytics: boolean; ads: boolean }) => {
    save(prefs);
    setOpen(false);
  };

  const acceptAll = () => handleSave({ analytics: true, ads: true });
  const rejectAll = () => handleSave({ analytics: false, ads: false });
  const savePrefs = () => handleSave({ analytics, ads });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
        className="max-w-[440px] md:max-w-[480px] p-4 md:p-5 rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle id="consent-title" className="text-base md:text-lg">
            Controle como usamos seus dados
          </DialogTitle>
          <DialogDescription id="consent-desc" className="text-sm leading-snug">
            Usamos cookies essenciais para o site funcionar. Com sua permissão,
            também usamos dados para Medição e Publicidade. Você pode aceitar,
            rejeitar ou personalizar.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm leading-snug">
              <p className="font-medium">Essenciais</p>
              <p className="text-muted-foreground">
                Necessários para segurança e navegação. Não usados para
                marketing.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Sempre ativo</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="text-sm leading-snug">
              <p className="font-medium">Medição</p>
              <p className="text-muted-foreground">
                Métricas para melhorar sua experiência.
              </p>
            </div>
            <Switch
              className="origin-right scale-90"
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label="Ativar Medição"
            />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="text-sm leading-snug">
              <p className="font-medium">Publicidade</p>
              <p className="text-muted-foreground">
                Anúncios relevantes e medição de campanhas.
              </p>
            </div>
            <Switch
              className="origin-right scale-90"
              checked={ads}
              onCheckedChange={setAds}
              aria-label="Ativar Publicidade"
            />
          </div>
        </div>

        <div className="sticky bottom-0 mt-3 -mx-4 md:-mx-5 px-4 md:px-5 pt-3 border-t flex items-center justify-between gap-2">
          <Button variant="outline" className="w-full" onClick={rejectAll}>
            Rejeitar tudo
          </Button>
          <Button variant="ghost" className="w-full" onClick={savePrefs}>
            Salvar preferências
          </Button>
          <Button className="w-full" onClick={acceptAll}>
            Aceitar tudo
          </Button>
        </div>

        <div className="mt-3 text-center text-sm">
          <a
            href="/docs/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Política de Privacidade
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConsentDialog;
