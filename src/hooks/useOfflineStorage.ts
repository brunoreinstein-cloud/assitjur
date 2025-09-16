import { useState, useEffect } from 'react';
import { useNotifications } from '@/stores/useNotificationStore';
import { logWarn } from '@/lib/logger';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class OfflineStorage {
  private prefix = 'assistjur_';

  set<T>(key: string, data: T, expiresIn = 24 * 60 * 60 * 1000): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresIn
      };
      
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
    } catch (error) {
      logWarn('Failed to save to localStorage', { key }, 'OfflineStorage');
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.expiresIn) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      logWarn('Failed to read from localStorage', { key }, 'OfflineStorage');
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      logWarn('Failed to remove from localStorage', { key }, 'OfflineStorage');
    }
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logWarn('Failed to clear localStorage', {}, 'OfflineStorage');
    }
  }

  getSize(): string {
    let total = 0;
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => {
          total += localStorage.getItem(key)?.length || 0;
        });
    } catch (error) {
      logWarn('Failed to calculate storage size', {}, 'OfflineStorage');
    }
    
    return `${(total / 1024).toFixed(2)} KB`;
  }
}

export const offlineStorage = new OfflineStorage();

// Hook for online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { warning, success } = useNotifications();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      success('Conexão restaurada', 'Sistema online novamente');
    };

    const handleOffline = () => {
      setIsOnline(false);
      warning(
        'Sem conexão', 
        'Modo offline ativado. Algumas funcionalidades podem não estar disponíveis.',
        { duration: null } // Persistent notification
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [warning, success]);

  return isOnline;
}

// Hook for cached data with offline support
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cacheTime?: number;
    enabled?: boolean;
    fallbackData?: T;
  } = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    fallbackData
  } = options;

  const [data, setData] = useState<T | null>(fallbackData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const { error: notifyError } = useNotifications();

  useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      // Try to get from cache first
      const cached = offlineStorage.get<T>(key);
      if (cached) {
        setData(cached);
      }

      // If online, try to fetch fresh data
      if (isOnline) {
        try {
          setLoading(true);
          setError(null);
          
          const freshData = await fetcher();
          
          setData(freshData);
          offlineStorage.set(key, freshData, cacheTime);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
          setError(errorMessage);
          
          // If no cached data, notify user
          if (!cached) {
            notifyError(
              'Erro ao carregar dados',
              'Verifique sua conexão e tente novamente.'
            );
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [key, enabled, isOnline, fetcher, cacheTime, fallbackData, notifyError]);

  const refresh = () => {
    if (isOnline && enabled) {
      // Force refresh by removing cache and reloading
      offlineStorage.remove(key);
      setData(fallbackData || null);
      setError(null);
    }
  };

  return {
    data,
    loading,
    error,
    refresh,
    isOnline,
    isCached: !!offlineStorage.get(key)
  };
}