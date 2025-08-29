import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LastUpdate {
  versionNumber: number | null;
  publishedAtUTC: string | null;
  summary: any;
}

export function useLastUpdate() {
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchLastUpdate() {
      try {
        const { data, error } = await supabase.functions.invoke('get-last-update');
        
        if (error) {
          console.error('Error fetching last update:', error);
          setLastUpdate(null);
        } else {
          setLastUpdate(data);
        }
      } catch (error) {
        console.error('Error calling get-last-update:', error);
        setLastUpdate(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLastUpdate();
  }, [user]);

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
    refetch: () => {
      if (user) {
        setIsLoading(true);
        // Re-trigger the useEffect
        setLastUpdate(null);
      }
    }
  };
}