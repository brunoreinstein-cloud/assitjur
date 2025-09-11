import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const CACHE_KEY = 'featureFlags';

async function loadFlags(userId?: string, plan?: string): Promise<void> {
  try {
    if (userId === undefined || plan === undefined) {
      localStorage.removeItem(CACHE_KEY);
      window.dispatchEvent(new StorageEvent('storage', { key: CACHE_KEY }));
      return;
    }

    const filters: string[] = [];
    if (userId) filters.push(`user_id.eq.${userId}`);
    if (plan) filters.push(`plan.eq.${plan}`);

    const { data } = await supabase
      .from('feature_flags')
      .select('flag, enabled')
      .or(filters.join(','));

    const map: Record<string, boolean> = {};
    data?.forEach((row) => {
      map[row.flag] = row.enabled;
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
    window.dispatchEvent(new StorageEvent('storage', { key: CACHE_KEY }));
    return;
  } catch (error) {
    console.error('Failed to load feature flags', error);
    window.dispatchEvent(new StorageEvent('storage', { key: CACHE_KEY }));
    return;
  }
}

export const useFeatureFlag = (flag: string) => {
  const { user, profile } = useAuth();
  const [enabled, setEnabled] = useState<boolean>(() => {
    const flags = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    return !!flags[flag];
  });

  useEffect(() => {
    loadFlags(user?.id, profile?.plan || undefined);
  }, [user?.id, profile?.plan]);

  useEffect(() => {
    const handler = () => {
      const flags = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      setEnabled(!!flags[flag]);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [flag]);

  return enabled;
};

export { loadFlags as refreshFeatureFlags };
