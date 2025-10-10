import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "./styles/assistjur-brand.css";
import { MaintenanceProvider } from "@/hooks/useMaintenance";
import { ConsentProvider } from "@/hooks/useConsent";
import { getEnv } from "@/lib/getEnv";
import { getConsent, onConsentChange } from "@/lib/consent";
import { initializeConsentAwareIntegrations } from "@/lib/consent-gates";
import { logger } from "@/lib/logger";
import { getValidatedEnv } from "@/lib/env-validation";

// ✅ SSR-safe error handling function
function showErrorPage(error: Error) {
  if (typeof window === "undefined") return;
  
  document.body.innerHTML = `
    <div style="font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px;">
      <h1 style="color: #ef4444;">⚠️ Configuração Incompleta</h1>
      <p style="font-size: 18px; line-height: 1.6;">
        Variáveis de ambiente obrigatórias não foram encontradas.
      </p>
      <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">
${error.message}
      </pre>
      <p style="margin-top: 20px;">
        <strong>Como corrigir:</strong><br>
        1. Copie o arquivo <code>.env.example</code> para <code>.env</code><br>
        2. Preencha as variáveis com seus valores reais<br>
        3. Reinicie o servidor de desenvolvimento
      </p>
    </div>
  `;
}

// ⚠️ CRITICAL: Validate environment variables before anything else
// This will throw an error if required env vars are missing
try {
  getValidatedEnv();
  logger.info("Environment variables validated successfully", {}, "MainApp");
} catch (error) {
  logger.error("Environment validation failed", { error }, "MainApp");
  console.error(error);
  
  // ✅ SSR-safe error display
  if (import.meta.env.DEV && typeof window !== "undefined") {
    showErrorPage(error instanceof Error ? error : new Error('Erro desconhecido'));
    throw error; // Stop execution
  }
}

const { sentryDsn } = getEnv();

// ✅ SSR-safe Sentry initialization with consent gate
function initializeSentry() {
  if (typeof window === "undefined" || !sentryDsn) return;
  
  // Check user consent before initializing Sentry
  const consent = getConsent();
  if (!consent.measure) {
    logger.info("Sentry initialization skipped - no analytics consent", {}, "MainApp");
    return;
  }

  import("@sentry/react")
    .then((Sentry: any) => {
      Sentry.init({ 
        dsn: sentryDsn, 
        tracesSampleRate: 1.0,
        // ✅ Additional privacy settings
        beforeSend(event: any) {
          // Remove PII from error events
          if (event.user) {
            delete event.user.email;
            delete event.user.username;
          }
          return event;
        }
      });
      logger.info("Sentry initialized successfully with consent", {}, "MainApp");
    })
    .catch(() => {
      logger.warn("Sentry not available", {}, "MainApp");
    });
}

// Initialize Sentry if consent is available
if (typeof window !== "undefined") {
  initializeSentry();
  
  // Listen for consent changes to initialize/uninitialize Sentry
  onConsentChange((consent) => {
    if (consent.measure) {
      initializeSentry();
    } else {
      // Note: Sentry doesn't have a direct way to uninitialize
      // but it will respect the consent settings going forward
      logger.info("Sentry consent revoked", {}, "MainApp");
    }
  });
}

// ✅ Initialize consent-aware integrations
if (typeof window !== "undefined") {
  initializeConsentAwareIntegrations();
}

let analyticsScript: HTMLScriptElement | null = null;
let analyticsLoadAttempted = false;

function loadAnalytics() {
  // ✅ SSR safety: Only run on client-side
  if (typeof window === "undefined") return;
  
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
  // ✅ SSR safety: Only run on client-side
  if (typeof window === "undefined") return;
  
  analyticsScript?.remove();
  analyticsScript = null;
  analyticsLoadAttempted = false;
}

// ✅ SSR-safe initialization
if (typeof window !== "undefined") {
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

  // ✅ SSR-safe root rendering
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ConsentProvider>
        <MaintenanceProvider>
          <App />
        </MaintenanceProvider>
      </ConsentProvider>
    </StrictMode>,
  );
}
