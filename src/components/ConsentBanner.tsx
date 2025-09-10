import { useState } from 'react';
import { useLGPDConsent } from '@/hooks/useLGPDConsent';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export const ConsentBanner = () => {
  const { consent, saveConsent, loading } = useLGPDConsent();
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (loading || consent) return null;

  const submit = async () => {
    await saveConsent({
      analytics,
      marketing,
      sharing,
      retention_period_days: 365,
      legal_basis: 'consent'
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow p-4">
      <p className="mb-2">Este site usa dados para analytics e marketing. Ajuste suas preferências:</p>
      <div className="flex gap-4 mb-2">
        <label className="flex items-center gap-2">
          <Switch checked={analytics} onCheckedChange={setAnalytics} /> Analytics
        </label>
        <label className="flex items-center gap-2">
          <Switch checked={marketing} onCheckedChange={setMarketing} /> Marketing
        </label>
        <label className="flex items-center gap-2">
          <Switch checked={sharing} onCheckedChange={setSharing} /> Compartilhar dados
        </label>
      </div>
      <Button onClick={submit}>Salvar preferências</Button>
    </div>
  );
};

export default ConsentBanner;
