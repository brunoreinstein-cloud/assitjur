import { supabase } from '@/integrations/supabase/client';

/** Check if current user allowed analytics */
export const analyticsAllowed = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('lgpd_consent')
    .select('analytics')
    .eq('user_id', user.id)
    .single();
  return !!data?.analytics;
};
