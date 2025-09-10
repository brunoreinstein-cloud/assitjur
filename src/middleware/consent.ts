import { supabase } from '@/integrations/supabase/client';

/** Check if current user allowed analytics */
export const analyticsAllowed = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  // TODO: Re-enable when lgpd_consent table exists
  // const { data } = await supabase
  //   .from('lgpd_consent')
  //   .select('analytics')
  //   .eq('user_id', user.id)
  //   .single();
  // return !!data?.analytics;
  return false; // Temporarily return false until table exists
};
