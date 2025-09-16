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
  // Environment-aware configuration with fallbacks for development
  const supabaseUrl = import.meta.env.PROD 
    ? 'https://fgjypmlszuzkgvhuszxn.supabase.co'
    : (import.meta.env.VITE_SUPABASE_URL || 'https://fgjypmlszuzkgvhuszxn.supabase.co');
  
  const supabaseKey = import.meta.env.PROD
    ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU'
    : (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU');
    
  const siteUrl = import.meta.env.PROD 
    ? 'https://app.assistjur.com'
    : (import.meta.env.VITE_SITE_URL || window?.location?.origin || 'https://app.assistjur.com');

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
