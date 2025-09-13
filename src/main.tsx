import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/assistjur-brand.css'
import { MaintenanceProvider } from '@/hooks/useMaintenance'
import { getEnv } from '@/lib/getEnv'
import { getConsent, onConsentChange } from '@/lib/consent'

const { sentryDsn } = getEnv()

// Optional Sentry initialization
if (sentryDsn) {
  // @ts-ignore optional dependency
  import('@sentry/react').then((Sentry) => {
    Sentry.init({ dsn: sentryDsn, tracesSampleRate: 1.0 })
  }).catch(() => {
    console.warn('Sentry not available')
  })
}

// Disable PostHog analytics in development to prevent noisy reconnect warnings
if (import.meta.env.DEV) {
  ;(globalThis as any).posthog?.opt_out_capturing?.()
}

let analyticsScript: HTMLScriptElement | null = null

function loadAnalytics() {
  if (analyticsScript) return
  analyticsScript = document.createElement('script')
  analyticsScript.src = 'https://assistjur.com.br/~flock.js'
  analyticsScript.defer = true
  analyticsScript.id = 'aj-flock'
  document.head.appendChild(analyticsScript)
}

function unloadAnalytics() {
  analyticsScript?.remove()
  analyticsScript = null
}

const consent = getConsent()
if (consent.measure) {
  loadAnalytics()
}

onConsentChange((c) => {
  if (c.measure) {
    loadAnalytics()
  } else {
    unloadAnalytics()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MaintenanceProvider>
      <App />
    </MaintenanceProvider>
  </StrictMode>
)
