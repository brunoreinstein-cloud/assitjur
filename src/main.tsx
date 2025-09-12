import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { MaintenanceProvider } from '@/hooks/useMaintenance'

// Optional Sentry initialization
if (import.meta.env.VITE_SENTRY_DSN) {
  // @ts-ignore optional dependency
  import('@sentry/react').then((Sentry) => {
    Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 1.0 })
  }).catch(() => {
    console.warn('Sentry not available')
  })
}

// Disable PostHog analytics in development to prevent noisy reconnect warnings
if (import.meta.env.DEV) {
  ;(globalThis as any).posthog?.opt_out_capturing?.()
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MaintenanceProvider>
      <App />
    </MaintenanceProvider>
  </StrictMode>
);
