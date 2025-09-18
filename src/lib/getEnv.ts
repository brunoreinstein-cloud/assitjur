export interface Env {
  supabaseUrl: string;
  supabaseKey: string;
  siteUrl: string;
  sentryDsn?: string;
  inactivityTimeoutMinutes: number;
  featureFlagsRefreshInterval: number;
  featureFlagsCacheTtl: number;
  maintenance: boolean;
  allowedOrigins: string;
  extraOrigins: string;
  previewTimestamp?: string;
}

export function getEnv(): Env {
  // Afrouxa exigência no prerender (postbuild em Node).
  if (process.env.PRERENDER === '1') {
    return {
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? 'https://dummy.supabase.local',
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY ?? 'anon',
      siteUrl: process.env.VITE_PUBLIC_SITE_URL ?? 'https://assistjur.com.br',
      sentryDsn: undefined,
      inactivityTimeoutMinutes: 30,
      featureFlagsRefreshInterval: 60000,
      featureFlagsCacheTtl: 300000,
      maintenance: false,
      allowedOrigins: '',
      extraOrigins: '',
      previewTimestamp: undefined,
    };
  }

  // Secure environment configuration - no hardcoded credentials
  const isNode = typeof window === 'undefined';
  const viteEnv = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) as Record<string, string | undefined> | undefined;
  const nodeEnv = isNode ? (process.env as Record<string, string | undefined>) : undefined;

  const supabaseUrl = (viteEnv?.VITE_SUPABASE_URL) || nodeEnv?.VITE_SUPABASE_URL || nodeEnv?.SUPABASE_URL;
  const supabaseKey = (viteEnv?.VITE_SUPABASE_ANON_KEY) || (viteEnv?.VITE_SUPABASE_PUBLISHABLE_KEY) || nodeEnv?.VITE_SUPABASE_ANON_KEY || nodeEnv?.VITE_SUPABASE_PUBLISHABLE_KEY || nodeEnv?.SUPABASE_ANON_KEY || nodeEnv?.SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL must be set');
  }
  if (!supabaseKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY must be set');
  }
    
  const siteUrl = (viteEnv?.VITE_PUBLIC_SITE_URL) || (viteEnv?.VITE_SITE_URL) || nodeEnv?.VITE_PUBLIC_SITE_URL || nodeEnv?.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://app.assistjur.com');

  return {
    supabaseUrl,
    supabaseKey,
    siteUrl,
    sentryDsn: undefined,
    inactivityTimeoutMinutes: 30,
    featureFlagsRefreshInterval: 60000,
    featureFlagsCacheTtl: 300000,
    maintenance: false,
    allowedOrigins: '',
    extraOrigins: '',
    previewTimestamp: undefined,
  };
}