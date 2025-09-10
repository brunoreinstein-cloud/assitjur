import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useConsent } from '@/hooks/useConsent'
import { toast } from '@/components/ui/use-toast'

const SHARING_ENABLED = false
export function ConsentDialog() {
  const { open, setOpen, preferences, save } = useConsent()
  const [analytics, setAnalytics] = useState(false)
  const [ads, setAds] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (preferences) {
      setAnalytics(preferences.analytics)
      setAds(preferences.ads)
      setSharing(preferences.sharing ?? false)
    } else {
      setAnalytics(false)
      setAds(false)
      setSharing(false)
    }
  }, [preferences, open])

  const handleSave = (prefs: { analytics: boolean; ads: boolean; sharing?: boolean }) => {
    save(prefs)
    toast({ description: "Preferências salvas. Você pode alterar em 'Privacidade' no rodapé." })
    setOpen(false)
  }

  const acceptAll = () => handleSave({ analytics: true, ads: true, ...(SHARING_ENABLED ? { sharing: true } : {}) })
  const rejectAll = () => handleSave({ analytics: false, ads: false, ...(SHARING_ENABLED ? { sharing: false } : {}) })
  const savePrefs = () => handleSave({ analytics, ads, ...(SHARING_ENABLED ? { sharing } : {}) })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
        className="w-full md:max-w-xl md:mx-auto rounded-t-2xl p-6 space-y-6"
      >
        <SheetHeader>
          <SheetTitle id="consent-title">Controle como usamos seus dados</SheetTitle>
          <SheetDescription id="consent-desc">
            Usamos cookies essenciais para o site funcionar. Com sua permissão, também usamos dados para Medição e Publicidade. Você
            pode aceitar, rejeitar ou personalizar.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium">Essenciais</p>
            <p className="text-sm text-muted-foreground">
              Necessários para segurança e navegação. Não usados para marketing.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Medição</p>
              <p className="text-sm text-muted-foreground">Métricas para melhorar sua experiência.</p>
            </div>
            <Switch
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label="Ativar Medição"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Publicidade</p>
              <p className="text-sm text-muted-foreground">Anúncios relevantes e medição de campanhas.</p>
            </div>
            <Switch checked={ads} onCheckedChange={setAds} aria-label="Ativar Publicidade" />
          </div>

          {SHARING_ENABLED && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Compartilhamento</p>
                <p className="text-sm text-muted-foreground">Parceria para personalização avançada.</p>
              </div>
              <Switch checked={sharing} onCheckedChange={setSharing} aria-label="Ativar Compartilhamento" />
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
          <Button variant="outline" className="sm:flex-1" onClick={rejectAll}>
            Rejeitar tudo
          </Button>
          <Button variant="link" onClick={savePrefs}>
            Salvar preferências
          </Button>
          <Button className="sm:flex-1" onClick={acceptAll}>
            Aceitar tudo
          </Button>
        </div>

        <div className="text-center text-sm">
          <a
            href="/docs/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Política de Privacidade
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ConsentDialog
