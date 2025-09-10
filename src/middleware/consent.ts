import { supabase } from '@/integrations/supabase/client';

/** Check if current user allowed analytics */
export const analyticsAllowed = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('lgpd_consent')
    .select('analytics')
    .eq('user_id', user.id)
    .single();
  if (error) {
    console.error('Error checking analytics consent', error);
    return false;
  }
  return !!data?.analytics;
};
