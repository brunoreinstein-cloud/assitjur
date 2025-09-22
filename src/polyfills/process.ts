// Polyfill para process no browser
if (typeof window !== 'undefined' && typeof process === 'undefined') {
  (globalThis as any).process = {
    env: {
      NODE_ENV: import.meta.env.MODE,
      PRERENDER: import.meta.env.VITE_PRERENDER || '0',
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_PUBLIC_SITE_URL: import.meta.env.VITE_PUBLIC_SITE_URL,
      VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
    },
    version: '18.0.0',
    platform: 'browser',
    arch: 'x64',
  };
}