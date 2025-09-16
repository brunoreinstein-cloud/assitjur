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
  // Secure environment configuration - no hardcoded credentials
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fgjypmlszuzkgvhuszxn.supabase.co';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY must be set');
  }
    
  const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || 
                  import.meta.env.VITE_SITE_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : 'https://app.assistjur.com');

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
