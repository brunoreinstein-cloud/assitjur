import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "./styles/assistjur-brand.css";
import { MaintenanceProvider } from "@/hooks/useMaintenance";
import { getEnv } from "@/lib/getEnv";
import { getConsent, onConsentChange } from "@/lib/consent";
import { logger } from "@/lib/logger";
import { getValidatedEnv } from "@/lib/env-validation";

// ⚠️ CRITICAL: Validate environment variables before anything else
// This will throw an error if required env vars are missing
try {
  getValidatedEnv();
  logger.info("Environment variables validated successfully", {}, "MainApp");
} catch (error) {
  logger.error("Environment validation failed", { error }, "MainApp");
  console.error(error);
  
  // Show user-friendly error in development
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px;">
        <h1 style="color: #ef4444;">⚠️ Configuração Incompleta</h1>
        <p style="font-size: 18px; line-height: 1.6;">
          Variáveis de ambiente obrigatórias não foram encontradas.
        </p>
        <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">
${error instanceof Error ? error.message : 'Erro desconhecido'}
        </pre>
        <p style="margin-top: 20px;">
          <strong>Como corrigir:</strong><br>
          1. Copie o arquivo <code>.env.example</code> para <code>.env</code><br>
          2. Preencha as variáveis com seus valores reais<br>
          3. Reinicie o servidor de desenvolvimento
        </p>
      </div>
    `;
    throw error; // Stop execution
  }
}

const { sentryDsn } = getEnv();

// Optional Sentry initialization
if (sentryDsn) {
  import("@sentry/react")
    .then((Sentry: any) => {
      Sentry.init({ dsn: sentryDsn, tracesSampleRate: 1.0 });
      logger.info("Sentry initialized successfully", {}, "MainApp");
    })
    .catch(() => {
      logger.warn("Sentry not available", {}, "MainApp");
    });
}

// Disable PostHog analytics in development to prevent noisy reconnect warnings
if (import.meta.env.DEV) {
  (globalThis as any).posthog?.opt_out_capturing?.();
}

let analyticsScript: HTMLScriptElement | null = null;
let analyticsLoadAttempted = false;

function loadAnalytics() {
  // Skip in development to prevent noisy errors
  if (import.meta.env.DEV) {
    logger.info("Analytics disabled in development", {}, "MainApp");
    return;
  }

  // Prevent multiple load attempts
  if (analyticsScript || analyticsLoadAttempted) return;

  analyticsLoadAttempted = true;
  analyticsScript = document.createElement("script");
  analyticsScript.src = "https://assistjur.com.br/~flock.js";
  analyticsScript.defer = true;
  analyticsScript.id = "aj-flock";

  // Silent error handling for analytics failures
  analyticsScript.onerror = () => {
    logger.warn("Analytics script failed to load", {}, "MainApp");
    analyticsScript = null;
    analyticsLoadAttempted = false;
  };

  // Timeout to prevent hanging
  setTimeout(() => {
    if (analyticsScript && !document.getElementById("aj-flock")) {
      logger.warn("Analytics script load timeout", {}, "MainApp");
      analyticsScript = null;
      analyticsLoadAttempted = false;
    }
  }, 10000);

  document.head.appendChild(analyticsScript);
  logger.info("Analytics script loaded", {}, "MainApp");
}

function unloadAnalytics() {
  analyticsScript?.remove();
  analyticsScript = null;
  analyticsLoadAttempted = false;
}

// Only load analytics in production with consent
const consent = getConsent();
if (consent.measure && !import.meta.env.DEV) {
  loadAnalytics();
}

onConsentChange((c) => {
  if (c.measure && !import.meta.env.DEV) {
    loadAnalytics();
  } else {
    unloadAnalytics();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MaintenanceProvider>
      <App />
    </MaintenanceProvider>
  </StrictMode>,
);
