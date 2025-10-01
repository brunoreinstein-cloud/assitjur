import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import './styles/assistjur-brand.css'
import { MaintenanceProvider } from '@/hooks/useMaintenance'
import { getEnv } from '@/lib/getEnv'
import { getConsent, onConsentChange } from '@/lib/consent'
import { logger } from '@/lib/logger'

const { sentryDsn } = getEnv()

// Optional Sentry initialization
if (sentryDsn) {
  import('@sentry/react').then((Sentry: any) => {
    Sentry.init({ dsn: sentryDsn, tracesSampleRate: 1.0 })
    logger.info('Sentry initialized successfully', {}, 'MainApp')
  }).catch(() => {
    logger.warn('Sentry not available', {}, 'MainApp')
  })
}

// Disable PostHog analytics in development to prevent noisy reconnect warnings
if (import.meta.env.DEV) {
  ;(globalThis as any).posthog?.opt_out_capturing?.()
}

let analyticsScript: HTMLScriptElement | null = null
let analyticsLoadAttempted = false

function loadAnalytics() {
  // Skip in development to prevent noisy errors
  if (import.meta.env.DEV) {
    logger.info('Analytics disabled in development', {}, 'MainApp')
    return
  }

  // Prevent multiple load attempts
  if (analyticsScript || analyticsLoadAttempted) return
  
  analyticsLoadAttempted = true
  analyticsScript = document.createElement('script')
  analyticsScript.src = 'https://assistjur.com.br/~flock.js'
  analyticsScript.defer = true
  analyticsScript.id = 'aj-flock'
  
  // Silent error handling for analytics failures
  analyticsScript.onerror = () => {
    logger.warn('Analytics script failed to load', {}, 'MainApp')
    analyticsScript = null
    analyticsLoadAttempted = false
  }
  
  // Timeout to prevent hanging
  setTimeout(() => {
    if (analyticsScript && !document.getElementById('aj-flock')) {
      logger.warn('Analytics script load timeout', {}, 'MainApp')
      analyticsScript = null
      analyticsLoadAttempted = false
    }
  }, 10000)
  
  document.head.appendChild(analyticsScript)
  logger.info('Analytics script loaded', {}, 'MainApp')
}

function unloadAnalytics() {
  analyticsScript?.remove()
  analyticsScript = null
  analyticsLoadAttempted = false
}

// Only load analytics in production with consent
const consent = getConsent()
if (consent.measure && !import.meta.env.DEV) {
  loadAnalytics()
}

onConsentChange((c) => {
  if (c.measure && !import.meta.env.DEV) {
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
