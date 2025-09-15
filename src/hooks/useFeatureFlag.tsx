import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  FC,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { getEnv } from '@/lib/getEnv';

const FlagsSchema = z.record(z.string(), z.boolean());
const ResponseSchema = z.object({ flags: FlagsSchema });

type Flags = z.infer<typeof FlagsSchema>;

const FeatureFlagContext = createContext<Flags>({});

let globalRefresh: (() => Promise<void>) | null = null;

interface FeatureFlagProviderProps {
  children: ReactNode;
}

export const FeatureFlagProvider: FC<FeatureFlagProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const tenantId = profile?.organization_id;
  const userId = user?.id;
  const environment = process.env.NODE_ENV || 'production';

  const {
    featureFlagsRefreshInterval: refreshInterval,
    featureFlagsCacheTtl: cacheTtl,
  } = getEnv();

  const cacheKey = tenantId && userId ? `ff:${tenantId}:${userId}:${environment}` : null;
  const prevCacheKey = useRef<string | null>(null);

  const readCache = (): { ts: number; flags: Flags } | null => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const cacheValid = (c: { ts: number }): boolean => Date.now() - c.ts <= cacheTtl;

  const [flags, setFlags] = useState<Flags>(() => readCache()?.flags ?? {});

  const saveCache = (next: Flags) => {
    if (!cacheKey) return;
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), flags: next }));
  };

  const fetchFlags = async () => {
    if (!tenantId || !userId) return;
    try {
      const { data, error } = await supabase.functions.invoke('evaluate_flags', {
        body: {
          tenant_id: tenantId,
          user_id: userId,
          segments: profile?.plan ? [profile.plan] : [],
          environment,
        },
      });
      if (error) throw error;
      const parsed = ResponseSchema.parse(data);
      saveCache(parsed.flags);
      setFlags(parsed.flags);
    } catch {
      const cached = readCache();
      if (cached && cacheValid(cached)) {
        setFlags(cached.flags);
      }
    }
  };

  useEffect(() => {
    globalRefresh = fetchFlags;
    return () => {
      globalRefresh = null;
    };
  }, [tenantId, userId, environment, profile?.plan, cacheKey]);

  useEffect(() => {
    if (prevCacheKey.current && prevCacheKey.current !== cacheKey) {
      localStorage.removeItem(prevCacheKey.current);
    }
    prevCacheKey.current = cacheKey;
    const cached = readCache();
    if (cached) {
      setFlags(cached.flags);
    } else {
      setFlags({});
    }
    fetchFlags();
    const id = setInterval(fetchFlags, refreshInterval);
    return () => clearInterval(id);
  }, [cacheKey, refreshInterval, tenantId, userId, environment]);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlag = (flag: string, debug = false) => {
  const flags = useContext(FeatureFlagContext);
  const value = !!flags[flag];
  const prev = useRef(value);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && debug && prev.current !== value) {
      console.debug(`[feature-flag] ${flag} ${value ? 'ON' : 'OFF'}`);
    }
    prev.current = value;
  }, [value, debug, flag]);

  return value;
};

export const refreshFeatureFlags = () => (globalRefresh ? globalRefresh() : Promise.resolve());

export type { Flags };
