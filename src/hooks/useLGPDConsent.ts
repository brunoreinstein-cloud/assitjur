import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LGPDConsent {
  analytics: boolean;
  marketing: boolean;
  sharing: boolean;
  retention_period_days: number;
  legal_basis: string;
}

export function useLGPDConsent() {
  const { user } = useAuth();
  const [consent, setConsent] = useState<LGPDConsent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConsent() {
      if (!user) {
        setLoading(false);
        return;
      }
      // TODO: Re-enable when lgpd_consent table exists
      // const { data } = await supabase
      //   .from('lgpd_consent')
      //   .select('analytics, marketing, sharing, retention_period_days, legal_basis')
      //   .eq('user_id', user.id)
      //   .single();
      // if (data) setConsent(data as LGPDConsent);
      setLoading(false);
    }
    loadConsent();
  }, [user]);

  const updateConsent = async (
    analytics: boolean,
    marketing: boolean,
    sharing: boolean,
    retention_period_days: number,
    legal_basis: string
  ) => {
    // TODO: Re-enable when lgpd_consent table exists  
    // const { data } = await supabase
    //   .from('lgpd_consent')
    //   .upsert({
    //     user_id: user.id,
    //     analytics,
    //     marketing,
    //     sharing,
    //     retention_period_days,
    //     legal_basis
    //   });
    setConsent({ analytics, marketing, sharing, retention_period_days, legal_basis });
  };

  return { consent, loading, updateConsent };
}