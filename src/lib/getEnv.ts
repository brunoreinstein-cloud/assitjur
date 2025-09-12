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
  const {
    VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_PUBLIC_SITE_URL,
    VITE_SENTRY_DSN,
    VITE_INACTIVITY_TIMEOUT_MINUTES,
    VITE_FEATURE_FLAGS_REFRESH_INTERVAL,
    VITE_FEATURE_FLAGS_CACHE_TTL,
    VITE_MAINTENANCE,
    VITE_ALLOWED_ORIGINS,
    VITE_EXTRA_ORIGINS,
    VITE_PREVIEW_TIMESTAMP,
  } = import.meta.env;

  if (!VITE_SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is required');
  }
  if (!VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is required');
  }
  if (!VITE_PUBLIC_SITE_URL) {
    throw new Error('VITE_PUBLIC_SITE_URL is required');
  }

  return {
    supabaseUrl: VITE_SUPABASE_URL,
    supabaseKey: VITE_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: VITE_PUBLIC_SITE_URL,
    sentryDsn: VITE_SENTRY_DSN,
    inactivityTimeoutMinutes: Number(VITE_INACTIVITY_TIMEOUT_MINUTES ?? 30),
    featureFlagsRefreshInterval: Number(VITE_FEATURE_FLAGS_REFRESH_INTERVAL ?? 60000),
    featureFlagsCacheTtl: Number(VITE_FEATURE_FLAGS_CACHE_TTL ?? 300000),
    maintenance: VITE_MAINTENANCE === 'true',
    allowedOrigins: VITE_ALLOWED_ORIGINS ?? '',
    extraOrigins: VITE_EXTRA_ORIGINS ?? '',
    previewTimestamp: VITE_PREVIEW_TIMESTAMP,
  };
}
