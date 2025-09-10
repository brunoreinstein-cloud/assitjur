import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { track } from './lib/analytics'

// Disable PostHog analytics in development to prevent noisy reconnect warnings
if (import.meta.env.DEV) {
  ;(globalThis as any).posthog?.opt_out_capturing?.()
}

;(globalThis as any).track = track

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
