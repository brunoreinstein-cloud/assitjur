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
  // Using hardcoded values as VITE_* variables are not supported by Lovable
  const supabaseUrl = 'https://fgjypmlszuzkgvhuszxn.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU';
  const siteUrl = 'https://app.assistjur.com';

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
