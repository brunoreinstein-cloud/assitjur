import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LGPDConsent {
  analytics: boolean;
  marketing: boolean;
  sharing: boolean;
  retention_period_days: number;
  legal_basis: string;
}

export function useLGPDConsent() {
  const [consent, setConsent] = useState<LGPDConsent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('lgpd_consent')
        .select('analytics, marketing, sharing, retention_period_days, legal_basis')
        .eq('user_id', user.id)
        .single();
      if (data) setConsent(data as LGPDConsent);
      setLoading(false);
    }
    load();
  }, []);

  const saveConsent = async (c: LGPDConsent) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('lgpd_consent').upsert({ user_id: user.id, ...c, updated_at: new Date().toISOString() });
    setConsent(c);
  };

  return { consent, saveConsent, loading };
}
