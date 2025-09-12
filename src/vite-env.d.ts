/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_PUBLIC_SITE_URL: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_INACTIVITY_TIMEOUT_MINUTES?: string
  readonly VITE_FEATURE_FLAGS_REFRESH_INTERVAL?: string
  readonly VITE_FEATURE_FLAGS_CACHE_TTL?: string
  readonly VITE_MAINTENANCE?: string
  readonly VITE_ALLOWED_ORIGINS?: string
  readonly VITE_EXTRA_ORIGINS?: string
  readonly VITE_PREVIEW_TIMESTAMP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
