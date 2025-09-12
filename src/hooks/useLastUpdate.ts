import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

interface LastUpdate {
  versionNumber: number | null;
  publishedAtUTC: string | null;
  summary: any;
}

export function useLastUpdate() {
  const { profile } = useAuth();

  const { data: lastUpdate, isLoading, refetch } = useQuery<LastUpdate | null>({
    queryKey: ['last-update', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) {
        console.error('Organização não encontrada para last-update');
        return null;
      }
      const { data, error } = await supabase.functions.invoke('get-last-update');
      if (error) {
        console.error('Error fetching last update:', error);
        return null;
      }
      return data as LastUpdate;
    },
    enabled: !!profile?.organization_id,
    staleTime: 5 * 60 * 1000,
  });

  const formatLocalDateTime = (utcString: string) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
    return new Date(utcString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz
    });
  };

  const formatShortDateTime = (utcString: string) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
    return new Date(utcString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz
    });
  };

  return {
    ...lastUpdate,
    isLoading,
    formatLocalDateTime,
    formatShortDateTime,
    refetch,
  };
}
