import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Silence PostHog analytics in development to avoid reconnect warnings
if (import.meta.env.DEV) {
  (window as any).posthog?.opt_out_capturing?.()
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
